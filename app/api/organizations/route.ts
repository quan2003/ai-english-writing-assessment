import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userOrgs = await prisma.organizationMember.findMany({
    where: { userId: session.userId },
    include: {
      organization: {
        include: {
          subscription: {
            include: { plan: true }
          },
          _count: {
            select: { members: true, courses: true, students: true, assessments: true }
          }
        }
      }
    }
  });

  const orgs = userOrgs.map((m) => m.organization);

  // If user has active session orgId, put it first
  if (session.organizationId) {
    orgs.sort((a, b) => (a.id === session.organizationId ? -1 : b.id === session.organizationId ? 1 : 0));
  }

  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN"])) {
    return NextResponse.json({ error: "Forbidden: Higher privileges required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, logoUrl, primaryColor, disagreementThreshold, planCode } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const existingSlug = await prisma.organization.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: "Organization slug already exists" }, { status: 400 });
    }

    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { code: planCode || "TRIAL" }
    });

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || "#1e40af",
        disagreementThreshold: disagreementThreshold || 1.0,
        members: {
          create: {
            userId: session.userId,
            orgRole: "ORG_ADMIN"
          }
        },
        subscription: defaultPlan
          ? {
              create: {
                planId: defaultPlan.id,
                status: "ACTIVE",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                usageCount: 0
              }
            }
          : undefined
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: session.userId,
        action: "ORGANIZATION_CREATED",
        entityType: "Organization",
        entityId: org.id,
        newValue: JSON.stringify({ name, slug })
      }
    });

    return NextResponse.json(org, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
