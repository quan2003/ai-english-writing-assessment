import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  const studentId = searchParams.get("studentId");
  const paramOrgId = searchParams.get("organizationId");

  const isStudent = session.orgRole === "STUDENT" || session.globalRole === "STUDENT";
  const studentProfile = isStudent ? await prisma.student.findUnique({ where: { userId: session.userId } }) : null;

  // Collect all valid organization IDs
  let targetOrgIds: string[] = [];
  if (paramOrgId) {
    targetOrgIds = [paramOrgId];
  } else {
    const members = await prisma.organizationMember.findMany({
      where: { userId: session.userId },
      select: { organizationId: true }
    });
    targetOrgIds = members.map((m) => m.organizationId);
    if (session.organizationId) targetOrgIds.push(session.organizationId);
  }
  targetOrgIds = Array.from(new Set(targetOrgIds.filter(Boolean)));

  const submissions = await prisma.submission.findMany({
    where: {
      ...(assessmentId ? { assessmentId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(isStudent && studentProfile ? { studentId: studentProfile.id } : {}),
      ...(targetOrgIds.length > 0 && !isStudent ? { assessment: { organizationId: { in: targetOrgIds } } } : {})
    },
    include: {
      student: true,
      assessment: { include: { course: true } },
      aiAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      lecturerReviews: { orderBy: { createdAt: "desc" }, take: 1 },
      finalGrades: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { submittedAt: "desc" }
  });

  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { assessmentId, studentId, essayText } = body;

    if (!assessmentId || !essayText) {
      return NextResponse.json({ error: "Assessment ID and essay text are required" }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check status & deadline
    if (assessment.status !== "OPEN" && assessment.status !== "DRAFT") {
      return NextResponse.json({ error: `Assessment is not currently open for submission (status: ${assessment.status})` }, { status: 400 });
    }

    if (assessment.deadline && new Date() > new Date(assessment.deadline)) {
      return NextResponse.json({ error: "Assessment deadline has passed." }, { status: 400 });
    }

    // Resolve Student profile
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const studentProfile = await prisma.student.findFirst({
        where: { userId: session.userId }
      });
      if (studentProfile) {
        targetStudentId = studentProfile.id;
      }
    }

    if (!targetStudentId) {
      // Create student profile on the fly if user is a student
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      const newStudent = await prisma.student.create({
        data: {
          organizationId: assessment.organizationId,
          userId: session.userId,
          studentIdCode: `STU-${Date.now().toString().slice(-6)}`,
          fullName: user?.fullName || "Student User",
          email: user?.email || session.email
        }
      });
      targetStudentId = newStudent.id;
    }

    const wordCount = countWords(essayText);

    // Check existing submission for versioning
    const existingSubmission = await prisma.submission.findFirst({
      where: { assessmentId, studentId: targetStudentId },
      include: { versions: true }
    });

    if (existingSubmission) {
      const versionNumber = existingSubmission.versions.length + 1;
      await prisma.submissionVersion.create({
        data: {
          submissionId: existingSubmission.id,
          versionNumber,
          essayText,
          wordCount
        }
      });

      const updatedSubmission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          essayText,
          wordCount,
          status: "RESUBMITTED",
          submittedAt: new Date()
        },
        include: { versions: true }
      });

      return NextResponse.json(updatedSubmission);
    }

    // New Submission
    const newSubmission = await prisma.submission.create({
      data: {
        assessmentId,
        studentId: targetStudentId,
        essayText,
        wordCount,
        status: "SUBMITTED",
        versions: {
          create: {
            versionNumber: 1,
            essayText,
            wordCount
          }
        }
      },
      include: { versions: true }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: assessment.organizationId,
        userId: session.userId,
        action: "ESSAY_SUBMITTED",
        entityType: "Submission",
        entityId: newSubmission.id,
        newValue: JSON.stringify({ wordCount })
      }
    });

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
