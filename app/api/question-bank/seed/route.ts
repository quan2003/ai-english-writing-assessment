import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sampleBankItems = [
    // VSTEP Topics
    {
      title: "VSTEP Task 1: Letter Requesting Information About an English Course",
      examType: "VSTEP",
      taskType: "TASK_1",
      prompt: "You saw an advertisement for an intensive English writing course at a language center in Hanoi. Write an email to the course director asking for details about tuition fees, schedule, class size, and entry requirements.",
      instructions: "You should write at least 120 words. Do not write your real address.",
      minWords: 120,
      maxWords: 180,
      timeLimit: 20,
      difficulty: "EASY",
      topic: "Education"
    },
    {
      title: "VSTEP Task 2: Distance Learning vs Traditional Classroom",
      examType: "VSTEP",
      taskType: "TASK_2",
      prompt: "In recent years, distance learning has become increasingly popular. Discuss the advantages and disadvantages of online education compared to traditional classroom learning.",
      instructions: "Write an essay of at least 250 words. Support your arguments with specific examples.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "MEDIUM",
      topic: "Technology & Education"
    },
    {
      title: "VSTEP Task 2: Impact of Mass Tourism on Local Culture",
      examType: "VSTEP",
      taskType: "TASK_2",
      prompt: "Tourism brings economic benefits to many regions in Vietnam, but it can also cause cultural damage and environmental pollution. Do you think the benefits of tourism outweigh its drawbacks?",
      instructions: "Write an essay of at least 250 words presenting your opinion.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "MEDIUM",
      topic: "Tourism & Environment"
    },

    // IELTS Topics
    {
      title: "IELTS Task 1: Bar Chart - Higher Education Graduation Rates",
      examType: "IELTS",
      taskType: "TASK_1",
      prompt: "The bar chart shows the percentage of university graduates in five different countries between 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      instructions: "Write at least 150 words. Focus on key trends and major comparative features.",
      minWords: 150,
      maxWords: 200,
      timeLimit: 20,
      difficulty: "MEDIUM",
      topic: "Academic Data Analysis"
    },
    {
      title: "IELTS Task 2: Artificial Intelligence in Education & Healthcare",
      examType: "IELTS",
      taskType: "TASK_2",
      prompt: "Some people believe that artificial intelligence will revolutionize education and healthcare, while others fear it will replace human teachers and doctors. Discuss both views and give your opinion.",
      instructions: "Write an essay of at least 250 words. Include relevant examples from your knowledge or experience.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "HARD",
      topic: "AI & Future Technology"
    },
    {
      title: "IELTS Task 2: Economic Growth vs Environmental Protection",
      examType: "IELTS",
      taskType: "TASK_2",
      prompt: "Developing countries must prioritize economic development to eradicate poverty, even if it harms the environment. To what extent do you agree or disagree?",
      instructions: "Write an essay of at least 250 words. Give reasons for your answer.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "HARD",
      topic: "Economics & Ecology"
    },

    // TOEIC Topics
    {
      title: "TOEIC Writing Task 2: Response to Customer Service Complaint Email",
      examType: "TOEIC",
      taskType: "TASK_2",
      prompt: "You are the customer relations supervisor at a logistics firm. Read the email from a client complaining about delayed shipment delivery, and write a professional response offering an apology, an explanation, and a solution.",
      instructions: "Write a response email of 120-180 words. Address all customer concerns professionally.",
      minWords: 120,
      maxWords: 180,
      timeLimit: 20,
      difficulty: "MEDIUM",
      topic: "Business Communication"
    },
    {
      title: "TOEIC Writing Task 3: Remote Work vs Office Work Culture",
      examType: "TOEIC",
      taskType: "TASK_3",
      prompt: "Many multinational companies are allowing employees to work remotely permanently. Do you prefer working from home or in a traditional office? State your opinion and support it with reasons and examples.",
      instructions: "Write an essay of at least 300 words. Organize your thoughts logically with reasons.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 30,
      difficulty: "MEDIUM",
      topic: "Workplace & Management"
    }
  ];

  try {
    let createdCount = 0;
    for (const item of sampleBankItems) {
      await prisma.questionBankItem.create({
        data: {
          organizationId: session.organizationId || "",
          createdById: session.userId,
          ...item
        }
      });
      createdCount++;
    }

    return NextResponse.json({ message: `Successfully imported ${createdCount} standard exam topics into Question Bank!` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
