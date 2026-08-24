import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId") || session.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
  }

  const courses = await prisma.course.findMany({
    where: { organizationId },
    include: {
      classGroups: true,
      _count: {
        select: { enrollments: true, assessments: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, title, description, organizationId, classGroups } = body;
    const activeOrgId = organizationId || session.organizationId;

    if (!code || !title || !activeOrgId) {
      return NextResponse.json({ error: "Course code, title, and organizationId are required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        organizationId: activeOrgId,
        code,
        title,
        description: description || null,
        classGroups: Array.isArray(classGroups)
          ? {
              create: classGroups.map((cg: { name: string; lecturerId?: string }) => ({
                name: cg.name,
                lecturerId: cg.lecturerId || session.userId
              }))
            }
          : undefined
      },
      include: { classGroups: true }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: activeOrgId,
        userId: session.userId,
        action: "COURSE_CREATED",
        entityType: "Course",
        entityId: course.id,
        newValue: JSON.stringify({ code, title })
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
