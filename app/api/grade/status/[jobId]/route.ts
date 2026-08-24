import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.gradingJob.findUnique({
    where: { id: jobId },
    include: {
      submission: {
        include: {
          aiAssessments: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      }
    }
  });

  if (!job) {
    return NextResponse.json({ error: "Grading job not found" }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    errorMessage: job.errorMessage,
    attemptCount: job.attemptCount,
    aiAssessment: job.submission.aiAssessments[0] || null
  });
}
