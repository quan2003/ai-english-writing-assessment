import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  confidenceValues,
  levels,
  scoreValues,
  aiLikelihoodValues,
  type Confidence,
  type GradeResult,
  type Level,
  type Score,
  type AILikelihood
} from "@/lib/grading-types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an English writing assessment assistant for university lecturers.
Your PRIMARY task is to detect if the essay was written by AI. Your secondary task is to suggest a score.

=== AI DETECTION (CRITICAL FIRST STEP) ===
Before grading, evaluate the essay for signs of AI generation. You MUST set "ai_likelihood" to "high" if you observe:
1. Overly perfect, robotic grammar with zero natural ESL errors.
2. Highly formulaic structures (e.g., mechanical use of "In conclusion", "Therefore", "Moreover").
3. Generic, encyclopedic explanations (e.g. "The brain does not actually multitask...") lacking any personal voice or student-like awkwardness.
4. If the text reads exactly like a Wikipedia article or an AI chatbot response, it is AI.
If ANY of these patterns are clear, output "ai_likelihood": "high". Do not hesitate, even if it answers the prompt well.

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

NARRATIVE TASK NOTE: If the task asks the student to "write about an experience" or "tell a story", the key requirements are: a clear sequence of events, feelings/emotions during the experience, and a lesson learned or reflection. If a student provides all three elements with adequate development (100+ words), Task Fulfillment should be 2.0. Give 2.5 only if the narrative is particularly detailed, vivid, and well-developed. Do NOT give 1.0 or 1.5 to a narrative that clearly covers sequence, feelings, and lesson, even if some details could be richer.

2. Organization (0-2.5)
- 2.5: Very clear and effective structure; ideas flow naturally; paragraphing and transitions are strong; introduction/body/conclusion or required task sections are clearly handled.
- 2.0: Clear structure and logical flow; some linking is used, but cohesion or paragraphing could be improved.
- 1.5: Basic organization is present; ideas are mostly understandable but not always well connected.
- 1.0: Limited organization; ideas are listed, repeated, or weakly connected with poor paragraphing and weak cohesion.
- 0.5: Very difficult to follow; almost no cohesion.
- 0.0: No discernible structure.

SINGLE PARAGRAPH NOTE: If the student's response is a single paragraph (no clear paragraph breaks), Organization 2.5 is NOT appropriate — a single paragraph cannot demonstrate multi-paragraph structural skills. Award 2.0 at most for a well-organized single paragraph with clear topic sentence, supporting details, and conclusion. Award 1.5 if transitions are formulaic or the paragraph structure is basic. Award 1.0 if ideas are loosely connected.

3. Vocabulary (0-2.5)
- 2.5: Wide, precise, and natural vocabulary beyond basic academic level; effective use of topic-specific collocations, synonyms, and idiomatic expressions; minimal repetition; clearly demonstrates a broad active vocabulary. Do NOT award 2.5 if the essay relies mostly on common everyday words, simple collocations, or repetitive phrasing, even if accurate.
- 2.0: Appropriate vocabulary with some topic-related terms; occasional repetition or simple wording; communicates clearly but range is limited.
- 1.5: Adequate vocabulary to convey basic meaning, but simple, repetitive, or sometimes unnatural.
- 1.0: Limited vocabulary; frequent repetition or word choice problems reduce clarity.
- 0.5: Very poor vocabulary; word choice frequently causes misunderstanding.
- 0.0: Insufficient vocabulary to communicate in English.

UNIT VOCABULARY NOTE: If the task is based on a reading or unit (e.g., about migration, animals, science topics), the student may use domain-specific terms from the text (e.g., "magnetic field", "biological clock", "migration"). Using these terms alone does NOT justify 2.5. To earn 2.5, the student must show vocabulary RANGE and PRECISION beyond the provided topic words — varied collocations, precise word choice, and minimal reliance on the same repeated terms. If the vocabulary mostly consists of terms from the assigned topic without showing broader range, award 2.0 or 1.5.

