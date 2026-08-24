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
  const classGroupId = searchParams.get("classGroupId");

  // Collect all valid organization IDs associated with lecturer / admin
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

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { organizationId: { in: targetOrgIds } },
        { classGroup: { course: { organizationId: { in: targetOrgIds } } } },
        { user: { memberships: { some: { organizationId: { in: targetOrgIds } } } } }
      ],
      ...(classGroupId ? { classGroupId } : {})
    },
    include: {
      classGroup: { include: { course: true } },
      user: { select: { id: true, globalRole: true } },
      _count: { select: { submissions: true } }
    },
    orderBy: { fullName: "asc" }
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { studentIdCode, fullName, email, classGroupId, organizationId } = body;
    const activeOrgId = organizationId || session.organizationId;

    if (!studentIdCode || !fullName || !email || !activeOrgId) {
      return NextResponse.json({ error: "Student ID code, full name, and email are required" }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: {
        organizationId_studentIdCode: {
          organizationId: activeOrgId,
          studentIdCode
        }
      }
    });

    if (existingStudent) {
      return NextResponse.json({ error: `Student ID '${studentIdCode}' already exists in this organization.` }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        organizationId: activeOrgId,
        studentIdCode,
        fullName,
        email,
        classGroupId: classGroupId || null
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: activeOrgId,
        userId: session.userId,
        action: "STUDENT_CREATED",
        entityType: "Student",
        entityId: student.id,
        newValue: JSON.stringify({ studentIdCode, fullName, email })
      }
    });

    return NextResponse.json(student, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
