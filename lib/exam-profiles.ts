export type ExamType = "GENERAL_ACADEMIC" | "VSTEP" | "IELTS" | "TOEIC_WRITING";

export type TaskType = "TASK_1" | "TASK_2" | "TASK_3" | "LETTER" | "ESSAY";

export interface ExamProfile {
  examType: ExamType;
  displayName: string;
  vietnameseName: string;
  description: string;
  defaultTaskType: TaskType;
  scoreScale: string; // e.g. "0 - 10", "0.0 - 9.0 Band", "0 - 200 pts"
  disclaimer: string; // "Estimated Practice Score" / "Điểm Thử nghiệm Luyện tập"
  rubricVersion: string;
  promptVersion: string;
  defaultMinWords: number;
  defaultMaxWords: number;
  defaultTimeLimitMinutes: number;
  tasks: {
    taskType: TaskType;
    name: string;
    description: string;
    minWords: number;
    maxWords: number;
    recommendedMinutes: number;
  }[];
}

export const EXAM_PROFILES: Record<ExamType, ExamProfile> = {
  GENERAL_ACADEMIC: {
    examType: "GENERAL_ACADEMIC",
    displayName: "General Academic Writing",
    vietnameseName: "Viết Viết Học thuật Tổng hợp",
    description: "General academic essay and report writing practice for university and college standards.",
    defaultTaskType: "ESSAY",
    scoreScale: "Scale 0.0 - 10.0",
    disclaimer: "AI Suggested Score / Estimated Practice Result",
    rubricVersion: "writing-rubric-v2.0",
    promptVersion: "writing-grader-v3.2",
    defaultMinWords: 150,
    defaultMaxWords: 300,
    defaultTimeLimitMinutes: 40,
    tasks: [
      {
        taskType: "ESSAY",
        name: "Academic Essay",
        description: "Argumentative, opinion, or problem-solution academic essay.",
        minWords: 150,
        maxWords: 300,
        recommendedMinutes: 40
      }
    ]
  },
  VSTEP: {
    examType: "VSTEP",
    displayName: "VSTEP Writing Prep",
    vietnameseName: "Luyện thi VSTEP Writing (B1 - B2 - C1)",
    description: "Vietnamese Standardized Test of English Proficiency writing preparation.",
    defaultTaskType: "TASK_2",
    scoreScale: "Scale 0.0 - 10.0 (VSTEP B1/B2/C1 Level)",
    disclaimer: "AI Estimated Practice Score for VSTEP Preparation",
    rubricVersion: "writing-rubric-v2.0",
    promptVersion: "writing-grader-v3.2",
    defaultMinWords: 250,
    defaultMaxWords: 350,
    defaultTimeLimitMinutes: 40,
    tasks: [
      {
        taskType: "TASK_1",
        name: "VSTEP Task 1: Letter / Email",
        description: "Write an informal or formal letter/email in response to a given situation.",
        minWords: 120,
        maxWords: 180,
        recommendedMinutes: 20
      },
      {
        taskType: "TASK_2",
        name: "VSTEP Task 2: Essay Writing",
        description: "Write an academic essay giving opinion, discussing advantages/disadvantages, or solving a problem.",
        minWords: 250,
        maxWords: 350,
        recommendedMinutes: 40
      }
    ]
  },
  IELTS: {
    examType: "IELTS",
    displayName: "IELTS Academic Writing Prep",
    vietnameseName: "Luyện thi IELTS Writing Academic",
    description: "IELTS Academic Task 1 (Report/Chart) and Task 2 (Essay) exam preparation.",
    defaultTaskType: "TASK_2",
    scoreScale: "Band 0.0 - 9.0 (Estimated Band)",
    disclaimer: "AI Estimated Band Score for IELTS Practice (Not Official IELTS Result)",
    rubricVersion: "writing-rubric-v2.0",
    promptVersion: "writing-grader-v3.2",
    defaultMinWords: 250,
    defaultMaxWords: 350,
    defaultTimeLimitMinutes: 40,
    tasks: [
      {
        taskType: "TASK_1",
        name: "IELTS Task 1: Graph / Chart / Report",
        description: "Summarize and describe information presented in a graph, chart, table, diagram, or process.",
        minWords: 150,
        maxWords: 200,
        recommendedMinutes: 20
      },
      {
        taskType: "TASK_2",
        name: "IELTS Task 2: Discursive Essay",
        description: "Write a formal discursive essay responding to a point of view, argument, or problem statement.",
        minWords: 250,
        maxWords: 350,
        recommendedMinutes: 40
      }
    ]
  },
  TOEIC_WRITING: {
    examType: "TOEIC_WRITING",
    displayName: "TOEIC Writing Prep",
    vietnameseName: "Luyện thi TOEIC Writing",
    description: "TOEIC Writing Section preparation: Email response and opinion essay.",
    defaultTaskType: "ESSAY",
    scoreScale: "Scale 0 - 200 Points",
    disclaimer: "AI Estimated Practice Score for TOEIC Writing",
    rubricVersion: "writing-rubric-v2.0",
    promptVersion: "writing-grader-v3.2",
    defaultMinWords: 300,
    defaultMaxWords: 400,
    defaultTimeLimitMinutes: 30,
    tasks: [
      {
        taskType: "LETTER",
        name: "TOEIC Task 2: Respond to Written Request",
        description: "Read an incoming email or request and write an appropriate business email response.",
        minWords: 80,
        maxWords: 150,
        recommendedMinutes: 10
      },
      {
        taskType: "ESSAY",
        name: "TOEIC Task 3: Opinion Essay",
        description: "Write an essay stating, explaining, and supporting your opinion on an issue.",
        minWords: 300,
        maxWords: 400,
        recommendedMinutes: 30
      }
    ]
  }
};

export function getExamProfile(examType?: string): ExamProfile {
  if (examType && examType in EXAM_PROFILES) {
    return EXAM_PROFILES[examType as ExamType];
  }
  return EXAM_PROFILES.GENERAL_ACADEMIC;
}
