import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

export type UserSession = {
  userId: string;
  email: string;
  fullName: string;
  globalRole: string; // SUPER_ADMIN, ORG_ADMIN, LECTURER, REVIEWER, STUDENT
  organizationId?: string;
  orgRole?: string;
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Extracts session from user_id cookie or x-user-id header
 */
export async function getSession(req: NextRequest): Promise<UserSession | null> {
  const userIdCookie = req.cookies.get("user_id")?.value;
  const authHeader = req.headers.get("x-user-id") || userIdCookie;
  const orgHeader = req.headers.get("x-organization-id") || req.cookies.get("organization_id")?.value;

  if (authHeader) {
    const user = await prisma.user.findUnique({
      where: { id: authHeader },
      include: { memberships: true }
    });

    if (user && user.isActive) {
      const activeOrgId = orgHeader || user.memberships[0]?.organizationId;
      const membership = user.memberships.find((m) => m.organizationId === activeOrgId);

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        globalRole: user.globalRole,
        organizationId: activeOrgId,
        orgRole: membership?.orgRole || user.globalRole
      };
    }
  }

  return null;
}

export function authorizeRole(session: UserSession | null, allowedRoles: string[]): boolean {
  if (!session) return false;
  if (session.globalRole === "SUPER_ADMIN") return true;
  const effectiveRole = session.orgRole || session.globalRole;
  return allowedRoles.includes(effectiveRole);
}
