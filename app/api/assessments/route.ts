import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const paramOrgId = searchParams.get("organizationId");
  const courseId = searchParams.get("courseId");
  const status = searchParams.get("status");

  // Collect all valid organization IDs for the session user (including joined classes for students)
  let targetOrgIds: string[] = [];

  if (paramOrgId) {
    targetOrgIds = [paramOrgId];
  } else {
    // Fetch OrganizationMember records
    const members = await prisma.organizationMember.findMany({
      where: { userId: session.userId },
      select: { organizationId: true }
    });
    targetOrgIds = members.map((m) => m.organizationId);

    // Also check student profile & class group
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: { classGroup: { include: { course: true } } }
    });

    if (student) {
      if (student.organizationId) targetOrgIds.push(student.organizationId);
      if (student.classGroup?.course?.organizationId) {
        targetOrgIds.push(student.classGroup.course.organizationId);
      }
    }

    if (session.organizationId) {
      targetOrgIds.push(session.organizationId);
    }
  }

  targetOrgIds = Array.from(new Set(targetOrgIds.filter(Boolean)));

  const assessments = await prisma.assessment.findMany({
    where: {
      ...(targetOrgIds.length > 0 ? { organizationId: { in: targetOrgIds } } : {}),
      ...(courseId ? { courseId } : {}),
      ...(status ? { status } : {})
    },
    include: {
      course: true,
      createdBy: {
        select: { id: true, fullName: true, email: true }
      },
      _count: {
        select: { submissions: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      task,
      instructions,
      minWords,
      maxWords,
      courseId,
      organizationId,
      status,
      gradingMode,
      disagreementThreshold,
      startTime,
      deadline,
      resultReleaseDate,
      duplicateFromId
    } = body;

    const activeOrgId = organizationId || session.organizationId;

    if (!activeOrgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Handle Assessment Duplication
    if (duplicateFromId) {
      const source = await prisma.assessment.findUnique({ where: { id: duplicateFromId } });
      if (!source) {
        return NextResponse.json({ error: "Source assessment for duplication not found" }, { status: 404 });
      }

      const duplicated = await prisma.assessment.create({
        data: {
          organizationId: activeOrgId,
          courseId: courseId || source.courseId,
          title: title || `${source.title} (Copy)`,
          task: source.task,
          instructions: source.instructions,
          minWords: source.minWords,
          maxWords: source.maxWords,
          rubricVersion: source.rubricVersion,
          promptVersion: source.promptVersion,
          status: "DRAFT",
          gradingMode: source.gradingMode,
          disagreementThreshold: source.disagreementThreshold,
          createdById: session.userId
        }
      });

      return NextResponse.json(duplicated, { status: 201 });
    }

    if (!title || !task) {
      return NextResponse.json({ error: "Title and writing task are required" }, { status: 400 });
    }

    const assessment = await prisma.assessment.create({
      data: {
        organizationId: activeOrgId,
        courseId: courseId || null,
        title,
        task,
        instructions: instructions || null,
        minWords: minWords ? Number(minWords) : null,
        maxWords: maxWords ? Number(maxWords) : null,
        rubricVersion: "writing-rubric-v2.0",
        promptVersion: "writing-grader-v3.2",
        status: status || "OPEN",
        gradingMode: gradingMode || "AI_PLUS_ONE_LECTURER",
        disagreementThreshold: disagreementThreshold ? Number(disagreementThreshold) : 1.0,
        startTime: startTime ? new Date(startTime) : null,
        deadline: deadline ? new Date(deadline) : null,
        resultReleaseDate: resultReleaseDate ? new Date(resultReleaseDate) : null,
        createdById: session.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: activeOrgId,
        userId: session.userId,
        action: "ASSESSMENT_CREATED",
        entityType: "Assessment",
        entityId: assessment.id,
        newValue: JSON.stringify({ title, status: assessment.status })
      }
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
