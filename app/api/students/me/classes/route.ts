import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: {
        classGroup: {
          include: {
            course: {
              include: { organization: true }
            }
          }
        },
        enrollments: {
          include: {
            course: {
              include: {
                organization: true,
                classGroups: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ activeClass: null, joinedClasses: [] });
    }

    const joinedClasses: any[] = [];
    const seenIds = new Set<string>();

    if (student.classGroup) {
      seenIds.add(student.classGroup.id);
      joinedClasses.push({
        id: student.classGroup.id,
        name: student.classGroup.name,
        classCode: student.classGroup.classCode,
        examTarget: student.classGroup.examTarget,
        targetScore: student.classGroup.targetScore,
        organizationId: student.classGroup.course.organizationId,
        organizationName: student.classGroup.course.organization.name
      });
    }

    student.enrollments.forEach((e) => {
      e.course.classGroups.forEach((cg) => {
        if (!seenIds.has(cg.id)) {
          seenIds.add(cg.id);
          joinedClasses.push({
            id: cg.id,
            name: cg.name,
            classCode: cg.classCode,
            examTarget: cg.examTarget,
            targetScore: cg.targetScore,
            organizationId: e.course.organizationId,
            organizationName: e.course.organization.name
          });
        }
      });
    });

    const activeClass = joinedClasses.find((c) => c.organizationId === session.organizationId) || joinedClasses[0] || null;

    return NextResponse.json({
      activeClass,
      joinedClasses
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching student classes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
