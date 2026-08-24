import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submissionId");
  const organizationId = searchParams.get("organizationId") || session.organizationId;

  const reviews = await prisma.lecturerReview.findMany({
    where: {
      ...(submissionId ? { submissionId } : {}),
      submission: {
        assessment: {
          organizationId: organizationId || undefined
        }
      }
    },
    include: {
      reviewer: { select: { id: true, fullName: true, email: true } },
      aiAssessment: true,
      submission: { include: { student: true, assessment: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER", "REVIEWER"])) {
    return NextResponse.json({ error: "Forbidden: Lecturer privileges required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      submissionId,
      aiAssessmentId,
      status, // APPROVED, MODIFIED, FLAGGED, NEEDS_ADJUDICATION
      finalTaskFulfillment,
      finalOrganization,
      finalVocabulary,
      finalGrammar,
      finalTotal,
      comment
    } = body;

    if (!submissionId || !aiAssessmentId || finalTotal === undefined) {
      return NextResponse.json({ error: "submissionId, aiAssessmentId, and finalTotal are required" }, { status: 400 });
    }

    const aiAssessment = await prisma.aIAssessment.findUnique({
      where: { id: aiAssessmentId },
      include: { submission: { include: { assessment: true } } }
    });

    if (!aiAssessment) {
      return NextResponse.json({ error: "AI Assessment not found" }, { status: 404 });
    }

    const scoreDifference = Math.round((finalTotal - aiAssessment.total) * 10) / 10;

    // Save Lecturer Review (Immutable audit record)
    const review = await prisma.lecturerReview.create({
      data: {
        submissionId,
        aiAssessmentId,
        reviewerId: session.userId,
        status: status || "APPROVED",
        finalTaskFulfillment: finalTaskFulfillment !== undefined ? Number(finalTaskFulfillment) : aiAssessment.taskFulfillmentScore,
        finalOrganization: finalOrganization !== undefined ? Number(finalOrganization) : aiAssessment.organizationScore,
        finalVocabulary: finalVocabulary !== undefined ? Number(finalVocabulary) : aiAssessment.vocabularyScore,
        finalGrammar: finalGrammar !== undefined ? Number(finalGrammar) : aiAssessment.grammarScore,
        finalTotal: Number(finalTotal),
        scoreDifference,
        comment: comment || null
      }
    });

    // Create Final Grade Record (never overwrites historic AIAssessment)
    const finalGrade = await prisma.finalGrade.create({
      data: {
        submissionId,
        aiAssessmentId,
        lecturerReviewId: review.id,
        finalTotal: Number(finalTotal),
        status: "RELEASED",
        releasedAt: new Date()
      }
    });

    // Update submission status
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "COMPLETED" }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId: aiAssessment.submission.assessment.organizationId,
        userId: session.userId,
        action: `LECTURER_SCORE_${status || "APPROVED"}`,
        entityType: "LecturerReview",
        entityId: review.id,
        oldValue: JSON.stringify({ aiTotal: aiAssessment.total }),
        newValue: JSON.stringify({ finalTotal, status: review.status, comment })
      }
    });

    return NextResponse.json({ review, finalGrade }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
