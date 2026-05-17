"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAssessmentAttemptResult } from "@/student/lib/hooks/use-student";
import { QuestionCard } from "@/student/components/shared/quiz/question-card";
import { DashboardSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { cn } from "@/student/lib/utils/cn";

export default function ResultPageWrapper({
  params,
}: {
  params: Promise<{ courseId: string; assessmentId: string }>;
}) {
  const { courseId, assessmentId } = use(params);
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ResultInner courseId={courseId} assessmentId={assessmentId} />
    </Suspense>
  );
}

function ResultInner({
  courseId,
  assessmentId,
}: {
  courseId: string;
  assessmentId: string;
}) {
  const params = useSearchParams();
  const attemptId = params.get("attempt") ?? "";
  const { data: result, isLoading, isError, refetch } = useAssessmentAttemptResult(
    courseId,
    assessmentId,
    attemptId,
  );

  if (!attemptId) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <div className="rounded-xl border border-warning/30 bg-warning-light/20 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-warning" />
          <h2 className="mt-3 text-lg font-semibold">No attempt selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open this page from the course Assessments tab so we know which attempt to show.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <DashboardSkeleton />
      </div>
    );
  }
  if (isError || !result) {
    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

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
            <h2 className="text-lg font-semibold">{result.assessmentTitle}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Attempt {result.attemptNumber} · Submitted{" "}
              {new Date(result.submittedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold">
              {result.score}/{result.maxScore}
            </p>
            <p className="text-xs text-muted-foreground">{percentage}%</p>
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
