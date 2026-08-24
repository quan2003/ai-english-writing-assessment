import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST as runGradeAPI } from "@/app/api/grade/route";
import { prisma } from "./prisma";
import {
  type GradeResult
} from "./grading-types";

export function generateGradingFingerprint(
  essayText: string,
  task: string,
  rubricVersion: string = "writing-rubric-v2.0",
  promptVersion: string = "writing-grader-v3.2",
  model: string = "gpt-4o-2024-11-20"
): string {
  const content = `${essayText.trim()}||${task.trim()}||${rubricVersion}||${promptVersion}||${model}`;
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function processGradingJob(jobId: string): Promise<void> {
  const job = await prisma.gradingJob.findUnique({
    where: { id: jobId },
    include: {
      submission: {
        include: {
          assessment: true
        }
      }
    }
  });

  if (!job || job.status === "COMPLETED") return;

  await prisma.gradingJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date(), attemptCount: { increment: 1 } }
  });

  const startTime = Date.now();
  const { submission } = job;
  const { assessment } = submission;

  try {
    // Check Organization Monthly Quota Limit before invoking paid AI call
    const orgSubscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId: assessment.organizationId },
      include: { plan: true }
    });

    if (orgSubscription) {
      const limit = orgSubscription.plan.monthlyGradingLimit;
      if (limit > 0 && orgSubscription.usageCount >= limit) {
        throw new Error("Monthly AI grading limit reached for organization. Please upgrade plan.");
      }
    }

    // Prepare Request for Frozen Grading Core Engine
    const gradeReq = new NextRequest("http://localhost/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: assessment.task,
        essay_text: submission.essayText,
        min_words: assessment.minWords || undefined,
        max_words: assessment.maxWords || undefined
      })
    });

    const response = await runGradeAPI(gradeReq);
    const responseData = await response.json();

    if (!response.ok) {
      const rawError = responseData.error || "Grading Engine execution failed";
      // Handle credit balance exhaustion or auth errors specifically
      if (rawError.includes("credit_balance_exhausted") || rawError.includes("quota") || rawError.includes("billing")) {
        throw new Error("AI grading service is temporarily unavailable due to billing quota. The submission has been safely saved.");
      }
      throw new Error(rawError);
    }

    const gradeResult: GradeResult = responseData;
    const latencyMs = Date.now() - startTime;

    // Save Persistent AIAssessment Version (Immutable AI Output Record)
    const aiAssessment = await prisma.aIAssessment.create({
      data: {
        submissionId: submission.id,
        essayHash: crypto.createHash("sha256").update(submission.essayText).digest("hex"),
        gradingFingerprint: job.gradingFingerprint,

        taskFulfillmentScore: gradeResult.task_fulfillment.score,
        organizationScore: gradeResult.organization.score,
        vocabularyScore: gradeResult.vocabulary.score,
        grammarScore: gradeResult.grammar.score,
        total: gradeResult.total,

        taskFulfillmentData: JSON.stringify(gradeResult.task_fulfillment),
        organizationData: JSON.stringify(gradeResult.organization),
        vocabularyData: JSON.stringify(gradeResult.vocabulary),
        grammarData: JSON.stringify(gradeResult.grammar),

        feedback: gradeResult.feedback,
        strengths: JSON.stringify(gradeResult.strengths),
        weaknesses: JSON.stringify(gradeResult.weaknesses),
        suggestionsForLecturer: JSON.stringify(gradeResult.suggestions_for_lecturer),
        evidence: JSON.stringify([
          ...gradeResult.task_fulfillment.evidence,
          ...gradeResult.organization.evidence,
          ...gradeResult.vocabulary.evidence,
          ...gradeResult.grammar.evidence
        ]),

        reviewRequired: gradeResult.review_required,
        reviewReasons: JSON.stringify(gradeResult.review_reasons),
        assessmentConsistency: gradeResult.assessment_consistency || null,

        primaryPass: JSON.stringify(gradeResult.grading_passes?.primary || {}),
        reviewerPass: gradeResult.grading_passes?.reviewer
          ? JSON.stringify(gradeResult.grading_passes.reviewer)
          : null,

        model: gradeResult.metadata.model,
        temperature: 0,
        promptVersion: gradeResult.metadata.prompt_version,
        rubricVersion: gradeResult.metadata.rubric_version,
        latencyMs
      }
    });

    // Save Usage Record
    await prisma.usageRecord.create({
      data: {
        organizationId: assessment.organizationId,
        aiAssessmentId: aiAssessment.id,
        estimatedCostUsd: 0.015,
        latencyMs
      }
    });

    // Increment Organization Subscription Usage Count
    await prisma.organizationSubscription.updateMany({
      where: { organizationId: assessment.organizationId },
      data: { usageCount: { increment: 1 } }
    });

    // Update Submission Status (Keep submission safely preserved)
    const nextStatus = gradeResult.review_required ? "NEEDS_REVIEW" : "AI_GRADED";
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: nextStatus }
    });

    await prisma.gradingJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: new Date() }
    });

    // Log Audit Event
    await prisma.auditLog.create({
      data: {
        organizationId: assessment.organizationId,
        action: "AI_GRADING_COMPLETED",
        entityType: "AIAssessment",
        entityId: aiAssessment.id,
        newValue: JSON.stringify({ total: gradeResult.total, reviewRequired: gradeResult.review_required })
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown grading failure";
    await prisma.gradingJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: errorMsg }
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "GRADING_FAILED" }
    });
  }
}

