import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSystemConfig } from "@/lib/systemConfig";

export async function GET(req: NextRequest) {
  try {
    const sysConfig = getSystemConfig();
    const configPlanLimits: Record<string, number> = {};
    sysConfig.plans.forEach((p) => {
      configPlanLimits[p.code] = p.monthlyLimit;
    });

    // 1. Fetch Real Organizations with Subscriptions and Counts
    const rawOrgs = await prisma.organization.findMany({
      include: {
        subscription: {
          include: { plan: true }
        },
        members: {
          select: { id: true, orgRole: true }
        },
        _count: {
          select: { students: true, members: true, assessments: true, courses: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Filter out pure student personal workspaces (only keep Lecturers, Centers, & Paid plans)
    const orgs = rawOrgs.filter((o) => {
      const isPaid = o.subscription?.plan?.code && o.subscription.plan.code !== "TRIAL";
      const hasTeacherOrAdmin = o.members.some(
        (m) => m.orgRole === "LECTURER" || m.orgRole === "ORG_ADMIN" || m.orgRole === "SUPER_ADMIN" || m.orgRole === "REVIEWER"
      );
      return isPaid || hasTeacherOrAdmin;
    });

    // 2. Fetch Real Users List from Database
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        globalRole: true,
        isActive: true,
        createdAt: true,
        memberships: {
          include: {
            organization: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 3. Fetch Real Submissions & Exam Type Breakdown
    let totalSubmissions = 0;
    let gradedSubmissions = 0;
    let vstepCount = 0;
    let ieltsCount = 0;
    let toeicCount = 0;
    let otherCount = 0;

    try {
      totalSubmissions = await prisma.submission.count();
      gradedSubmissions = await prisma.submission.count({
        where: { status: { in: ["GRADED", "REVIEWED", "APPROVED"] } }
      });

      const submissionsWithExam: any = await prisma.submission.findMany({
        include: {
          assessment: true
        }
      });

      submissionsWithExam.forEach((sub: any) => {
        const type = sub.assessment?.examType?.toUpperCase();
        if (type === "VSTEP") vstepCount++;
        else if (type === "IELTS") ieltsCount++;
        else if (type === "TOEIC") toeicCount++;
        else otherCount++;
      });
    } catch (e) {
      console.warn("Submissions query warning:", e);
    }

    // 4. Fetch Real Audit Logs / Payment Transfer Requests
    let auditLogs: any[] = [];
    try {
      auditLogs = await prisma.auditLog.findMany({
        where: {
          action: { in: ["PAYMENT_PENDING", "PAYMENT_APPROVED"] }
        },
        include: {
          organization: { select: { name: true, slug: true } },
          user: { select: { email: true, fullName: true } }
        },
        orderBy: { timestamp: "desc" },
        take: 20
      });
    } catch (e) {
      console.warn("Audit log query warning:", e);
    }

    // 5. User Role Counts from globalRole
    const userRoleCounts = await prisma.user.groupBy({
      by: ["globalRole"],
      _count: { id: true }
    });

    const roleMap = {
      SUPER_ADMIN: 0,
      LECTURER: 0,
      STUDENT: 0,
      REVIEWER: 0
    };

    userRoleCounts.forEach((r) => {
      if (r.globalRole in roleMap) {
        roleMap[r.globalRole as keyof typeof roleMap] = r._count.id;
      }
    });

    // 6. Calculate Total Revenue in VNĐ
    let totalRevenueVnd = 0;
    orgs.forEach((o) => {
      const code = o.subscription?.plan?.code;
      const status = o.subscription?.status;
      if (status === "PAID" || status === "APPROVED") {
        if (code === "INDIVIDUAL") totalRevenueVnd += 690000;
        else if (code === "PRO" || code === "PROFESSIONAL") totalRevenueVnd += 1890000;
        else if (code === "CENTER") totalRevenueVnd += 4690000;
      }
    });

    // 7. Map Organizations to Clean DTO
    const orgList = orgs.map((o) => {
      const code = o.subscription?.plan?.code || "TRIAL";
      const matchedPlan = sysConfig.plans.find((p) => p.code === code);
      const limit = configPlanLimits[code] ?? matchedPlan?.monthlyLimit ?? 5;
      const nameVi = matchedPlan?.nameVi || (code === "TRIAL" ? "DÙNG THỬ MIỄN PHÍ" : code === "PRO" ? "GIÁO VIÊN PRO" : code === "CENTER" ? "TRUNG TÂM NGOẠI NGỮ" : "GIÁO VIÊN ĐỘC LẬP");

      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        planCode: code,
        planName: nameVi,
        usageCount: o.subscription?.usageCount || 0,
        monthlyLimit: limit,
        studentCount: o._count.students || 0,
        classCount: o._count.courses || 0,
        createdAt: o.createdAt.toISOString().split("T")[0]
      };
    });

    // 8. Map Users to Clean DTO
    const userList = dbUsers.map((u) => ({
      id: u.id,
      name: u.fullName || u.email.split("@")[0],
      email: u.email,
      role: u.globalRole || "STUDENT",
      orgName: u.memberships?.[0]?.organization?.name || "Cá nhân",
      status: u.isActive !== false ? "ACTIVE" : "LOCKED",
      createdAt: u.createdAt.toISOString().split("T")[0]
    }));

    // 9. Map Payments / Audit Logs to Clean DTO
    const paymentList = auditLogs.map((log) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(log.newValue || "{}");
      } catch (e) {}

      return {
        id: log.id,
        orgName: log.organization?.name || "Đơn vị chưa định danh",
        userEmail: log.user?.email || "user@system.edu",
        planCode: parsed.planCode || "PRO",
        planName: parsed.planName || "Gói Dịch Vụ AI",
        amountVnd: parsed.planCode === "CENTER" ? "4.690.000 VNĐ" : parsed.planCode === "PRO" ? "1.890.000 VNĐ" : "690.000 VNĐ",
        transferCode: `NAP ${parsed.planCode || "PRO"} ${log.organization?.slug || "org"}`,
        createdAt: log.timestamp ? log.timestamp.toISOString().replace("T", " ").substring(0, 16) : "2026-08-24 12:00",
        status: log.action === "PAYMENT_APPROVED" ? "APPROVED" : "PENDING"
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalSubmissions,
        gradedSubmissions,
        totalRevenueVnd,
        totalOrgs: orgs.length,
        totalUsers: dbUsers.length,
        userRoleCounts: roleMap,
        examStats: {
          vstep: vstepCount,
          ielts: ieltsCount,
          toeic: toeicCount,
          other: otherCount
        }
      },
      organizations: orgList,
      users: userList,
      payments: paymentList
    });
  } catch (err: unknown) {
    console.error("CRITICAL ADMIN METRICS API ERROR:", err);
    const msg = err instanceof Error ? err.message : "Error fetching admin metrics";
    return NextResponse.json({ error: msg, details: String(err) }, { status: 500 });
  }
}
