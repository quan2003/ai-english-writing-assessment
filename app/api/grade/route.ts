import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  confidenceValues,
  levels,
  scoreValues,
  type Confidence,
  type GradeResult,
  type Level,
  type Score
} from "@/lib/grading-types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an English writing assessment assistant for university lecturers.
Your task is to suggest a score for a student's English writing assignment.
The final score will be decided by the lecturer.

Grade the essay using exactly 4 criteria. Each criterion is scored from 0 to 2.5.
Scores may use 0.5 increments only: 0 / 0.5 / 1.0 / 1.5 / 2.0 / 2.5.

=== RUBRIC ===

1. Task Fulfillment (0-2.5)
- 2.5: Fully and precisely addresses all task requirements; content is complete, accurate, well-focused, and sufficiently developed; no important part is missing.
- 2.0: Addresses the task well; content is mostly accurate and relevant, but some details may be general or not fully developed.
- 1.5: Partially addresses the task with some clear development; the response is understandable but has noticeable missing details or limited support.
- 1.0: Somewhat related to the task, but ideas are weak, repetitive, underdeveloped, or the response is too short for adequate assessment.
- 0.5: Addresses very few requirements; content is fragmented, extremely limited, or only loosely related to the task.
- 0.0: Off-topic or insufficient content to assess.

2. Organization (0-2.5)
- 2.5: Very clear and effective structure; ideas flow naturally; paragraphing and transitions are strong; introduction/body/conclusion or required task sections are clearly handled.
- 2.0: Clear structure and logical flow; some linking is used, but cohesion or paragraphing could be improved.
- 1.5: Basic organization is present; ideas are mostly understandable but not always well connected.
- 1.0: Limited organization; ideas are listed, repeated, or weakly connected with poor paragraphing and weak cohesion.
- 0.5: Very difficult to follow; almost no cohesion.
- 0.0: No discernible structure.

3. Vocabulary (0-2.5)
- 2.5: Wide, precise, and natural vocabulary for the task; good collocations; minimal repetition; word choice enhances clarity.
- 2.0: Appropriate vocabulary with some topic-related terms; occasional repetition or simple wording.
- 1.5: Adequate vocabulary to convey basic meaning, but simple, repetitive, or sometimes unnatural.
- 1.0: Limited vocabulary; frequent repetition or word choice problems reduce clarity.
- 0.5: Very poor vocabulary; word choice frequently causes misunderstanding.
- 0.0: Insufficient vocabulary to communicate in English.

4. Grammar (0-2.5)
- 2.5: Accurate and varied grammar with effective complex/compound structures; very few or no noticeable errors.
- 2.0: Grammar is generally accurate and clear; some complex structures are used, but sentence variety or accuracy could improve.
- 1.5: Meaning is generally understandable, but sentences are mostly simple and several errors are present.
- 1.0: Many basic grammar errors; sentence control is weak and clarity is often affected.
- 0.5: Serious grammar errors; many sentences are hard to understand.
- 0.0: Insufficient grammar to assess or content is incomprehensible.

=== LEVEL SCALE ===
- 8.5-10.0 : Excellent
- 7.0-8.25 : Good
- 5.0-6.75 : Fair
- 3.0-4.75 : Average
- 0.0-2.75 : Weak

