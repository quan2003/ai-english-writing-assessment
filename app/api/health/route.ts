import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN"])) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    // DB Check
    let dbStatus = "HEALTHY";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "UNHEALTHY";
    }

    // AI Service check (Key present)
    const aiConfigured = Boolean(process.env.OPENAI_API_KEY);

    // Job Stats
    const queuedJobs = await prisma.gradingJob.count({ where: { status: "QUEUED" } });
    const processingJobs = await prisma.gradingJob.count({ where: { status: "PROCESSING" } });
    const failedJobs = await prisma.gradingJob.count({ where: { status: "FAILED" } });
    const completedJobs = await prisma.gradingJob.count({ where: { status: "COMPLETED" } });

    // Latency aggregation
    const usageAggregate = await prisma.usageRecord.aggregate({
      _avg: { latencyMs: true },
      _count: { id: true }
    });

    // Recent Failed Jobs (Admins only)
    const recentFailures = await prisma.gradingJob.findMany({
      where: { status: "FAILED" },
      orderBy: { queuedAt: "desc" },
      take: 5,
      select: {
        id: true,
        errorMessage: true,
        queuedAt: true,
        submissionId: true
      }
    });

    return NextResponse.json({
      status: dbStatus === "HEALTHY" && aiConfigured ? "HEALTHY" : "DEGRADED",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      aiService: {
        configured: aiConfigured,
        model: process.env.OPENAI_MODEL || "gpt-4o-2024-11-20"
      },
      jobs: {
        queued: queuedJobs,
        processing: processingJobs,
        failed: failedJobs,
        completed: completedJobs
      },
      performance: {
        avgLatencyMs: Math.round(usageAggregate._avg.latencyMs || 0),
        totalGradingRequests: usageAggregate._count.id
      },
      recentFailures
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
