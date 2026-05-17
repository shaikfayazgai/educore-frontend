"use client";

import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Loader2,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useStudentAssessments } from "@/student/lib/hooks/use-student";
import { useStartAssessmentAttempt } from "@/student/lib/hooks/use-student";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { EmptyState } from "@/student/components/shared/feedback/empty-state";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { ApiError } from "@/student/lib/api/client";
import { useState } from "react";
import type {
  AssessmentType,
  StudentAssessmentListItem,
} from "@/student/lib/api/types/assessment.types";
import { cn } from "@/student/lib/utils/cn";

const TYPE_LABEL: Record<AssessmentType, string> = {
  quiz: "Quiz",
  midterm: "Midterm",
  final: "Final",
  exam: "Exam",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const suffix = ms > 0 ? "from now" : "ago";
  if (abs < 60_000) return ms > 0 ? "in a moment" : "moments ago";
  if (minutes < 60) return `${minutes}m ${suffix}`;
  if (hours < 48) return `${hours}h ${suffix}`;
  return `${days}d ${suffix}`;
}

export function StudentAssessmentsTab({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useStudentAssessments(courseId);
  const startMut = useStartAssessmentAttempt();
  const [startError, setStartError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  async function handleStart(assessmentId: string) {
    setStartError(null);
    setStartingId(assessmentId);
    try {
      await startMut.mutateAsync({ courseId, assessmentId });
      router.push(`/student/academics/${courseId}/assessments/${assessmentId}/take`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not start. Please retry.";
      setStartError(msg);
    } finally {
      setStartingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  const list = data ?? [];

  if (list.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No assessments available"
        description="Your instructor hasn't published any assessments for this course yet. Check back later."
      />
    );
  }

  const active = list.filter((a) => a.studentStatus === "open" || a.studentStatus === "in_progress");
  const upcoming = list.filter((a) => a.studentStatus === "not_open");
  const completed = list.filter((a) => a.studentStatus === "completed" || a.studentStatus === "exhausted");
  const missed = list.filter((a) => a.studentStatus === "closed");

  function renderCards(items: typeof list) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((a) => (
          <AssessmentCard
            key={a.id}
            item={a}
            isStarting={startingId === a.id}
            onStart={() => handleStart(a.id)}
            onResume={() => router.push(`/student/academics/${courseId}/assessments/${a.id}/take`)}
            onViewResult={() => {
              const qs = a.lastAttemptId ? `?attempt=${a.lastAttemptId}` : "";
              router.push(`/student/academics/${courseId}/assessments/${a.id}/result${qs}`);
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Auto-graded on submit. Best score across all attempts counts toward your grade.</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {startError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-light/20 px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{startError}</span>
          <button onClick={() => setStartError(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-portal-accent">Active</h3>
          {renderCards(active)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
          {renderCards(upcoming)}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed</h3>
          {renderCards(completed)}
        </div>
      )}

      {missed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-danger">Missed</h3>
          {renderCards(missed)}
        </div>
      )}
    </div>
  );
}

function AssessmentCard({
  item: a,
  isStarting,
  onStart,
  onResume,
  onViewResult,
}: {
  item: StudentAssessmentListItem;
  isStarting: boolean;
  onStart: () => void;
  onResume: () => void;
  onViewResult: () => void;
}) {
  const meta: { variant: React.ComponentProps<typeof StatusBadge>["variant"]; label: string; cta?: React.ReactNode } = (() => {
    switch (a.studentStatus) {
      case "open":
        return {
          variant: "success",
          label: `Open · closes ${relative(a.closesAt)}`,
          cta: (
            <button
              onClick={onStart}
              disabled={isStarting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-3 py-1.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
            >
              {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Start
            </button>
          ),
        };
      case "in_progress":
        return {
          variant: "info",
          label: "Attempt in progress",
          cta: (
            <button
              onClick={onResume}
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-3 py-1.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Resume
            </button>
          ),
        };
      case "completed": {
        const pct = a.maxScore > 0 ? (a.bestScore ?? 0) / a.maxScore : 0;
        const scoreVariant = pct >= 0.8 ? "success" : pct >= 0.6 ? "warning" : "danger";
        const scoreIconClass = pct >= 0.8 ? "text-success" : pct >= 0.6 ? "text-warning" : "text-danger";
        return {
          variant: scoreVariant,
          label: `Best ${a.bestScore}/${a.maxScore}`,
          cta: (
            <button
              onClick={onViewResult}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <CheckCircle2 className={cn("h-3.5 w-3.5", scoreIconClass)} />
              View result
              {a.attemptsUsed < a.attemptsAllowed && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({a.attemptsAllowed - a.attemptsUsed} left)
                </span>
              )}
            </button>
          ),
        };
      }
      case "not_open":
        return {
          variant: "muted",
          label: `Opens ${relative(a.opensAt)}`,
          cta: (
            <button
              disabled
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
            >
              <Lock className="h-3.5 w-3.5" />
              Not open yet
            </button>
          ),
        };
      case "closed":
        return {
          variant: "warning",
          label: `Closed ${relative(a.closesAt)}`,
          cta: (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Closed without an attempt
            </span>
          ),
        };
      case "exhausted": {
        const pct = a.maxScore > 0 ? (a.bestScore ?? 0) / a.maxScore : 0;
        const scoreVariant = pct >= 0.8 ? "success" : pct >= 0.6 ? "warning" : "danger";
        return {
          variant: scoreVariant,
          label: `Best ${a.bestScore}/${a.maxScore} · All attempts used`,
          cta: (
            <button
              onClick={onViewResult}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              View last attempt
            </button>
          ),
        };
      }
    }
  })();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant="muted">{TYPE_LABEL[a.type]}</StatusBadge>
          <StatusBadge variant={meta.variant} dot>
            {meta.label}
          </StatusBadge>
        </div>
        <span className="text-xs text-muted-foreground">{a.weight}% of grade</span>
      </div>
      <h3 className="mt-2 text-base font-semibold">{a.title}</h3>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          {a.questionCount} {a.questionCount === 1 ? "question" : "questions"}
        </span>
        <span>{a.maxScore} pts</span>
        {a.timeLimitMinutes && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {a.timeLimitMinutes} min
          </span>
        )}
        <span>
          Attempts {a.attemptsUsed}/{a.attemptsAllowed}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {a.studentStatus !== "closed" && (
            <>Opens {formatDateTime(a.opensAt)} → closes {formatDateTime(a.closesAt)}</>
          )}
        </span>
        <div className={cn("flex items-center gap-2")}>{meta.cta}</div>
      </div>
    </div>
  );
}
