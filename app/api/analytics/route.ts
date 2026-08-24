import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId") || session.organizationId;
  const courseId = searchParams.get("courseId");
  const assessmentId = searchParams.get("assessmentId");

  if (!organizationId) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
  }

  // Fetch AI Assessments & Final Grades
  const aiAssessments = await prisma.aIAssessment.findMany({
    where: {
      submission: {
        assessment: {
          organizationId,
          ...(courseId ? { courseId } : {}),
          ...(assessmentId ? { id: assessmentId } : {})
        }
      }
    },
    include: {
      submission: { include: { student: true, assessment: true } }
    }
  });

  const finalGrades = await prisma.finalGrade.findMany({
    where: {
      submission: {
        assessment: {
          organizationId,
          ...(courseId ? { courseId } : {}),
          ...(assessmentId ? { id: assessmentId } : {})
        }
      }
    }
  });

  const lecturerReviews = await prisma.lecturerReview.findMany({
    where: {
      submission: {
        assessment: {
          organizationId,
          ...(courseId ? { courseId } : {}),
          ...(assessmentId ? { id: assessmentId } : {})
        }
      }
    }
  });

  const totalSubmissions = aiAssessments.length;
  if (totalSubmissions === 0) {
    return NextResponse.json({
      totalSubmissions: 0,
      meanAiTotal: 0,
      meanFinalTotal: 0,
      meanDelta: 0,
      scoreDistribution: [],
      criterionAverages: { taskFulfillment: 0, organization: 0, vocabulary: 0, grammar: 0 }
    });
  }

  const aiTotals = aiAssessments.map((a) => a.total);
  const finalTotals = finalGrades.map((f) => f.finalTotal);

  const meanAiTotal = Math.round((aiTotals.reduce((a, b) => a + b, 0) / totalSubmissions) * 100) / 100;
  const meanFinalTotal = finalTotals.length > 0
    ? Math.round((finalTotals.reduce((a, b) => a + b, 0) / finalTotals.length) * 100) / 100
    : meanAiTotal;

  const scoreDeltas = lecturerReviews.map((r) => r.scoreDifference);
  const meanDelta = scoreDeltas.length > 0
    ? Math.round((scoreDeltas.reduce((a, b) => a + b, 0) / scoreDeltas.length) * 100) / 100
    : 0;

  const meanTF = Math.round((aiAssessments.reduce((a, b) => a + b.taskFulfillmentScore, 0) / totalSubmissions) * 100) / 100;
  const meanOrg = Math.round((aiAssessments.reduce((a, b) => a + b.organizationScore, 0) / totalSubmissions) * 100) / 100;
  const meanVoc = Math.round((aiAssessments.reduce((a, b) => a + b.vocabularyScore, 0) / totalSubmissions) * 100) / 100;
  const meanGra = Math.round((aiAssessments.reduce((a, b) => a + b.grammarScore, 0) / totalSubmissions) * 100) / 100;

  return NextResponse.json({
    totalSubmissions,
    totalFinalGrades: finalGrades.length,
    meanAiTotal,
    meanFinalTotal,
    meanDelta,
    minScore: Math.min(...aiTotals),
    maxScore: Math.max(...aiTotals),
    criterionAverages: {
      taskFulfillment: meanTF,
      organization: meanOrg,
      vocabulary: meanVoc,
      grammar: meanGra
    }
  });
}
