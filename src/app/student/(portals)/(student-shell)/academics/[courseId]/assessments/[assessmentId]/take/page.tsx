"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import {
  useStudentAssessmentDetail,
  useStartAssessmentAttempt,
  useSubmitAssessmentAttempt,
} from "@/student/lib/hooks/use-student";
import { QuestionCard } from "@/student/components/shared/quiz/question-card";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/student/components/shared/feedback/confirm-dialog";
import { ApiError } from "@/student/lib/api/client";
import { cn } from "@/student/lib/utils/cn";
import type { GradedAttempt } from "@/student/lib/api/types/assessment.types";

const STORAGE_KEY = (assessmentId: string, attemptId: string) =>
  `glimmora_attempt_${assessmentId}_${attemptId}`;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
}

interface AttemptInfo {
  attemptId: string;
  expiresAt: string;
  attemptNumber: number;
}

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ courseId: string; assessmentId: string }>;
}) {
  const { courseId, assessmentId } = use(params);
  const router = useRouter();

  const { data: assessment, isLoading, isError, refetch } =
    useStudentAssessmentDetail(courseId, assessmentId);
  const startMut = useStartAssessmentAttempt();
  const submitMut = useSubmitAssessmentAttempt();

  const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<GradedAttempt | null>(null);
  const autoSubmittedRef = useRef(false);

  // ─── Bootstrap an attempt (start or resume) ────────────────────────────────
  useEffect(() => {
    if (!assessment) return;
    if (assessment.studentStatus === "completed" && assessment.lastAttemptId) {
      // Nothing to take — bounce to results.
      router.replace(
        `/student/academics/${courseId}/assessments/${assessmentId}/result?attempt=${assessment.lastAttemptId}`,
      );
      return;
    }
    if (
      assessment.studentStatus !== "open" &&
      assessment.studentStatus !== "in_progress"
    ) {
      // Not allowed to take right now.
      return;
    }
    if (attempt) return; // already bootstrapped
    let cancelled = false;
    (async () => {
      try {
        const res = await startMut.mutateAsync({ courseId, assessmentId });
        if (cancelled) return;
        const info: AttemptInfo = {
          attemptId: res.data.attemptId,
          expiresAt: res.data.expiresAt,
          attemptNumber: res.data.attemptNumber,
        };
        setAttempt(info);
        // Hydrate any locally-saved answers for this attempt
        try {
          const raw = localStorage.getItem(STORAGE_KEY(assessmentId, info.attemptId));
          if (raw) setAnswers(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      } catch (err) {
        setBootstrapError(
          err instanceof ApiError ? err.message : "Could not start the assessment.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment, courseId, assessmentId]);

  // Persist answers locally so a tab refresh doesn't lose work
  useEffect(() => {
    if (!attempt) return;
    try {
      localStorage.setItem(
        STORAGE_KEY(assessmentId, attempt.attemptId),
        JSON.stringify(answers),
      );
    } catch {
      /* ignore */
    }
  }, [answers, attempt, assessmentId]);

  // Tick the timer
  useEffect(() => {
    if (!attempt || result) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [attempt, result]);

  const timeRemaining = useMemo(() => {
    if (!attempt) return 0;
    return new Date(attempt.expiresAt).getTime() - now;
  }, [attempt, now]);

  // Auto-submit when the timer hits zero
  useEffect(() => {
    if (!attempt || result || autoSubmittedRef.current) return;
    if (timeRemaining <= 0) {
      autoSubmittedRef.current = true;
      void doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, attempt, result]);

  function setAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  async function doSubmit() {
    if (!attempt || !assessment) return;
    setSubmitError(null);
    try {
      const res = await submitMut.mutateAsync({
        courseId,
        assessmentId,
        answers: assessment.questions.map((q) => ({
          questionId: q.id,
          answer: answers[q.id] ?? "",
        })),
      });
      setResult(res.data);
      // Clear local autosave
      try {
        localStorage.removeItem(STORAGE_KEY(assessmentId, attempt.attemptId));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Could not submit. Please retry.",
      );
    }
  }

  // ─── Render branches ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <DashboardSkeleton />
      </div>
    );
  }
  if (isError || !assessment) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  // Final result view — replaces the take UI after a successful submit
  if (result) {
    return <InlineResult result={result} courseId={courseId} />;
  }

  // Status guard
  if (
    assessment.studentStatus !== "open" &&
    assessment.studentStatus !== "in_progress"
  ) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <div className="rounded-xl border border-warning/30 bg-warning-light/20 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-warning" />
          <h2 className="mt-3 text-lg font-semibold">Can't take this right now</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {assessment.studentStatus === "not_open"
              ? "This assessment hasn't opened yet."
              : assessment.studentStatus === "closed"
                ? "This assessment is closed."
                : assessment.studentStatus === "exhausted"
                  ? "You've used all your attempts."
                  : "View your existing result from the course page."}
          </p>
          <Link
            href={`/student/academics/${courseId}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover"
          >
            Back to course
          </Link>
        </div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <div className="rounded-xl border border-danger/30 bg-danger-light/20 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <h2 className="mt-3 text-lg font-semibold">Could not start</h2>
          <p className="mt-1 text-sm text-muted-foreground">{bootstrapError}</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const answeredCount = assessment.questions.filter(
    (q) => (answers[q.id] ?? "").trim().length > 0,
  ).length;
  const timeBadgeVariant: React.ComponentProps<typeof StatusBadge>["variant"] =
    timeRemaining < 5 * 60_000 ? "danger" : timeRemaining < 15 * 60_000 ? "warning" : "info";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink courseId={courseId} />

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="muted">{assessment.type}</StatusBadge>
              <StatusBadge variant="info">Attempt {attempt.attemptNumber}</StatusBadge>
            </div>
            <h1 className="mt-2 text-xl font-semibold">{assessment.title}</h1>
          </div>
          {assessment.timeLimitMinutes && (
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-4 w-4",
                timeBadgeVariant === "danger" ? "text-danger" : timeBadgeVariant === "warning" ? "text-warning" : "text-info",
              )} />
              <StatusBadge variant={timeBadgeVariant}>
                {formatRemaining(timeRemaining)} remaining
              </StatusBadge>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
          {assessment.instructions}
        </p>
        <div className="mt-3 text-xs text-muted-foreground">
          {assessment.questions.length} questions · {assessment.maxScore} points · Answered{" "}
          <span className="font-semibold text-foreground">{answeredCount}</span> of{" "}
          <span className="font-semibold text-foreground">{assessment.questions.length}</span>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-light/20 px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {assessment.questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-border bg-card p-5">
            <QuestionCard
              question={q}
              index={i}
              answer={answers[q.id] ?? ""}
              onAnswer={(v) => setAnswer(q.id, v)}
            />
          </div>
        ))}
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 shadow-lg">
        <div className="text-sm">
          <p>
            Answered <span className="font-semibold">{answeredCount}</span> of{" "}
            <span className="font-semibold">{assessment.questions.length}</span>
          </p>
          {answeredCount < assessment.questions.length && (
            <p className="text-xs text-warning">
              Unanswered questions count as 0 points.
            </p>
          )}
        </div>
        <button
          onClick={() => setConfirmSubmit(true)}
          disabled={submitMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-5 py-2.5 text-sm font-semibold text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {submitMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit assessment
        </button>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit your answers?"
        description={
          answeredCount === assessment.questions.length
            ? "All questions answered. You can't change answers after submitting."
            : `You've left ${assessment.questions.length - answeredCount} question(s) blank. They'll be scored as 0. Continue?`
        }
        confirmLabel="Submit"
        onConfirm={doSubmit}
      />
    </div>
  );
}

function BackLink({ courseId }: { courseId: string }) {
  return (
    <Link
      href={`/student/academics/${courseId}`}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to course
    </Link>
  );
}

// ─── Inline result (right after submit) ──────────────────────────────────────

function InlineResult({
  result,
  courseId,
}: {
  result: GradedAttempt;
  courseId: string;
}) {
  const percentage = Math.round((result.score / result.maxScore) * 1000) / 10;
  const passed = percentage >= 70;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink courseId={courseId} />
      <div
        className={cn(
          "rounded-xl border p-6",
          passed
            ? "border-success/30 bg-success-light/10"
            : "border-warning/30 bg-warning-light/10",
        )}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2
            className={cn("h-8 w-8", passed ? "text-success" : "text-warning")}
          />
          <div>
            <h2 className="text-lg font-semibold">
              {passed ? "Great work" : "Keep practicing"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You scored{" "}
              <span className="font-semibold text-foreground">
                {result.score}/{result.maxScore}
              </span>{" "}
              ({percentage}%) on {result.assessmentTitle}.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {result.questionResults.map((qr, i) => (
          <div key={qr.questionId} className="rounded-xl border border-border bg-card p-5">
            <QuestionCard
              question={{
                id: qr.questionId,
                prompt: qr.prompt,
                type: qr.type,
                options: qr.options,
                points: qr.points,
              }}
              index={i}
              answer={qr.studentAnswer}
              onAnswer={() => {}}
              result={{
                correctAnswer: qr.correctAnswer,
                isCorrect: qr.isCorrect,
                explanation: qr.explanation,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/student/academics/${courseId}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover"
        >
          Back to course
        </Link>
        <Link
          href={`/student/appeals/new?courseId=${courseId}&assessmentId=${result.assessmentId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Appeal this grade
        </Link>
      </div>
    </div>
  );
}
