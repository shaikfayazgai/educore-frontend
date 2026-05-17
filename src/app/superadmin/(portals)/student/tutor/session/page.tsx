"use client";

import { Suspense, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Trophy,
  XCircle,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import {
  useTutorSession,
  useCompleteSection,
  useSubmitQuiz,
  useAddBookmark,
} from "@/superadmin/lib/hooks/use-tutor";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import type { QuizQuestion, ContentSection, AiTutorFeedback, SessionQuiz } from "@/superadmin/lib/api/types/tutor.types";

export default function SessionPageWrapper() {
  return (
    <Suspense fallback={<SessionLoadingFallback />}>
      <SessionPage />
    </Suspense>
  );
}

function SessionLoadingFallback() {
  return (
    <div className="space-y-6">
      <Link
        href="/student/tutor/learning-path"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Learning Paths
      </Link>
      <DashboardSkeleton />
    </div>
  );
}

function SessionPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") ?? "";

  const { data: session, isLoading, isError, refetch } = useTutorSession(sessionId);
  const completeSection = useCompleteSection();
  const submitQuiz = useSubmitQuiz();
  const addBookmark = useAddBookmark();

  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<string>>(new Set());

  const handleCompleteSection = useCallback(async (sectionId: string) => {
    if (!sessionId) return;
    await completeSection.mutateAsync({ sessionId, sectionId });
  }, [completeSection, sessionId]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!session?.quiz || !sessionId) return;
    const answers = Object.entries(quizAnswers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    await submitQuiz.mutateAsync({ sessionId, answers });
    setQuizSubmitted(true);
  }, [session, sessionId, quizAnswers, submitQuiz]);

  const handleBookmarkSection = useCallback(async (sectionId: string, sectionTitle: string) => {
    if (!session) return;
    await addBookmark.mutateAsync({
      sectionId,
      sectionTitle,
      pathTitle: session.pathName,
      skill: session.skill,
    });
    setBookmarkedSections((prev) => new Set(prev).add(sectionId));
  }, [addBookmark, session]);

  if (!sessionId) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/tutor/learning-path"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Paths
        </Link>
        <ErrorState
          title="No session specified"
          message="A valid session ID is required. Please select a module from your learning paths to start a session."
        />
        <Link
          href="/student/tutor/learning-path"
          className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
        >
          <BookOpen className="h-4 w-4" />
          Go to Learning Paths
        </Link>
      </div>
    );
  }

  if (isLoading) return <SessionLoadingFallback />;

  if (isError || !session) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/tutor/learning-path"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Paths
        </Link>
        <ErrorState
          title="Failed to load session"
          message="Could not load the learning session. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const sections = session.content.sections;
  const completedSections = sections.filter((s) => s.completed).length;
  const allSectionsComplete = completedSections === sections.length;
  const sectionProgress = sections.length > 0
    ? Math.round((completedSections / sections.length) * 100)
    : 0;

  const quiz = session.quiz;
  const hasQuiz = !!quiz && quiz.questions.length > 0;
  const showQuiz = allSectionsComplete && hasQuiz;
  const quizQuestionsCount = quiz?.questions.length ?? 0;
  const allQuestionsAnswered = hasQuiz && Object.keys(quizAnswers).length === quizQuestionsCount;

  const feedback = session.feedback;
  const showFeedback = quizSubmitted || (session.status === "completed" && feedback);

  return (
    <div className="space-y-6">
      <Link
        href="/student/tutor/learning-path"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Learning Paths
      </Link>

      {/* Session Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge variant="default">{session.skill}</StatusBadge>
              <span className="text-xs text-muted-foreground">{session.pathName}</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{session.moduleName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{session.content.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge variant={session.status === "completed" ? "success" : "info"} dot>
              {session.status === "completed" ? "Completed" : "In Progress"}
            </StatusBadge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progress: {completedSections} / {sections.length} sections</span>
            <span>{sectionProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                sectionProgress === 100 ? "bg-success" : "bg-portal-accent"
              )}
              style={{ width: `${sectionProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            index={index}
            onComplete={handleCompleteSection}
            isCompleting={completeSection.isPending}
            completingId={completeSection.variables?.sectionId}
            onBookmark={handleBookmarkSection}
            isBookmarked={bookmarkedSections.has(section.id)}
            isBookmarking={addBookmark.isPending}
          />
        ))}
      </div>

      {/* Quiz Section */}
      {showQuiz && !showFeedback && quiz && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Knowledge Check</h2>
              <p className="text-sm text-muted-foreground">
                Answer all questions to complete this module
                {quiz.passingScore > 0 && ` (${quiz.passingScore}% to pass)`}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((q, qIndex) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={qIndex}
                selectedAnswer={quizAnswers[q.id] ?? ""}
                onAnswer={(answer) =>
                  setQuizAnswers((prev) => ({ ...prev, [q.id]: answer }))
                }
                showResult={false}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {Object.keys(quizAnswers).length} / {quizQuestionsCount} answered
            </p>
            <button
              onClick={handleSubmitQuiz}
              disabled={!allQuestionsAnswered || submitQuiz.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-5 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
            >
              {submitQuiz.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Submit Quiz
            </button>
          </div>
        </div>
      )}

      {/* Quiz Results (after quiz submitted, if session has updated answers) */}
      {showFeedback && quiz && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-light">
              <AlertCircle className="h-5 w-5 text-info" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Quiz Results</h2>
              <p className="text-sm text-muted-foreground">
                Review your answers below
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {quiz.questions.map((q, qIndex) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={qIndex}
                selectedAnswer={q.userAnswer ?? quizAnswers[q.id] ?? ""}
                onAnswer={() => {}}
                showResult
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback Section */}
      {showFeedback && feedback && (
        <FeedbackCard
          feedback={feedback}
          score={session.score}
          quiz={quiz}
        />
      )}

      {/* Not all sections complete hint */}
      {!allSectionsComplete && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Complete all sections above to unlock the quiz.
          </p>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  index,
  onComplete,
  isCompleting,
  completingId,
  onBookmark,
  isBookmarked,
  isBookmarking,
}: {
  section: ContentSection;
  index: number;
  onComplete: (sectionId: string) => void;
  isCompleting: boolean;
  completingId?: string;
  onBookmark: (sectionId: string, sectionTitle: string) => void;
  isBookmarked: boolean;
  isBookmarking: boolean;
}) {
  const isThisCompleting = isCompleting && completingId === section.id;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-shadow",
        section.completed
          ? "border-success/20"
          : "border-border hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3 p-5">
        {/* Status */}
        <div className="flex-shrink-0 pt-0.5">
          {section.completed ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Section {index + 1}
              </span>
              <StatusBadge variant="muted" size="sm">{section.type}</StatusBadge>
            </div>
            <button
              onClick={() => onBookmark(section.id, section.title)}
              disabled={isBookmarked || isBookmarking}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                isBookmarked
                  ? "text-portal-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isBookmarked ? "Bookmarked" : "Bookmark this section"}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </button>
          </div>
          <h3 className="text-sm font-semibold">{section.title}</h3>
          <div className="mt-3 prose prose-sm max-w-none text-sm text-muted-foreground leading-relaxed">
            {section.content.split("\n").map((para, i) => (
              <p key={i} className={i > 0 ? "mt-2" : ""}>{para}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Mark Complete action */}
      {!section.completed && (
        <div className="border-t border-border px-5 py-3 flex justify-end">
          <button
            onClick={() => onComplete(section.id)}
            disabled={isThisCompleting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isThisCompleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  selectedAnswer,
  onAnswer,
  showResult,
}: {
  question: QuizQuestion;
  index: number;
  selectedAnswer: string;
  onAnswer: (answer: string) => void;
  showResult: boolean;
}) {
  const isTrueFalse = question.type === "true_false";
  const isMultipleChoice = question.type === "multiple_choice";

  const options = isTrueFalse
    ? ["True", "False"]
    : question.options ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {index + 1}
        </span>
        <p className="text-sm font-medium pt-0.5">{question.question}</p>
      </div>

      <div className="ml-8 space-y-2">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = showResult && question.correctAnswer === option;
          const isWrong = showResult && isSelected && question.correctAnswer !== option;

          return (
            <button
              key={option}
              onClick={() => !showResult && onAnswer(option)}
              disabled={showResult}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                showResult
                  ? isCorrect
                    ? "border-success/30 bg-success-light/30"
                    : isWrong
                      ? "border-danger/30 bg-danger-light/30"
                      : "border-border bg-card"
                  : isSelected
                    ? "border-portal-accent bg-portal-accent-light/30"
                    : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  showResult
                    ? isCorrect
                      ? "border-success bg-success text-white"
                      : isWrong
                        ? "border-danger bg-danger text-white"
                        : "border-border"
                    : isSelected
                      ? "border-portal-accent bg-portal-accent"
                      : "border-border"
                )}
              >
                {(isSelected || isCorrect) && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <span className={cn(
                showResult && isCorrect && "font-medium text-success",
                showResult && isWrong && "font-medium text-danger"
              )}>
                {option}
              </span>
              {showResult && isCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-success" />}
              {showResult && isWrong && <XCircle className="ml-auto h-4 w-4 text-danger" />}
            </button>
          );
        })}
      </div>

      {/* Explanation after submit */}
      {showResult && question.explanation && (
        <div className="ml-8 rounded-lg bg-muted/50 px-4 py-2.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Explanation</p>
          <p className="text-sm text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ feedback, score, quiz }: { feedback: AiTutorFeedback; score?: number; quiz?: SessionQuiz }) {
  const passed = feedback.overallScore >= 70;
  const quizFailed = quiz && score !== undefined && quiz.passingScore > 0 && score < quiz.passingScore;
  const canRetake = quizFailed && quiz.attempts < quiz.maxAttempts;

  return (
    <div className={cn(
      "rounded-xl border p-6 space-y-5",
      passed
        ? "border-success/20 bg-success-light/10"
        : "border-warning/20 bg-warning-light/10"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          passed ? "bg-success-light" : "bg-warning-light"
        )}>
          {passed ? (
            <Trophy className="h-6 w-6 text-success" />
          ) : (
            <Sparkles className="h-6 w-6 text-warning" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {passed ? "Great Job!" : "Keep Practicing"}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn(
              "text-2xl font-bold",
              passed ? "text-success" : "text-warning"
            )}>
              {feedback.overallScore}%
            </span>
            <StatusBadge variant={passed ? "success" : "warning"}>
              {passed ? "Passed" : "Needs Improvement"}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {feedback.strengths.length > 0 && (
          <div className="rounded-lg border border-success/10 bg-card p-4">
            <h3 className="text-sm font-semibold text-success mb-2">Strengths</h3>
            <ul className="space-y-1.5">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedback.areasToImprove.length > 0 && (
          <div className="rounded-lg border border-warning/10 bg-card p-4">
            <h3 className="text-sm font-semibold text-warning mb-2">Areas to Improve</h3>
            <ul className="space-y-1.5">
              {feedback.areasToImprove.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Next Steps */}
      {feedback.nextSteps.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Recommended Next Steps</h3>
          <ul className="space-y-1.5">
            {feedback.nextSteps.map((ns, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 text-portal-accent flex-shrink-0 mt-0.5" />
                <span>{ns}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Encouragement */}
      {feedback.encouragement && (
        <div className="rounded-lg bg-portal-accent-light/50 px-4 py-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-portal-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-portal-accent">{feedback.encouragement}</p>
        </div>
      )}

      {/* Quiz Result CTAs */}
      {canRetake && (
        <div className="rounded-lg border border-warning/20 bg-warning-light/20 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-warning">
            You scored {score}%. You need {quiz.passingScore}% to pass. Review the content and try again.
          </p>
          <p className="text-xs text-muted-foreground">
            Attempt {quiz.attempts} of {quiz.maxAttempts}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {canRetake ? (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <ArrowRight className="h-4 w-4" />
            Retake Quiz
          </button>
        ) : passed ? (
          <Link
            href="/student/tutor/learning-path"
            className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            Continue to Next Module
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
        <Link
          href="/student/tutor/learning-path"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Paths
        </Link>
      </div>
    </div>
  );
}
