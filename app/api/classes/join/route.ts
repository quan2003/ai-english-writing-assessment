import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { classCode } = await req.json();
    if (!classCode) {
      return NextResponse.json({ error: "Class code is required" }, { status: 400 });
    }

    const targetClass = await prisma.classGroup.findUnique({
      where: { classCode: classCode.trim().toUpperCase() },
      include: {
        course: {
          include: { organization: true }
        }
      }
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: "Mã tham gia lớp không hợp lệ. Vui lòng kiểm tra lại mã từ giáo viên." },
        { status: 404 }
      );
    }

    const orgId = targetClass.course.organizationId;

    // Add user as OrganizationMember (STUDENT)
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: session.userId
        }
      },
      update: { orgRole: "STUDENT" },
      create: {
        organizationId: orgId,
        userId: session.userId,
        orgRole: "STUDENT"
      }
    });

    // Check or create student profile for authenticated user
    let student = await prisma.student.findUnique({
      where: { userId: session.userId }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          organizationId: orgId,
          userId: session.userId,
          studentIdCode: `STU-${Date.now().toString().slice(-6)}`,
          fullName: session.fullName,
          email: session.email,
          classGroupId: targetClass.id
        }
      });
    } else {
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          organizationId: orgId,
          classGroupId: targetClass.id
        }
      });
    }

    // Enroll in course
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: targetClass.courseId } },
      update: {},
      create: { studentId: student.id, courseId: targetClass.courseId }
    });

    return NextResponse.json({
      success: true,
      message: `Đã tham gia thành công lớp: ${targetClass.name}`,
      activeClass: {
        id: targetClass.id,
        name: targetClass.name,
        classCode: targetClass.classCode,
        examTarget: targetClass.examTarget,
        targetScore: targetClass.targetScore,
        organizationId: orgId,
        organizationName: targetClass.course.organization.name
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error joining class";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
