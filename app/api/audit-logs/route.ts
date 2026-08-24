import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId") || session.organizationId;
  const action = searchParams.get("action");

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      ...(organizationId && session.globalRole !== "SUPER_ADMIN" ? { organizationId } : {}),
      ...(action ? { action } : {})
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, globalRole: true } },
      organization: { select: { id: true, name: true, slug: true } }
    },
    orderBy: { timestamp: "desc" },
    take: 100
  });

  return NextResponse.json(auditLogs);
}
