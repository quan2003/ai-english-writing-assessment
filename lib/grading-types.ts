export const scoreValues = [0, 0.5, 1, 1.5, 2, 2.5] as const;
export const levels = ["Excellent", "Good", "Fair", "Average", "Weak"] as const;
export const confidenceValues = ["high", "medium", "low"] as const;
export const aiLikelihoodValues = ["high", "medium", "low"] as const;

export type Score = (typeof scoreValues)[number];
export type Level = (typeof levels)[number];
export type Confidence = (typeof confidenceValues)[number];
export type AILikelihood = (typeof aiLikelihoodValues)[number];

export type GradeResult = {
  task_fulfillment: Score;
  organization: Score;
  vocabulary: Score;
  grammar: Score;
  total: number;
  level: Level;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions_for_lecturer: string[];
  confidence: Confidence;
  ai_likelihood: AILikelihood;
  ai_detection_signs: string[];
  ai_detection_feedback: string;
};