=== SCORE CALIBRATION RULES ===
- Be fair for university classroom assessment, but do not inflate scores.
- Do not apply IELTS/TOEFL standards.
- Do not give full marks too easily.
- A score of 2.5 means the criterion is excellent, complete, natural, and has almost no noticeable weakness.
- A score of 2.0 means the criterion is good and clearly meets classroom expectations, but still has minor limitations.
- A score of 1.5 means the criterion is clearly adequate for a university classroom response, with some development and mostly understandable control.
- Do not give 1.5 by default just because the essay is understandable.
- If the response is very short, repetitive, poorly developed, loosely connected, or has many basic grammar errors, use 0.5 or 1.0 instead of 1.5.
- Use 2.5 when that specific criterion is clearly strong, not only when the whole essay is perfect.
- If you mention a weakness related to a criterion, that criterion should normally be 2.0 or lower.
- Do not default all criteria to 2.0 or 1.5. Compare the four criteria and show meaningful differences when the essay has uneven strengths.
- If one criterion is noticeably stronger than the others, it may receive a higher score than weaker criteria.
- If a weakness is clear and important, use 1.0 or 1.5 for the related criterion rather than always using 2.0.
- Use the full range of allowed scores when justified by the writing quality.
- A total score of 10.0 should be rare and should only be used for outstanding writing with no meaningful weakness.
- If weaknesses are listed, the total score should normally be below 10.0.
- Do not leave "weaknesses" empty. Even strong writing usually has minor limitations or areas for improvement.
- For strong essays, weaknesses may be phrased as improvement points, but they must still identify real limitations in the writing.
- If you cannot identify at least 2 specific weaknesses, reconsider whether the scores are too high.
- Make sure the scores are consistent with the feedback, strengths, and weaknesses.

=== LOW-SCORE CALIBRATION ===
- If the essay is under 100 words and has weak development, the total score should usually not exceed 5.0.
- If the essay is under 80 words and has many grammar errors, the total score should usually not exceed 4.0.
- If the essay is fragmented, repetitive, or difficult to follow, the total score should usually not exceed 3.5.
- If the essay is under 50 words, cap task_fulfillment at 1.0.
- If all four criteria would receive 1.5, check whether the essay is actually adequate in all areas. If it is short, simple, repetitive, or error-prone, lower at least two criteria to 1.0 or 0.5.
- A total score of 6.0 or higher means the essay is Fair and should show adequate classroom performance in most criteria.
- Do not assign Fair level to a response that is very short, fragmented, highly repetitive, or contains many basic grammar errors unless it has clear task fulfillment and understandable development.

=== RULES ===
- Do not rewrite the student's essay.
- All output fields must be in English.
- Return JSON only - no extra text, no markdown, no explanation outside the JSON.
- "total" must equal exactly: task_fulfillment + organization + vocabulary + grammar.
- "level" must follow the level scale above.
- If the essay is off-topic, very short, or appears copied, explain clearly in "feedback".
- strengths: 2-4 specific items in English.
- weaknesses: 2-4 specific items in English.
- suggestions_for_lecturer: 2-4 practical notes in English.
- Do not invent content not present in the essay.
- The "confidence" field must be exactly one of: "high", "medium", "low".`;

const REVIEWER_PROMPT = `${SYSTEM_PROMPT}

You are now reviewing a previous AI assessment for consistency.
Be stricter about score inflation than the first assessment.

If the essay is short, repetitive, underdeveloped, or contains many basic grammar errors, do not keep a total score of 6.0 or higher just because the topic is recognizable.
For weak short essays, prefer 0.5 or 1.0 in the weakest criteria.
If the previous assessment gives 1.5 for all four criteria, check carefully whether this is score inflation.
For a short and error-prone essay, reduce the total to the 3.0-5.0 range when justified.

