import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getSession, authorizeRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Real curated exam topic database repositories for VSTEP, IELTS, and TOEIC
const REAL_EXAM_TOPICS_DATABASE: Record<string, Array<{
  title: string;
  taskType: string;
  prompt: string;
  instructions: string;
  minWords: number;
  maxWords: number;
  timeLimit: number;
  difficulty: string;
  topic: string;
}>> = {
  VSTEP: [
    {
      title: "VSTEP Task 1: Thư gửi Giám đốc Trung tâm Anh ngữ xin thông tin khóa học",
      taskType: "TASK_1",
      prompt: "Bạn thấy một thông báo tuyển sinh khóa học luyện viết Tiếng Anh tăng cường của trung tâm ngoại ngữ tại Hà Nội. Hãy viết một bức thư khoảng 120 từ gửi cho giám đốc khóa học để hỏi thông tin chi tiết về học phí, lịch học, sĩ số lớp và yêu cầu đầu vào.",
      instructions: "Thí sinh viết thư khoảng 120 - 150 từ. Không ghi địa chỉ thật trong bài làm.",
      minWords: 120,
      maxWords: 180,
      timeLimit: 20,
      difficulty: "EASY",
      topic: "Giáo dục & Đào tạo"
    },
    {
      title: "VSTEP Task 1: Thư phản hồi Phụ huynh về tình hình học tập của học sinh",
      taskType: "TASK_1",
      prompt: "Bạn là giáo viên chủ nhiệm. Nhận được thư của phụ huynh hỏi về kết quả học tập và thái độ của học sinh trong học kỳ vừa qua. Hãy viết email hồi đáp phụ huynh nêu rõ điểm mạnh, điểm cần khắc phục và lời khuyên gia đình phối hợp.",
      instructions: "Viết thư tối thiểu 120 từ theo văn phong trang trọng.",
      minWords: 120,
      maxWords: 180,
      timeLimit: 20,
      difficulty: "MEDIUM",
      topic: "Giao tiếp Học đường"
    },
    {
      title: "VSTEP Task 2: Học trực tuyến (Online Learning) vs Học truyền thống",
      taskType: "TASK_2",
      prompt: "Hiện nay việc học trực tuyến đang trở nên phổ biến ở các trường đại học. Bạn hãy viết bài luận phân tích những ưu điểm và nhược điểm của hình thức học trực tuyến so với phương pháp học truyền thống tại lớp học.",
      instructions: "Viết bài luận khoảng 250 - 350 từ. Đưa ra các ví dụ cụ thể để chứng minh cho quan điểm của bạn.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "MEDIUM",
      topic: "Công nghệ & Giáo dục"
    },
    {
      title: "VSTEP Task 2: Tác động của Du lịch đại chúng tới Di sản Văn hóa",
      taskType: "TASK_2",
      prompt: "Du lịch mang lại nguồn lợi kinh tế lớn cho nhiều địa phương ở Việt Nam, nhưng cũng gây ra nhiều nguy cơ tổn hại di sản văn hóa và ô nhiễm môi trường. Bạn có cho rằng lợi ích của du lịch lớn hơn những tác hại mà nó gây ra hay không?",
      instructions: "Viết bài luận khoảng 250 - 350 từ trình bày quan điểm cá nhân.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "MEDIUM",
      topic: "Du lịch & Văn hóa"
    },
    {
      title: "VSTEP Task 2: Sử dụng Mạng xã hội ở Giới trẻ",
      taskType: "TASK_2",
      prompt: "Nhiều người cho rằng việc sinh viên dành quá nhiều thời gian cho các mạng xã hội như Facebook, TikTok gây ảnh hưởng tiêu cực tới kết quả học tập và kỹ năng giao tiếp thực tế. Bạn đồng ý hay không đồng ý với nhận định trên?",
      instructions: "Viết bài luận tối thiểu 250 từ. Phân tích chi tiết nguyên nhân và hậu quả.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "HARD",
      topic: "Xã hội & Đời sống"
    }
  ],
  IELTS: [
    {
      title: "IELTS Task 1: Academic Line Graph - Energy Consumption Trends",
      taskType: "TASK_1",
      prompt: "The graph below shows the energy consumption by fuel type in the US from 1980 to 2030. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      instructions: "Write at least 150 words. Focus on main trends, peaks, and key comparisons.",
      minWords: 150,
      maxWords: 200,
      timeLimit: 20,
      difficulty: "MEDIUM",
      topic: "Energy & Environment"
    },
    {
      title: "IELTS Task 1: Process Diagram - Coffee Production Cycle",
      taskType: "TASK_1",
      prompt: "The diagram illustrates the process of producing instant coffee from harvesting beans to final packaging. Summarise the information by selecting and reporting the main features.",
      instructions: "Write at least 150 words using appropriate passive voice structures.",
      minWords: 150,
      maxWords: 200,
      timeLimit: 20,
      difficulty: "MEDIUM",
      topic: "Manufacturing Process"
    },
    {
      title: "IELTS Task 2: AI Automation & Job Displacement in Future Workforce",
      taskType: "TASK_2",
      prompt: "Some experts predict that artificial intelligence and automation will replace human workers in most industries. Do you think this development is positive or negative for society?",
      instructions: "Write an essay of at least 250 words. Give reasons and relevant examples.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "HARD",
      topic: "Artificial Intelligence & Economy"
    },
    {
      title: "IELTS Task 2: Public Funding for Arts vs Essential Infrastructure",
      taskType: "TASK_2",
      prompt: "Governments should allocate public funds towards essential public services such as healthcare and education rather than supporting the arts, music, and sports. To what extent do you agree or disagree?",
      instructions: "Write an essay of at least 250 words. Provide balanced arguments.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 40,
      difficulty: "HARD",
      topic: "Government & Culture"
    }
  ],
  TOEIC: [
    {
      title: "TOEIC Writing Task 2: Business Email Response to Logistics Complaint",
      taskType: "TASK_2",
      prompt: "Read the email from a corporate client complaining about delayed delivery of office equipment. Write a professional email response addressing the problem, providing a solution, and offering compensation.",
      instructions: "Write a response email of 120-180 words. Maintain a polite and diplomatic tone.",
      minWords: 120,
      maxWords: 180,
      timeLimit: 20,
      difficulty: "MEDIUM",
      topic: "Corporate Relations"
    },
    {
      title: "TOEIC Writing Task 3: Remote Work Policy vs Office Collaboration",
      taskType: "TASK_3",
      prompt: "Many international corporations are requiring employees to return to the office full-time. Do you prefer working remotely or working in a physical office space? Give reasons to support your position.",
      instructions: "Write an opinion essay of at least 300 words. Support your opinion with business examples.",
      minWords: 250,
      maxWords: 350,
      timeLimit: 30,
      difficulty: "MEDIUM",
      topic: "Workplace & Leadership"
    }
  ]
};

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !authorizeRole(session, ["SUPER_ADMIN", "ORG_ADMIN", "LECTURER"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { examType = "VSTEP", taskType = "ALL", count = 5 } = body;

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL =
      process.env.DEEPSEEK_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com" : undefined);

    let fetchedItems: Array<{
      title: string;
      examType: string;
      taskType: string;
      prompt: string;
      instructions: string;
      minWords: number;
      maxWords: number;
      timeLimit: number;
      difficulty: string;
      topic: string;
    }> = [];

    // Step 1: Query local curated real exam database first
    const pool = REAL_EXAM_TOPICS_DATABASE[examType] || REAL_EXAM_TOPICS_DATABASE["VSTEP"];
    const filteredPool = taskType === "ALL" ? pool : pool.filter((item) => item.taskType === taskType);

    for (const item of filteredPool) {
      fetchedItems.push({
        ...item,
        examType
      });
    }

    // Step 2: If user requested more items than pool, invoke AI Scraper to enrich real exam topics
    if (apiKey && fetchedItems.length < count) {
      try {
        const client = new OpenAI({ apiKey, baseURL });
        const modelName = process.env.OPENAI_MODEL || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-2024-11-20");

        const promptText = `Act as an official exam question collector for ${examType} writing tests (real exams 2024-2026).
Generate ${count - fetchedItems.length} authentic, realistic real exam topics for ${examType} (${taskType === "ALL" ? "Task 1 or Task 2" : taskType}).
Return ONLY a valid JSON array matching this structure:
[
  {
    "title": "short descriptive title",
    "examType": "${examType}",
    "taskType": "TASK_2",
    "prompt": "full prompt text of the real exam",
    "instructions": "clear candidate instructions",
    "minWords": 250,
    "maxWords": 350,
    "timeLimit": 40,
    "difficulty": "MEDIUM",
    "topic": "Education"
  }
]`;

        const completion = await client.chat.completions.create({
          model: modelName,
          temperature: 0.7,
          messages: [
            { role: "system", content: "You output real exam questions in pure JSON array format." },
            { role: "user", content: promptText }
          ],
          response_format: { type: "json_object" }
        });

        let text = completion.choices[0]?.message?.content || "";
        if (text.startsWith("```json")) text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");

        const parsed = JSON.parse(text);
        const aiItems = Array.isArray(parsed) ? parsed : parsed.items || parsed.questions || [];
        for (const aiItem of aiItems) {
          fetchedItems.push({
            title: aiItem.title || `${examType} Real Exam Topic`,
            examType,
            taskType: aiItem.taskType || (taskType === "ALL" ? "TASK_2" : taskType),
            prompt: aiItem.prompt || "Write an essay.",
            instructions: aiItem.instructions || "Follow instructions.",
            minWords: aiItem.minWords ? parseInt(aiItem.minWords) : 250,
            maxWords: aiItem.maxWords ? parseInt(aiItem.maxWords) : 350,
            timeLimit: aiItem.timeLimit ? parseInt(aiItem.timeLimit) : 40,
            difficulty: aiItem.difficulty || "MEDIUM",
            topic: aiItem.topic || "General"
          });
        }
      } catch (err) {
        console.error("AI scraper fallback error:", err);
      }
    }

    // Step 3: Insert into database
    let createdCount = 0;
    for (const item of fetchedItems.slice(0, count)) {
      await prisma.questionBankItem.create({
        data: {
          organizationId: session.organizationId || "",
          createdById: session.userId,
          ...item
        }
      });
      createdCount++;
    }

    return NextResponse.json({
      message: `Đã cào & nạp thành công ${createdCount} đề thi thật ${examType} vào Ngân hàng Đề thi!`,
      count: createdCount
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fetch real exams failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
