import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orgId, name, planCode, action } = body;

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    if (name) {
      const updated = await prisma.organization.update({
        where: { id: orgId },
        data: { name: name.trim() }
      });
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật tên đơn vị thành "${updated.name}"`,
        organization: updated
      });
    }

    if (action === "RESET_USAGE") {
      const sub = await prisma.organizationSubscription.findUnique({ where: { organizationId: orgId } });
      if (sub) {
        await prisma.organizationSubscription.update({
          where: { organizationId: orgId },
          data: { usageCount: 0, currentPeriodStart: new Date() }
        });
      }
      return NextResponse.json({
        success: true,
        message: "Đã đặt lại số lượt chấm AI về 0 cho tháng mới"
      });
    }

    if (planCode) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
      if (plan) {
        await prisma.organizationSubscription.upsert({
          where: { organizationId: orgId },
          update: { planId: plan.id, status: "ACTIVE" },
          create: {
            organizationId: orgId,
            planId: plan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        });

        return NextResponse.json({
          success: true,
          message: `Đã chuyển đổi đơn vị sang gói ${plan.name}`
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating org admin action:", error);
    return NextResponse.json({ error: error.message || "Failed to update org" }, { status: 500 });
  }
}
