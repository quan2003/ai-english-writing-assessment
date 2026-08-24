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
      createdAt: true,
      memberships: {
        include: { organization: true }
      }
    }
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.userId;

    // Delete student profiles
    await prisma.student.deleteMany({
      where: { userId }
    });

    // Delete organization memberships
    await prisma.organizationMember.deleteMany({
      where: { userId }
    });

    // Delete audit logs
    await prisma.auditLog.deleteMany({
      where: { userId }
    });

    // Delete user from Database
    await prisma.user.delete({
      where: { id: userId }
    });

    // Clear session cookies
    const response = NextResponse.json({
      success: true,
      message: "Account deleted permanently"
    });

    response.cookies.delete("user_id");
    response.cookies.delete("organization_id");

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
