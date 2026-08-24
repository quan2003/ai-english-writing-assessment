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
  const examType = searchParams.get("examType");
  const taskType = searchParams.get("taskType");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  const questions = await prisma.questionBankItem.findMany({
    where: {
      ...(examType && examType !== "ALL" ? { examType } : {}),
      ...(taskType && taskType !== "ALL" ? { taskType } : {}),
      ...(difficulty && difficulty !== "ALL" ? { difficulty } : {}),
      ...(search ? { title: { contains: search } } : {}),
      isArchived: false
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, examType, taskType, prompt, instructions, minWords, maxWords, timeLimit, difficulty, topic } = body;

    if (!title || !prompt) {
      return NextResponse.json({ error: "Title and prompt are required" }, { status: 400 });
    }

    const question = await prisma.questionBankItem.create({
      data: {
        organizationId: session.organizationId || "",
        createdById: session.userId,
        title,
        examType: examType || "IELTS",
        taskType: taskType || "TASK_2",
        prompt,
        instructions,
        minWords: minWords ? parseInt(minWords) : 150,
        maxWords: maxWords ? parseInt(maxWords) : 300,
        timeLimit: timeLimit ? parseInt(timeLimit) : 40,
        difficulty: difficulty || "MEDIUM",
        topic: topic || "General"
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const deleteAll = searchParams.get("deleteAll");
  const examType = searchParams.get("examType");

  try {
    if (deleteAll === "true") {
      await prisma.questionBankItem.deleteMany({
        where: {
          ...(examType && examType !== "ALL" ? { examType } : {})
        }
      });
      return NextResponse.json({ message: "Successfully deleted all questions." });
    }

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    await prisma.questionBankItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Successfully deleted question." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
