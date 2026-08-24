import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateClassCode(examTarget: string = "IELTS"): string {
  const prefix = examTarget.slice(0, 5).toUpperCase();
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-WR-${randomHex}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classes = await prisma.classGroup.findMany({
    where: {
      course: {
        organizationId: session.organizationId || ""
      }
    },
    include: {
      course: { select: { id: true, title: true, code: true } },
      students: { select: { id: true, fullName: true, email: true, studentIdCode: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, examTarget, targetScore, description, courseId } = body;

    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }

    let targetCourseId = courseId;
    if (!targetCourseId) {
      const firstCourse = await prisma.course.findFirst({
        where: { organizationId: session.organizationId || "" }
      });
      if (firstCourse) {
        targetCourseId = firstCourse.id;
      } else {
        const newCourse = await prisma.course.create({
          data: {
            organizationId: session.organizationId || "",
            code: "EXAM-PREP",
            title: "English Writing Exam Preparation Course"
          }
        });
        targetCourseId = newCourse.id;
      }
    }

    const classCode = generateClassCode(examTarget || "IELTS");

    const newClass = await prisma.classGroup.create({
      data: {
        courseId: targetCourseId,
        name,
        classCode,
        examTarget: examTarget || "IELTS",
        targetScore: targetScore || "6.5",
        description,
        lecturerId: session.userId
      }
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating class";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