4. Grammar (0-2.5)
- 2.5: Accurate and varied grammar with effective use of complex/compound structures, relative clauses, conditionals, passives, or other advanced forms; very few or no noticeable errors; sentence structures are varied and sophisticated. Do NOT award 2.5 if the essay mostly uses simple or compound sentences with limited structural variety, even if the grammar is mostly correct.
- 2.0: Grammar is generally accurate and clear; some complex structures are used, but sentence variety or accuracy could improve; minor errors present.
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
- A total score of 10.0 should be extremely rare — only for genuinely outstanding writing where all four criteria are strong AND the vocabulary and grammar show clear advanced-level control beyond basic correctness.
- If weaknesses are listed, the total score should normally be below 10.0.
- Do not leave "weaknesses" empty. Even strong writing usually has minor limitations or areas for improvement.
- For strong essays, weaknesses may be phrased as improvement points, but they must still identify real limitations in the writing.
- If you cannot identify at least 2 specific weaknesses, reconsider whether the scores are too high.
- Make sure the scores are consistent with the feedback, strengths, and weaknesses.
- VOCABULARY 2.5 RULE: Do not give Vocabulary 2.5 unless the essay clearly uses advanced, topic-specific vocabulary beyond everyday words. If the vocabulary is mostly common/everyday terms, award 2.0 or lower.
- GRAMMAR 2.5 RULE: Do not give Grammar 2.5 unless the essay clearly uses a variety of complex and compound structures effectively. If sentences are mostly simple or compound without structural variety, award 2.0 or lower even if grammar is mostly correct.

=== STRICT 1.0 vs 1.5 CALIBRATION (CRITICAL) ===
The AI often inflates weak essays by giving 1.5 when a human lecturer gives 1.0 or 0.5. Apply these strict rules:
- GRAMMAR 1.0 RULE: If the essay contains MULTIPLE basic errors (e.g., subject-verb agreement like "it help", missing plurals/prepositions like "listen music", wrong word forms like "feel stress" instead of "stressed", "less focus" instead of "focused"), Grammar MUST be 1.0 or 0.5. Do NOT give 1.5 to an essay full of basic errors just because you can guess the meaning.
- VOCABULARY 1.0 RULE: If the student uses ONLY very basic A1/A2 words ("good, bad, fast, do many things, one work") with no academic range, Vocabulary MUST be 1.0. Do NOT give 1.5 for extremely basic vocabulary.
- ORGANIZATION 1.0 RULE: If the essay uses only basic connectors (and, but, so, because) or has a very weak paragraph structure, Organization MUST be 1.0 or 0.5. Do NOT give 1.5 unless there is clear flow and some variety in linking.

=== LOW-SCORE CALIBRATION ===
- If the essay is under 100 words and has weak development, the total score should usually not exceed 5.0.
- If the essay is under 80 words and has many grammar errors, the total score should usually not exceed 4.0.
- If the essay is fragmented, repetitive, or difficult to follow, the total score should usually not exceed 3.5.
- If the essay is under 50 words, cap task_fulfillment at 1.0.
- If all four criteria would receive 1.5, check whether the essay is actually adequate in all areas. If it is short, simple, repetitive, or error-prone, lower at least two criteria to 1.0 or 0.5.
- A total score of 6.0 or higher means the essay is Fair and should show adequate classroom performance in most criteria.
- Do not assign Fair level to a response that is very short, fragmented, highly repetitive, or contains many basic grammar errors unless it has clear task fulfillment and understandable development.
- SHORT ESSAY GRAMMAR RULE: For essays under 120 words, Grammar 2.5 is almost never appropriate because there is insufficient writing to demonstrate a clear variety of complex structures. Cap Grammar at 2.0 for essays under 120 words unless there is clear and varied advanced grammar use.
- SHORT ESSAY GENERAL RULE: For essays under 100 words, prefer 1.0 over 1.5 for criteria that show minimal development. A short essay can show some task fulfillment and grammar accuracy, but underdevelopment should lower TF, Organization, and Vocabulary to 1.0 unless there is clear evidence of strength in those areas.
- SUMMARY+RESPONSE TASK: If the task asks for both a summary AND a personal response, a 90-100 word essay is significantly underdeveloped. Both the summary part and the response part need adequate length. If either part is minimal, lower TF to 1.0 or below.

