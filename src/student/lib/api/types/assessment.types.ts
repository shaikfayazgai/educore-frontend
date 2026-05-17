import type { Identifiable, Timestamps } from "./common.types";

// === Assessment (in-browser, auto-graded evaluation) ==========================
// Distinct from Assignment (file upload). Faculty authors questions; students
// take in-browser within a publish window; auto-graded on submit.

export type AssessmentType = "quiz" | "midterm" | "final" | "exam";

export type AssessmentStatus = "draft" | "published" | "closed";

export type QuestionType =
  | "multiple_choice"
  | "multiple_select"
  | "true_false"
  | "short_answer";

export interface AssessmentQuestion extends Identifiable {
  prompt: string;
  type: QuestionType;
  /** Options array — required for multiple_choice, ignored for true_false/short_answer */
  options?: string[];
  /** Correct answer text. For MC: the option string. For T/F: "True"|"False". For short_answer: the canonical answer (matched case/whitespace-insensitive). */
  correctAnswer: string;
  /** Points awarded for a correct answer. Sum of all question points = assessment.maxScore. */
  points: number;
  /** Optional rationale shown on the student results page (and to faculty review). */
  explanation?: string;
}

/**
 * Full assessment record as faculty sees it (with correct answers).
 * Backend should NEVER ship this shape to students before submission.
 */
export interface Assessment extends Identifiable, Timestamps {
  courseId: string;
  title: string;
  instructions: string;
  type: AssessmentType;
  questions: AssessmentQuestion[];
  /** Sum of question points. Derived — kept materialized for cheap reads. */
  maxScore: number;
  /** Weight toward the course grade (1–100). */
  weight: number;
  /** Optional time limit in minutes. Counts down from the moment the student starts. */
  timeLimitMinutes?: number;
  /** Number of attempts allowed. Best score counts. Default 1. */
  attemptsAllowed: number;
  /** ISO datetime — students cannot start before this. */
  opensAt: string;
  /** ISO datetime — students cannot start after this, and any in-progress attempt auto-submits. */
  closesAt: string;
  status: AssessmentStatus;
}

/**
 * Student-facing list item — no correct answers leaked.
 */
export interface StudentAssessmentListItem extends Identifiable {
  courseId: string;
  title: string;
  type: AssessmentType;
  weight: number;
  maxScore: number;
  questionCount: number;
  timeLimitMinutes?: number;
  attemptsAllowed: number;
  opensAt: string;
  closesAt: string;
  /** Computed for the student: how many attempts they've already used. */
  attemptsUsed: number;
  /** The student's best score so far, if any. */
  bestScore?: number;
  /** Id of the student's most-recent submitted attempt, if any (for routing to results). */
  lastAttemptId?: string;
  /** Derived state from the student's perspective. */
  studentStatus:
    | "not_open"        // before opensAt
    | "open"            // can be started
    | "in_progress"     // attempt exists and is unfinished
    | "completed"       // best score recorded
    | "closed"          // closesAt passed and no completed attempts
    | "exhausted";      // all attempts used and none completed (after close)
}

/**
 * Student-facing question — strips correct answer and explanation.
 */
export interface StudentAssessmentQuestion extends Identifiable {
  prompt: string;
  type: QuestionType;
  options?: string[];
  points: number;
}

/**
 * Detailed view a student sees during/before taking an assessment.
 * Returned by GET /api/students/me/courses/:courseId/assessments/:assessmentId.
 * Never includes correctAnswer / explanation.
 */
export interface StudentAssessmentDetail extends Identifiable {
  courseId: string;
  title: string;
  instructions: string;
  type: AssessmentType;
  questions: StudentAssessmentQuestion[];
  maxScore: number;
  weight: number;
  timeLimitMinutes?: number;
  attemptsAllowed: number;
  opensAt: string;
  closesAt: string;
  attemptsUsed: number;
  bestScore?: number;
  lastAttemptId?: string;
  studentStatus: StudentAssessmentListItem["studentStatus"];
}

// === Attempts ================================================================

export type AttemptStatus = "in_progress" | "submitted";

export interface AttemptAnswer {
  questionId: string;
  /** Raw student answer text. For MC: option string. For T/F: "True"|"False". For short_answer: free text. */
  answer: string;
}

export interface GradedAnswer extends AttemptAnswer {
  isCorrect: boolean;
  /** Points awarded for this question (0 or points). */
  pointsAwarded: number;
  /** Correct answer revealed AFTER submission only. */
  correctAnswer: string;
  /** Optional rationale revealed AFTER submission only. */
  explanation?: string;
}

export interface AssessmentAttempt extends Identifiable {
  assessmentId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  /** Server-stamped deadline = startedAt + timeLimitMinutes (or assessment.closesAt, whichever is sooner). */
  expiresAt: string;
  submittedAt?: string;
  status: AttemptStatus;
  /** Empty during in_progress; populated after submission. */
  answers: AttemptAnswer[];
  /** Total score awarded after submission. */
  score?: number;
  /** maxScore at the time of submission (in case the assessment is edited later). */
  maxScore?: number;
}

/**
 * Returned when a student fetches a completed attempt — includes correctness
 * and explanations so the student can learn from mistakes.
 */
export interface GradedAttempt extends Identifiable {
  assessmentId: string;
  assessmentTitle: string;
  courseId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  /** Per-question breakdown with the correct answer + the student's answer + explanation. */
  questionResults: {
    questionId: string;
    prompt: string;
    type: QuestionType;
    options?: string[];
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    pointsAwarded: number;
    explanation?: string;
  }[];
}

// === Request payloads (faculty) ==============================================

export interface CreateAssessmentRequest {
  courseId: string;
  title: string;
  instructions: string;
  type: AssessmentType;
  questions: {
    prompt: string;
    type: QuestionType;
    options?: string[];
    correctAnswer: string;
    points: number;
    explanation?: string;
  }[];
  weight: number;
  timeLimitMinutes?: number;
  attemptsAllowed: number;
  opensAt: string;
  closesAt: string;
}

export type UpdateAssessmentRequest = Partial<
  Omit<CreateAssessmentRequest, "courseId">
> & {
  status?: AssessmentStatus;
};

// === Request payloads (student) ==============================================

export interface StartAttemptResponse {
  attemptId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
}

export interface SubmitAttemptRequest {
  answers: AttemptAnswer[];
}

// === Faculty-side submission roll-up =========================================

export interface AssessmentSubmissionSummary {
  studentId: string;
  studentName: string;
  attempts: number;
  bestScore?: number;
  bestPercentage?: number;
  lastSubmittedAt?: string;
  status: "not_started" | "in_progress" | "submitted";
}
