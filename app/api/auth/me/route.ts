import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      globalRole: true,
      avatarUrl: true,
      memberships: {
        include: {
          organization: true
        }
      }
    }
  });

  return NextResponse.json({
    session,
    user,
    activeOrganizationId: session.organizationId,
    activeRole: session.orgRole || session.globalRole
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, roleOverride } = await req.json();

    // Development role-switch convenience handler
    if (process.env.NODE_ENV === "development" && roleOverride) {
      const userWithRole = await prisma.user.findFirst({
        where: { globalRole: roleOverride },
        include: { memberships: true }
      });

      if (userWithRole) {
        const response = NextResponse.json({
          session: {
            userId: userWithRole.id,
            email: userWithRole.email,
            fullName: userWithRole.fullName,
            globalRole: userWithRole.globalRole,
            organizationId: userWithRole.memberships[0]?.organizationId,
            orgRole: userWithRole.memberships[0]?.orgRole || userWithRole.globalRole
          }
        });

        response.cookies.set("user_id", userWithRole.id, { httpOnly: true, path: "/" });
        if (userWithRole.memberships[0]?.organizationId) {
          response.cookies.set("organization_id", userWithRole.memberships[0].organizationId, { httpOnly: true, path: "/" });
        }
        return response;
      }
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { memberships: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials or account disabled" }, { status: 401 });
    }

    const { comparePassword } = await import("@/lib/auth");
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const activeOrgId = user.memberships[0]?.organizationId;
    const activeRole = user.memberships[0]?.orgRole || user.globalRole;

    const response = NextResponse.json({
      session: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        globalRole: user.globalRole,
        organizationId: activeOrgId,
        orgRole: activeRole
      }
    });

    response.cookies.set("user_id", user.id, { httpOnly: true, path: "/" });
    if (activeOrgId) {
      response.cookies.set("organization_id", activeOrgId, { httpOnly: true, path: "/" });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication failure";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("user_id");
  response.cookies.delete("organization_id");
  return response;
}

