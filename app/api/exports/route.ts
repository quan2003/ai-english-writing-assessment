import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  const organizationId = searchParams.get("organizationId") || session.organizationId;

  const submissions = await prisma.submission.findMany({
    where: {
      ...(assessmentId ? { assessmentId } : {}),
      assessment: {
        organizationId: organizationId || undefined
      }
    },
    include: {
      student: true,
      assessment: { include: { course: true } },
      aiAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      lecturerReviews: { include: { reviewer: true }, orderBy: { createdAt: "desc" }, take: 1 },
      finalGrades: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { submittedAt: "desc" }
  });

  const csvHeaders = [
    "Student ID",
    "Student Name",
    "Course",
    "Assessment",
    "Word Count",
    "AI Task Fulfillment",
    "AI Organization",
    "AI Vocabulary",
    "AI Grammar",
    "AI Total",
    "Final Task Fulfillment",
    "Final Organization",
    "Final Vocabulary",
    "Final Grammar",
    "Final Total",
    "Lecturer",
    "Review Comment",
    "Status"
  ];

  const csvRows = [csvHeaders.join(",")];

  for (const s of submissions) {
    const ai = s.aiAssessments[0];
    const review = s.lecturerReviews[0];
    const finalGrade = s.finalGrades[0];

    const row = [
      csvEscape(s.student.studentIdCode),
      csvEscape(s.student.fullName),
      csvEscape(s.assessment.course?.code || "N/A"),
      csvEscape(s.assessment.title),
      s.wordCount,
      ai ? ai.taskFulfillmentScore : "",
      ai ? ai.organizationScore : "",
      ai ? ai.vocabularyScore : "",
      ai ? ai.grammarScore : "",
      ai ? ai.total : "",
      review ? (review.finalTaskFulfillment ?? ai?.taskFulfillmentScore ?? "") : "",
      review ? (review.finalOrganization ?? ai?.organizationScore ?? "") : "",
      review ? (review.finalVocabulary ?? ai?.vocabularyScore ?? "") : "",
      review ? (review.finalGrammar ?? ai?.grammarScore ?? "") : "",
      finalGrade ? finalGrade.finalTotal : (ai ? ai.total : ""),
      csvEscape(review?.reviewer?.fullName || ""),
      csvEscape(review?.comment || ""),
      csvEscape(s.status)
    ];

    csvRows.push(row.join(","));
  }

  const csvContent = csvRows.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="assessment_export_${Date.now()}.csv"`
    }
  });
}
