import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Forbidden: Lecturer privileges required" }, { status: 403 });
  }

  try {
    const { submissionIds, assessmentId } = await req.json();

    let targetSubmissionIds: string[] = [];

    if (Array.isArray(submissionIds) && submissionIds.length > 0) {
      targetSubmissionIds = submissionIds;
    } else if (assessmentId) {
      const subs = await prisma.submission.findMany({
        where: { assessmentId },
        select: { id: true }
      });
      targetSubmissionIds = subs.map((s) => s.id);
    } else {
      // If no submissionIds provided, release all submissions for teacher's organization
      const subs = await prisma.submission.findMany({
        where: {
          assessment: {
            organizationId: session.organizationId || undefined
          }
        },
        select: { id: true }
      });
      targetSubmissionIds = subs.map((s) => s.id);
    }

    if (targetSubmissionIds.length === 0) {
      return NextResponse.json({ message: "No eligible completed submissions found to release.", releasedCount: 0 });
    }

    let releasedCount = 0;

    for (const subId of targetSubmissionIds) {
      const submission = await prisma.submission.findUnique({
        where: { id: subId },
        include: {
          aiAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
          finalGrades: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      });

      if (!submission) continue;

      const ai = submission.aiAssessments[0];
      const existingGrade = submission.finalGrades[0];

      if (!existingGrade && ai) {
        // Automatically create LecturerReview & FinalGrade if not existing
        const review = await prisma.lecturerReview.create({
          data: {
            submissionId: subId,
            aiAssessmentId: ai.id,
            reviewerId: session.userId,
            status: "APPROVED",
            finalTaskFulfillment: ai.taskFulfillmentScore,
            finalOrganization: ai.organizationScore,
            finalVocabulary: ai.vocabularyScore,
            finalGrammar: ai.grammarScore,
            finalTotal: ai.total,
            scoreDifference: 0,
            comment: "Duyệt tự động theo Điểm gợi ý AI khi Giáo viên công bố kết quả."
          }
        });

        await prisma.finalGrade.create({
          data: {
            submissionId: subId,
            aiAssessmentId: ai.id,
            lecturerReviewId: review.id,
            finalTotal: ai.total,
            status: "RELEASED",
            releasedAt: new Date()
          }
        });
      } else if (existingGrade) {
        await prisma.finalGrade.update({
          where: { id: existingGrade.id },
          data: {
            status: "RELEASED",
            releasedAt: new Date()
          }
        });
      }

      // Update submission status to RELEASED
      await prisma.submission.update({
        where: { id: subId },
        data: { status: "RELEASED" }
      });

      releasedCount++;
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: "RESULTS_RELEASED",
        entityType: "Submission",
        entityId: targetSubmissionIds.join(","),
        newValue: JSON.stringify({ releasedCount })
      }
    });

    return NextResponse.json({
      success: true,
      releasedCount
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
