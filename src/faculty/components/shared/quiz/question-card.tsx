"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/faculty/lib/utils/cn";

export type QuestionTypeLite = "multiple_choice" | "true_false" | "short_answer";

export interface QuestionLite {
  id: string;
  prompt: string;
  type: QuestionTypeLite;
  options?: string[];
  points: number;
}

interface ResultMeta {
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuestionCardProps {
  question: QuestionLite;
  /** 0-indexed; rendered as Question {index + 1}. */
  index: number;
  /** Whatever the student has typed/picked. */
  answer: string;
  /** Called with the new answer value. Ignored when result is present. */
  onAnswer: (value: string) => void;
  /** When provided, the question is shown in read-only "review" mode with correctness. */
  result?: ResultMeta;
}

/**
 * Shared question renderer used by:
 *   • Tutor session (knowledge-check quiz)
 *   • Student assessment taking + results
 *
 * Handles three question types with consistent affordances:
 *   • multiple_choice → radio-button list (one selection)
 *   • true_false      → two-button toggle
 *   • short_answer    → single-line text input
 *
 * Result mode: when `result` is provided, inputs become read-only and we
 * surface the student's answer + the correct answer + an optional explanation.
 */
export function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
  result,
}: QuestionCardProps) {
  const showResult = Boolean(result);
  const isMC = question.type === "multiple_choice";
  const isTF = question.type === "true_false";
  const isSA = question.type === "short_answer";

  const options = isTF ? ["True", "False"] : (question.options ?? []);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">{question.prompt}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {question.points} {question.points === 1 ? "point" : "points"}
          </p>
        </div>
      </div>

      {(isMC || isTF) && (
        <div className="ml-8 space-y-2">
          {options.map((option) => {
            const isSelected = answer === option;
            const isCorrectOption = showResult && result!.correctAnswer === option;
            const isWrongPick = showResult && isSelected && result!.correctAnswer !== option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => !showResult && onAnswer(option)}
                disabled={showResult}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                  showResult
                    ? isCorrectOption
                      ? "border-success/30 bg-success-light/30"
                      : isWrongPick
                        ? "border-danger/30 bg-danger-light/30"
                        : "border-border bg-card"
                    : isSelected
                      ? "border-portal-accent bg-portal-accent-light/30"
                      : "border-border bg-card hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    showResult
                      ? isCorrectOption
                        ? "border-success bg-success text-white"
                        : isWrongPick
                          ? "border-danger bg-danger text-white"
                          : "border-border"
                      : isSelected
                        ? "border-portal-accent bg-portal-accent"
                        : "border-border",
                  )}
                >
                  {(isSelected || isCorrectOption) && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={cn(
                    showResult && isCorrectOption && "font-medium text-success",
                    showResult && isWrongPick && "font-medium text-danger",
                  )}
                >
                  {option}
                </span>
                {showResult && isCorrectOption && (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-success" />
                )}
                {showResult && isWrongPick && (
                  <XCircle className="ml-auto h-4 w-4 text-danger" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {isSA && (
        <div className="ml-8 space-y-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            disabled={showResult}
            placeholder="Type your answer…"
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm transition-colors",
              showResult
                ? result!.isCorrect
                  ? "border-success/40 bg-success-light/20"
                  : "border-danger/40 bg-danger-light/20"
                : "border-border bg-background focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent",
            )}
          />
          {showResult && !result!.isCorrect && (
            <p className="text-xs text-muted-foreground">
              Correct answer: <span className="font-medium text-success">{result!.correctAnswer}</span>
            </p>
          )}
        </div>
      )}

      {showResult && result!.explanation && (
        <div className="ml-8 rounded-lg bg-muted/50 px-4 py-2.5">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Explanation</p>
          <p className="text-sm text-muted-foreground">{result!.explanation}</p>
        </div>
      )}
    </div>
  );
}