=== RULES ===
- Do not rewrite the student's essay.
- All output fields must be in English.
- Return JSON only - no extra text, no markdown, no explanation outside the JSON.
- "total" must equal exactly: task_fulfillment + organization + vocabulary + grammar.
- "level" must follow the level scale above.
- If the essay is off-topic, very short, or appears copied, explain clearly in "feedback".
- strengths: 2-4 specific items in English.
- weaknesses: 2-4 specific items in English. Do not output "N/A" or "None". If the essay is perfect or AI-generated, point out the lack of personal voice or suggest advanced improvements.
- Do not invent content not present in the essay.
- The "confidence" field must be exactly one of: "high", "medium", "low".
- The "ai_likelihood" field must estimate the probability that the essay was generated by AI. Must be exactly one of: "high", "medium", "low".
- "ai_detection_signs": If ai_likelihood is high, provide 1-3 specific signs of AI generation. Otherwise, leave empty.
- "ai_detection_feedback": If ai_likelihood is high, provide a short paragraph explaining why it's flagged. Otherwise, leave empty.`;

const REVIEWER_PROMPT = `${SYSTEM_PROMPT}

You are now reviewing a previous AI assessment for consistency.
Be stricter about score inflation, but also correct any under-scoring.

=== FLAT SCORE PROFILE ===
If all four criteria have the same score, check carefully whether the essay is genuinely equal across all criteria. Usually it is not. Find which criteria are stronger and which are weaker, and adjust to show meaningful differences. Prefer differentiated scores, but if adjustments are truly minor, a change of 0.5 in at least one criterion is still preferred.

=== TASK FULFILLMENT — NARRATIVE ESSAYS ===
If the task asks the student to write about a personal experience and the previous score gave TF 1.0 or 1.5, check whether this is too harsh. If the essay includes a clear sequence of events, feelings/emotions during the experience, and a lesson learned or reflection, Task Fulfillment should be at least 2.0. Do NOT under-score TF just because the vocabulary or grammar is not advanced.

=== HIGH SCORE REVIEW ===
If the total is 9.0 or above, apply these checks:
- Vocabulary 2.5 requires vocabulary that is clearly advanced and beyond everyday academic words. Common words like "effective", "distracted", "wisely", "research", "important" do NOT justify 2.5. If the essay mostly uses intermediate-level words, award 2.0 or 1.5.
- Grammar 2.5 requires a clear variety of complex structures (relative clauses, conditionals, passives, advanced subordination). If sentences are mostly simple or follow basic patterns, award 2.0.
- Organization 2.5 requires truly sophisticated cohesion, not just formulaic transitions (However/Overall). If paragraphing is basic, award 2.0.
- A total of 10.0 is only acceptable for truly outstanding writing in ALL criteria.

=== SHORT ESSAY RULES ===
- If the essay is short, repetitive, underdeveloped, or contains many basic grammar errors, reduce scores accordingly.
- For weak short essays, prefer 0.5 or 1.0 in the weakest criteria.

If weaknesses are empty or too generic, identify real limitations and adjust scores downward.
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
    confidence: { type: "string", enum: confidenceValues },
    ai_likelihood: { type: "string", enum: aiLikelihoodValues },
    ai_detection_signs: {
      type: "array",
      items: { type: "string" }
    },
    ai_detection_feedback: { type: "string" }
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
    "confidence",
    "ai_likelihood",
    "ai_detection_signs",
    "ai_detection_feedback"
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
    !confidenceValues.includes(result.confidence as Confidence) ||
    !aiLikelihoodValues.includes(result.ai_likelihood as AILikelihood) ||
    !Array.isArray(result.ai_detection_signs) ||
    typeof result.ai_detection_feedback !== "string"
  ) {
    throw new Error("The model returned an incomplete grading response.");
  }

  // Use whatever the model returned; fill with generic fallback if empty
  // to avoid a 500 error on essays where the model omits lists.
  const isNotNA = (s: string) => {
    const lower = s.toLowerCase().trim();
    return lower && lower !== "n/a" && lower !== "none" && lower !== "nothing";
  };

  const strengths = result.strengths.map(String).filter(isNotNA).slice(0, 4);
  const weaknesses = result.weaknesses.map(String).filter(isNotNA).slice(0, 4);
  const suggestions = result.suggestions_for_lecturer.map(String).filter(isNotNA).slice(0, 4);

  const safeStrengths = strengths.length > 0 ? strengths : ["See feedback above."];
  const safeWeaknesses = weaknesses.length > 0 ? weaknesses : ["See feedback above."];
  const safeSuggestions = suggestions.length > 0 ? suggestions : ["Review the essay with the student based on the feedback provided."];

  return {
    task_fulfillment: result.task_fulfillment as Score,
    organization: result.organization as Score,
    vocabulary: result.vocabulary as Score,
    grammar: result.grammar as Score,
    total: roundedTotal,
    level,
    feedback: result.feedback,
    strengths: safeStrengths,
    weaknesses: safeWeaknesses,
    suggestions_for_lecturer: safeSuggestions,
    confidence: result.confidence as Confidence,
    ai_likelihood: result.ai_likelihood as AILikelihood,
    ai_detection_signs: result.ai_detection_signs.map(String).filter(Boolean),
    ai_detection_feedback: result.ai_detection_feedback
  };
}

function countParagraphs(text: string): number {
  return text.trim().split(/\n\s*\n/).filter((s) => s.trim().length > 0).length;
}

function applyDeterministicCaps(result: GradeResult, essayText: string, isFinalPass = false): GradeResult {
  let cappedResult: GradeResult = { ...result };

  const wordCount = countWords(essayText);
  const paragraphCount = countParagraphs(essayText);

  // Cap task_fulfillment for very short essays
  if (wordCount < 50 && cappedResult.task_fulfillment > 1.0) {
    cappedResult = { ...cappedResult, task_fulfillment: 1.0 as Score };
  }

  // Under 120 words: Grammar cannot be 2.5 — too short to show structural variety
  if (wordCount < 120 && cappedResult.grammar > 2.0) {
    cappedResult = { ...cappedResult, grammar: 2.0 as Score };
  }

  // Under 100 words: no single criterion can exceed 1.5
  // A ~90-word essay cannot demonstrate university-level proficiency in any criterion
  if (wordCount < 100) {
    const cap = 1.5 as Score;
    cappedResult = {
      ...cappedResult,
      task_fulfillment: (Math.min(cappedResult.task_fulfillment, cap)) as Score,
      organization: (Math.min(cappedResult.organization, cap)) as Score,
      vocabulary: (Math.min(cappedResult.vocabulary, cap)) as Score,
      grammar: (Math.min(cappedResult.grammar, cap)) as Score
    };
  }

  // Under 60 words: tighten further — all criteria capped at 1.0.
  // Very short essays (50-60 words) with basic errors cannot reach 1.5 in any criterion.
  // This matches GV grading where Grammar/Org are typically 0.5-1.0 for very short, error-prone essays.
  if (wordCount <= 60) {
    const strictCap = 1.0 as Score;
    cappedResult = {
      ...cappedResult,
      task_fulfillment: (Math.min(cappedResult.task_fulfillment, strictCap)) as Score,
      organization: (Math.min(cappedResult.organization, strictCap)) as Score,
      vocabulary: (Math.min(cappedResult.vocabulary, strictCap)) as Score,
      grammar: (Math.min(cappedResult.grammar, strictCap)) as Score
    };
  }

  // "Weak but inflated" cap: GV gives 0.5-1.0 for basic errors in short essays (<150w).
  // If the AI gives a low total (<6.0) but gives 1.5s for Grammar/Vocab/Org, it's inflating.
  // Force these criteria down to 1.0 if word count is under 150.
  if (wordCount < 150) {
    const rawTotal = 
      cappedResult.task_fulfillment +
      cappedResult.organization +
      cappedResult.vocabulary +
      cappedResult.grammar;
      
    if (rawTotal <= 6.0) {
      const weakCap = 1.0 as Score;
      cappedResult = {
        ...cappedResult,
        organization: (Math.min(cappedResult.organization, weakCap)) as Score,
        vocabulary: (Math.min(cappedResult.vocabulary, weakCap)) as Score,
        grammar: (Math.min(cappedResult.grammar, weakCap)) as Score
      };
    }
  }

  // Essays under 300 words: Organization cannot be 2.5.
  // These are typically single-paragraph or short multi-paragraph responses
  // that cannot demonstrate the full structural range required for 2.5.
  // (More reliable than paragraph detection since paste formatting varies.)
  if (wordCount < 300 && cappedResult.organization > 2.0) {
    cappedResult = { ...cappedResult, organization: 2.0 as Score };
  }

  // Essays under 250 words: Vocabulary cannot be 2.5.
  // Short academic paragraphs typically rely on topic/unit vocabulary
  // which does not demonstrate the broad range required for 2.5.
  if (wordCount < 250 && cappedResult.vocabulary > 2.0) {
    cappedResult = { ...cappedResult, vocabulary: 2.0 as Score };
  }

  // Final-pass hard cap: after both AI passes, if total is still 10.0
  // and the essay is under 300 words, it is almost certainly inflated.
  // Automatically lower vocabulary by 0.5 (10.0 → 9.5) as a safeguard.
  if (isFinalPass) {
    const rawTotal =
      cappedResult.task_fulfillment +
      cappedResult.organization +
      cappedResult.vocabulary +
      cappedResult.grammar;
    if (rawTotal >= 10.0 && wordCount < 300 && cappedResult.vocabulary >= 2.5) {
      cappedResult = {
        ...cappedResult,
        vocabulary: 2.0 as Score
      };
    }
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

=== AI DETECTION REMINDER ===
Check for robotic grammar, formulaic transitions, and encyclopedic tone. If present, "ai_likelihood" MUST be "high".

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
  "confidence": "",
  "ai_likelihood": "",
  "ai_detection_signs": [],
  "ai_detection_feedback": ""
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
- AI DETECTION: Explicitly check for AI patterns (robotic grammar, excessive formulaic structures, encyclopedic tone). If suspected, set "ai_likelihood" to "high" even if the previous assessment did not.
- FLAT PROFILE: If all four criteria are the same score, you MUST change at least 2 of them. Find which are weaker.
- VOCABULARY: Is the vocabulary truly advanced beyond common academic words? If mostly everyday words, reduce to 2.0 or 1.5.
- GRAMMAR: Does the essay use a clear variety of complex structures? If mostly simple sentences, reduce to 2.0.
- ORGANIZATION: Are transitions sophisticated or just formulaic (However/Overall)? If formulaic, reduce to 2.0.
- If the previous score gives 1.5 for all four criteria, check whether that is inflated.
- If the essay is short, simple, repetitive, or contains many basic grammar errors, lower weak criteria to 1.0 or 0.5 when justified.
- If the essay is under 100 words and weakly developed, the total should usually not exceed 5.0.
- If the essay is under 80 words and has many grammar errors, the total should usually not exceed 4.0.
- If the essay is fragmented or difficult to follow, the total should usually not exceed 3.5.
- If the total is 9.0 or above, double-check EVERY criterion. A near-perfect score requires near-perfect writing in ALL areas.
- If weaknesses are listed, they should correspond to lower scores. If you list weaknesses but keep all scores at 2.5, that is inconsistent — reduce the relevant criterion scores.

Return corrected JSON only.`;
}

function shouldReviewAgain(result: GradeResult, essayText: string): boolean {
  if (result.ai_likelihood === "high") return false;

  const wordCount = countWords(essayText);

  const flatScoreProfile =
    result.task_fulfillment === result.organization &&
    result.organization === result.vocabulary &&
    result.vocabulary === result.grammar;

  const possiblyInflatedWeakEssay =
    wordCount < 100 &&
    result.total >= 5 &&
    (
      result.task_fulfillment >= 1.5 ||
      result.organization >= 1.5 ||
      result.vocabulary >= 1.5 ||
      result.grammar >= 2.0
    );

  const shortEssayTooHigh =
    wordCount < 120 &&
    result.total >= 5;

  const veryShortEssayTooHigh =
    wordCount < 50 &&
    result.total >= 4;

  return (
    result.total >= 8.0 ||
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

    result = applyDeterministicCaps(result, essayText, false);

    if (shouldReviewAgain(result, essayText)) {
      result = await requestStructuredGrade(
        client,
        REVIEWER_PROMPT,
        buildReviewPrompt(task, essayText, result)
      );

      // isFinalPass=true applies the hard deterministic cap
      result = applyDeterministicCaps(result, essayText, true);
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