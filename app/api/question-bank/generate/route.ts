import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { examType = "VSTEP", taskType = "TASK_2", topic = "General", difficulty = "MEDIUM" } = body;

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL =
      process.env.DEEPSEEK_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com" : undefined);

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API Key is not configured on the server." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey, baseURL });

    const modelName = process.env.OPENAI_MODEL || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-2024-11-20");

    const promptText = `You are an expert English test creator specializing in VSTEP, IELTS, TOEIC, and Academic Writing exams.
Create a realistic, authentic English writing test prompt for:
- Exam Type: ${examType}
- Task Type: ${taskType}
- Topic Domain: ${topic}
- Difficulty Level: ${difficulty}

Rules:
1. For VSTEP Task 1: Focus on formal/informal email or letter writing (120 - 180 words, 20 mins).
2. For VSTEP Task 2: Focus on discussion/opinion/solution essay (250 - 350 words, 40 mins).
3. For IELTS Task 1: Focus on chart/graph/map/process description (150 - 200 words, 20 mins).
4. For IELTS Task 2: Focus on academic essay (250 - 350 words, 40 mins).
5. For TOEIC Task 1/2/3: Focus on workplace/business email response or opinion essay (150 - 300 words, 20-30 mins).

Return ONLY valid JSON matching this structure with no extra text or markdown formatting:
{
  "title": "short descriptive title e.g. VSTEP Task 2: Topic Name",
  "prompt": "the complete test prompt text presenting the situation or question",
  "instructions": "clear step-by-step instructions for the candidate",
  "minWords": 250,
  "maxWords": 350,
  "timeLimit": 40,
  "topic": "${topic}"
}`;

    const completion = await client.chat.completions.create({
      model: modelName,
      temperature: 0.7,
      messages: [
        { role: "system", content: "You generate English writing test prompts in pure JSON format." },
        { role: "user", content: promptText }
      ],
      response_format: { type: "json_object" }
    });

    let outputText = completion.choices[0]?.message?.content || "";
    if (outputText.startsWith("```json")) {
      outputText = outputText.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (outputText.startsWith("```")) {
      outputText = outputText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const data = JSON.parse(outputText);

    const newQuestion = await prisma.questionBankItem.create({
      data: {
        organizationId: session.organizationId || "",
        createdById: session.userId,
        title: data.title || `${examType} ${taskType}: ${topic}`,
        examType,
        taskType,
        prompt: data.prompt || "Write an essay on the given topic.",
        instructions: data.instructions || "Write clearly and follow instructions.",
        minWords: data.minWords ? parseInt(data.minWords) : 250,
        maxWords: data.maxWords ? parseInt(data.maxWords) : 350,
        timeLimit: data.timeLimit ? parseInt(data.timeLimit) : 40,
        difficulty,
        topic: data.topic || topic
      }
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
