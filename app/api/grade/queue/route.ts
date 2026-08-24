import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateGradingFingerprint, processGradingJob } from "@/lib/grading-service";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { submissionId, regrade } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assessment: true,
        aiAssessments: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const gradingFingerprint = generateGradingFingerprint(
      submission.essayText,
      submission.assessment.task,
      submission.assessment.rubricVersion,
      submission.assessment.promptVersion
    );

    // IDEMPOTENCY CHECK: Reuse completed assessment if fingerprint matches and regrade is false
    if (!regrade && submission.aiAssessments.length > 0) {
      const existing = submission.aiAssessments[0];
      if (existing.gradingFingerprint === gradingFingerprint) {
        return NextResponse.json({
          status: "COMPLETED",
          isCached: true,
          aiAssessment: existing
        });
      }
    }

    // Enqueue Async Job
    const job = await prisma.gradingJob.create({
      data: {
        submissionId: submission.id,
        gradingFingerprint,
        status: "QUEUED"
      }
    });

    // Process job in background
    processGradingJob(job.id).catch((err) => console.error("Worker background error:", err));

    return NextResponse.json({
      status: "QUEUED",
      jobId: job.id,
      gradingFingerprint
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
