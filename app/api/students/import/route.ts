import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ImportRow = {
  rowNumber: number;
  studentIdCode: string;
  fullName: string;
  email: string;
  classGroupName?: string;
  isValid: boolean;
  errors: string[];
};

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { rows, organizationId, commit } = body;
    const activeOrgId = organizationId || session.organizationId;

    if (!Array.isArray(rows) || rows.length === 0 || !activeOrgId) {
      return NextResponse.json({ error: "Invalid rows or missing organization ID" }, { status: 400 });
    }

    const existingStudents = await prisma.student.findMany({
      where: { organizationId: activeOrgId },
      select: { studentIdCode: true, email: true }
    });

    const existingCodes = new Set(existingStudents.map((s) => s.studentIdCode.toLowerCase()));
    const existingEmails = new Set(existingStudents.map((s) => s.email.toLowerCase()));

    const validatedRows: ImportRow[] = [];
    const seenBatchCodes = new Set<string>();

    for (let index = 0; index < rows.length; index++) {
      const raw = rows[index];
      const rowNumber = index + 1;
      const studentIdCode = String(raw.studentIdCode || raw["Student ID"] || raw["student_id"] || "").trim();
      const fullName = String(raw.fullName || raw["Full Name"] || raw["full_name"] || raw["Name"] || "").trim();
      const email = String(raw.email || raw["Email"] || "").trim();
      const classGroupName = String(raw.classGroupName || raw["Class"] || raw["class_name"] || "").trim();

      const errors: string[] = [];

      if (!studentIdCode) errors.push("Student ID Code is required");
      if (!fullName) errors.push("Full Name is required");
      if (!email) errors.push("Email address is required");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");

      if (studentIdCode && existingCodes.has(studentIdCode.toLowerCase())) {
        errors.push(`Student ID '${studentIdCode}' already exists in database`);
      }

      if (studentIdCode && seenBatchCodes.has(studentIdCode.toLowerCase())) {
        errors.push(`Duplicate Student ID '${studentIdCode}' in import batch`);
      }

      if (studentIdCode) seenBatchCodes.add(studentIdCode.toLowerCase());

      validatedRows.push({
        rowNumber,
        studentIdCode,
        fullName,
        email,
        classGroupName,
        isValid: errors.length === 0,
        errors
      });
    }

    const validCount = validatedRows.filter((r) => r.isValid).length;
    const invalidCount = validatedRows.length - validCount;

    // If commit flag is set and there are valid rows, execute database insert
    if (commit && validCount > 0) {
      const validRowsToInsert = validatedRows.filter((r) => r.isValid);

      const createdStudents = await prisma.$transaction(
        validRowsToInsert.map((r) =>
          prisma.student.create({
            data: {
              organizationId: activeOrgId,
              studentIdCode: r.studentIdCode,
              fullName: r.fullName,
              email: r.email
            }
          })
        )
      );

      await prisma.auditLog.create({
        data: {
          organizationId: activeOrgId,
          userId: session.userId,
          action: "STUDENTS_BULK_IMPORTED",
          entityType: "Student",
          entityId: activeOrgId,
          newValue: JSON.stringify({ importedCount: createdStudents.length })
        }
      });

      return NextResponse.json({
        success: true,
        importedCount: createdStudents.length,
        validatedRows
      });
    }

    // Default: Validation preview mode
    return NextResponse.json({
      success: invalidCount === 0,
      totalRows: validatedRows.length,
      validCount,
      invalidCount,
      validatedRows
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
