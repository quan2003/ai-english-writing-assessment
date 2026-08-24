import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_LIMITS: Record<string, { name: string; monthlyGradingLimit: number; maxUsers: number }> = {
  TRIAL: { name: "Free Trial", monthlyGradingLimit: 50, maxUsers: 10 },
  INDIVIDUAL: { name: "Individual Teacher", monthlyGradingLimit: 500, maxUsers: 50 },
  PRO: { name: "Teacher Pro", monthlyGradingLimit: 2000, maxUsers: 200 },
  CENTER: { name: "Language Center", monthlyGradingLimit: 10000, maxUsers: 1000 }
};

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { planCode } = body;

    if (!planCode || !PLAN_LIMITS[planCode]) {
      return NextResponse.json({ error: "Invalid plan code" }, { status: 400 });
    }

    const orgId = session.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    const config = PLAN_LIMITS[planCode];

    // Find or create SubscriptionPlan in DB
    let plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: config.name,
          code: planCode,
          monthlyGradingLimit: config.monthlyGradingLimit,
          maxUsers: config.maxUsers
        }
      });
    }

    // Upsert Organization Subscription
    const updatedSub = await prisma.organizationSubscription.upsert({
      where: { organizationId: orgId },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      create: {
        organizationId: orgId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageCount: 0
      },
      include: { plan: true }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId: session.userId,
        action: "SUBSCRIPTION_UPGRADED",
        entityType: "OrganizationSubscription",
        entityId: updatedSub.id,
        newValue: JSON.stringify({ planCode, planName: plan.name })
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}`,
      subscription: updatedSub
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error upgrading subscription";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
