import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function checkAndResetMonthlyQuota(organizationId: string) {
  try {
    const sub = await prisma.organizationSubscription.findUnique({
      where: { organizationId }
    });

    if (!sub) return;

    const now = new Date();
    const periodStart = new Date(sub.currentPeriodStart);

    // Check if current date is in a different calendar month or year
    const isNewMonth =
      now.getMonth() !== periodStart.getMonth() ||
      now.getFullYear() !== periodStart.getFullYear();

    if (isNewMonth) {
      await prisma.organizationSubscription.update({
        where: { organizationId },
        data: {
          usageCount: 0,
          currentPeriodStart: now
        }
      });
      console.log(`[Auto Monthly Reset] Org ${organizationId} usage reset to 0 for ${now.getMonth() + 1}/${now.getFullYear()}`);
    }
  } catch (error) {
    console.error("Error checking monthly quota reset:", error);
  }
}