If the score is 9.5 or 10.0, check whether the essay truly exceeds normal classroom expectations in every criterion.
If all four criteria have the same score, check carefully whether the essay is genuinely balanced across all criteria. If not, adjust the profile to reflect stronger and weaker criteria.
If weaknesses are empty, identify 2-4 real limitations or improvement points and adjust the score downward when appropriate.
If the score is 10.0, keep it only for truly outstanding writing with no meaningful limitation.
Make sure the corrected scores, total, level, feedback, strengths, weaknesses, and suggestions are internally consistent.
Return corrected JSON only.`;

const gradeSchema = {
  type: "object",
  properties: {
    task_fulfillment: { type: "number", enum: scoreValues },
    organization: { type: "number", enum: scoreValues },
    vocabulary: { type: "number", enum: scoreValues },
    grammar: { type: "number", enum: scoreValues },
    total: { type: "number" },
    level: { type: "string", enum: levels },
    feedback: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" }
    },
    weaknesses: {
      type: "array",
      items: { type: "string" }
    },
    suggestions_for_lecturer: {
      type: "array",
      items: { type: "string" }
    },
    confidence: { type: "string", enum: confidenceValues }
  },
  required: [
    "task_fulfillment",
    "organization",
    "vocabulary",
    "grammar",
    "total",
    "level",
    "feedback",
    "strengths",
    "weaknesses",
    "suggestions_for_lecturer",
    "confidence"
  ],
  additionalProperties: false
} as const;

function getExpectedLevel(total: number): Level {
  if (total >= 8.5) return "Excellent";
  if (total >= 7) return "Good";
  if (total >= 5) return "Fair";
  if (total >= 3) return "Average";
  return "Weak";
}

function isScore(value: unknown): value is Score {
  return typeof value === "number" && scoreValues.includes(value as Score);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateGradeResult(value: unknown): GradeResult {
  if (!value || typeof value !== "object") {
    throw new Error("The model returned an invalid response.");
  }

  const result = value as Record<string, unknown>;

  const scores = [
    result.task_fulfillment,
    result.organization,
    result.vocabulary,
    result.grammar
  ];

  if (!scores.every(isScore)) {
    throw new Error("The model returned scores outside the allowed rubric values.");
  }

  const total = scores.reduce<number>((sum, score) => sum + score, 0);
  const roundedTotal = Math.round(total * 10) / 10;
  const level = getExpectedLevel(roundedTotal);

  if (
    typeof result.feedback !== "string" ||
    !Array.isArray(result.strengths) ||
    !Array.isArray(result.weaknesses) ||
    !Array.isArray(result.suggestions_for_lecturer) ||
    !confidenceValues.includes(result.confidence as Confidence)
  ) {
    throw new Error("The model returned an incomplete grading response.");
  }

  const strengths = result.strengths.map(String).filter(Boolean).slice(0, 4);
  const weaknesses = result.weaknesses.map(String).filter(Boolean).slice(0, 4);
  const suggestions = result.suggestions_for_lecturer.map(String).filter(Boolean).slice(0, 4);

  if (strengths.length < 2 || weaknesses.length < 2 || suggestions.length < 2) {
    throw new Error("The model returned too few strengths, weaknesses, or lecturer suggestions.");
  }

  return {
    task_fulfillment: result.task_fulfillment as Score,
    organization: result.organization as Score,
    vocabulary: result.vocabulary as Score,
    grammar: result.grammar as Score,
    total: roundedTotal,
    level,
    feedback: result.feedback,
    strengths,
    weaknesses,
    suggestions_for_lecturer: suggestions,
    confidence: result.confidence as Confidence
  };
}

function applyDeterministicCaps(result: GradeResult, essayText: string): GradeResult {
  const wordCount = countWords(essayText);

  let cappedResult: GradeResult = { ...result };

  if (wordCount < 50 && cappedResult.task_fulfillment > 1.0) {
    cappedResult = {
      ...cappedResult,
      task_fulfillment: 1.0
    };
  }

  const total =
    cappedResult.task_fulfillment +
    cappedResult.organization +
    cappedResult.vocabulary +
    cappedResult.grammar;

  const roundedTotal = Math.round(total * 10) / 10;

  return {
    ...cappedResult,
    total: roundedTotal,
    level: getExpectedLevel(roundedTotal)
  };
}

async function requestStructuredGrade(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<GradeResult> {
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "writing_assessment",
        strict: true,
        schema: gradeSchema
      }
    }
  });

  const outputText = response.output_text;

  if (!outputText) {
    throw new Error("The model did not return text output.");
  }

  return validateGradeResult(JSON.parse(outputText));
}

function buildGradingPrompt(task: string, essayText: string) {
  const wordCount = countWords(essayText);

  return `=== INPUT ===
