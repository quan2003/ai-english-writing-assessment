export const scoreValues = [0, 0.5, 1, 1.5, 2, 2.5] as const;
export const levels = ["Excellent", "Good", "Fair", "Average", "Weak"] as const;

export type Score = (typeof scoreValues)[number];
export type Level = (typeof levels)[number];

export type CriterionAssessment = {
  score: Score;
  rationale: string;
  evidence: string[];
};

export type AIGradeResult = {
  task_fulfillment: CriterionAssessment;
  organization: CriterionAssessment;
  vocabulary: CriterionAssessment;
  grammar: CriterionAssessment;

  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions_for_lecturer: string[];

  review_required: boolean;
  review_reasons: string[];
};

export type WordCountStatus =
  | "within_range"
  | "below_range"
  | "above_range"
  | "not_specified";

export type PassSummary = {
  total: number;
  criterion_scores: {
    task_fulfillment: Score;
    organization: Score;
    vocabulary: Score;
    grammar: Score;
  };
};

export type GradingPasses = {
  primary: PassSummary;
  reviewer?: PassSummary;
};

export type EvidenceVerificationDiagnostic = {
  rejected_count: number;
  affected_criteria: string[];
};

export type GradeResult = AIGradeResult & {
  total: number;
  level: Level;

  actual_word_count: number;
  word_count_status: WordCountStatus;
  assessment_consistency?: "high" | "medium" | "low";
  grading_passes?: GradingPasses;
  evidence_verification?: EvidenceVerificationDiagnostic;

  metadata: {
    model: string;
    rubric_version: string;
    prompt_version: string;
  };
};

export type LecturerDecisionStatus =
  | "pending"
  | "approved"
  | "modified"
  | "flagged";

export type LecturerDecision = {
  status: LecturerDecisionStatus;
  final_score: number | null;
  comment: string;
};

