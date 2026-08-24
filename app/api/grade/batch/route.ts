import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateGradingFingerprint, processGradingJob } from "@/lib/grading-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all submissions in the system that do not have AI assessments yet
    const pendingSubmissions = await prisma.submission.findMany({
      where: {
        aiAssessments: { none: {} }
      },
      include: {
        assessment: true
      },
      take: 20
    });

    if (pendingSubmissions.length === 0) {
      return NextResponse.json({
        message: "Hiện tại không có bài nộp nào đang chờ chấm AI.",
        processedCount: 0
      });
    }

    let processedCount = 0;

    for (const sub of pendingSubmissions) {
      try {
        const fingerprint = generateGradingFingerprint(
          sub.essayText,
          sub.assessment?.task || "",
          sub.assessment?.rubricVersion || "writing-rubric-v2.0",
          sub.assessment?.promptVersion || "writing-grader-v3.2"
        );

        const job = await prisma.gradingJob.create({
          data: {
            submissionId: sub.id,
            gradingFingerprint: fingerprint,
            status: "QUEUED"
          }
        });

        // Run AI grading in background
        await processGradingJob(job.id);
        processedCount++;
      } catch (err) {
        console.error(`Error batch grading submission ${sub.id}:`, err);
      }
    }

    return NextResponse.json({
      message: `Đã kích hoạt AI chấm bài hàng loạt thành công cho ${processedCount} bài nộp trong hàng chờ!`,
      processedCount
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch grading failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