Writing task:
"""
${task}
"""

Student essay:
"""
${essayText}
"""

Essay word count: ${wordCount}

=== IMPORTANT WORD COUNT NOTE ===
Use the word count when applying score calibration.
If the essay is short, repetitive, weakly developed, or error-prone, do not assign Fair-level scores only because it is understandable.

=== OUTPUT FORMAT ===
Return exactly this JSON:
{
  "task_fulfillment": 0,
  "organization": 0,
  "vocabulary": 0,
  "grammar": 0,
  "total": 0,
  "level": "",
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "suggestions_for_lecturer": [],
  "confidence": ""
}`;
}

function buildReviewPrompt(task: string, essayText: string, result: GradeResult) {
  const wordCount = countWords(essayText);

  return `${buildGradingPrompt(task, essayText)}

Previous AI assessment:
${JSON.stringify(result, null, 2)}

Review this AI assessment for consistency.

Essay word count: ${wordCount}

Review checklist:
- If the previous score gives 1.5 for all four criteria, check whether that is inflated.
- If the essay is short, simple, repetitive, or contains many basic grammar errors, lower weak criteria to 1.0 or 0.5 when justified.
- If the essay is under 100 words and weakly developed, the total should usually not exceed 5.0.
- If the essay is under 80 words and has many grammar errors, the total should usually not exceed 4.0.
- If the essay is fragmented or difficult to follow, the total should usually not exceed 3.5.
- If the score is 9.5 or 10.0, check whether it truly deserves near-perfect marks.
- If all four criterion scores are identical, verify whether the essay is genuinely equal in task fulfillment, organization, vocabulary, and grammar.
- If weaknesses are empty or too generic, identify 2-4 real limitations or improvement points and adjust scores downward when appropriate.

Return corrected JSON only.`;
}

function shouldReviewAgain(result: GradeResult, essayText: string): boolean {
  const wordCount = countWords(essayText);

  const flatScoreProfile =
    result.task_fulfillment === result.organization &&
    result.organization === result.vocabulary &&
    result.vocabulary === result.grammar;

  const possiblyInflatedWeakEssay =
    wordCount < 100 &&
    result.total >= 6 &&
    result.task_fulfillment >= 1.5 &&
    result.organization >= 1.5 &&
    result.vocabulary >= 1.5 &&
    result.grammar >= 1.5;

  const shortEssayTooHigh =
    wordCount < 80 &&
    result.total >= 5;

  const veryShortEssayTooHigh =
    wordCount < 50 &&
    result.total >= 4;

  return (
    result.total >= 9.5 ||
    result.weaknesses.length < 2 ||
    flatScoreProfile ||
    possiblyInflatedWeakEssay ||
    shortEssayTooHigh ||
    veryShortEssayTooHigh
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      task?: unknown;
      essay_text?: unknown;
    };

    const task = typeof body.task === "string" ? body.task.trim() : "";
    const essayText = typeof body.essay_text === "string" ? body.essay_text.trim() : "";

    if (!task || !essayText) {
      return NextResponse.json(
        { error: "Both writing task and student essay are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const gradingPrompt = buildGradingPrompt(task, essayText);

    let result: GradeResult;

    try {
      result = await requestStructuredGrade(client, SYSTEM_PROMPT, gradingPrompt);
    } catch {
      result = await requestStructuredGrade(
        client,
        REVIEWER_PROMPT,
        `${gradingPrompt}

The previous assessment was rejected because it did not provide enough specific strengths, weaknesses, or lecturer suggestions. Return a complete calibrated assessment.`
      );
    }

    result = applyDeterministicCaps(result, essayText);

    if (shouldReviewAgain(result, essayText)) {
      result = await requestStructuredGrade(
        client,
        REVIEWER_PROMPT,
        buildReviewPrompt(task, essayText, result)
      );

      result = applyDeterministicCaps(result, essayText);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected grading error.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}