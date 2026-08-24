import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, role } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Full name, email, and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered. Please sign in instead." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "STUDENT" ? "STUDENT" : "LECTURER";

    // Create a NEW dedicated Workspace / Organization for the new user
    const slug = `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
    const org = await prisma.organization.create({
      data: {
        name: `${fullName.trim()}'s Writing Workspace`,
        slug,
        primaryColor: "#4f46e5",
        disagreementThreshold: 1.0,
        requireReview: true
      }
    });

    // Assign Trial Plan with 0 usage to new workspace
    let trialPlan = await prisma.subscriptionPlan.findUnique({ where: { code: "TRIAL" } });
    if (!trialPlan) {
      trialPlan = await prisma.subscriptionPlan.create({
        data: {
          name: "Free Trial",
          code: "TRIAL",
          maxUsers: 10,
          monthlyGradingLimit: 50
        }
      });
    }

    await prisma.organizationSubscription.create({
      data: {
        organizationId: org.id,
        planId: trialPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageCount: 0
      }
    });

    // Create User
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        passwordHash,
        globalRole: userRole
      }
    });

    // Create Organization Membership
    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        orgRole: userRole
      }
    });

    // Create Student profile if role is student
    if (userRole === "STUDENT") {
      await prisma.student.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          studentIdCode: `STU-${Date.now().toString().slice(-6)}`,
          fullName: user.fullName,
          email: user.email
        }
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Account registered successfully",
      session: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        globalRole: user.globalRole,
        organizationId: org.id,
        orgRole: userRole
      }
    });

    response.cookies.set("user_id", user.id, { httpOnly: true, path: "/" });
    response.cookies.set("organization_id", org.id, { httpOnly: true, path: "/" });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failure";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
