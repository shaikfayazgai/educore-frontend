"use client";

import { useState } from "react";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useBriefings, useToggleBriefingAction } from "@/faculty/lib/hooks/use-faculty";
import { PageHeader } from "@/faculty/components/shared/misc/page-header";
import { StatusBadge, getRiskVariant } from "@/faculty/components/shared/feedback/status-badge";
import { RiskIndicator } from "@/faculty/components/shared/misc/risk-indicator";
import { DashboardSkeleton } from "@/faculty/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/faculty/components/shared/feedback/error-state";
import { EmptyState } from "@/faculty/components/shared/feedback/empty-state";
import { cn } from "@/faculty/lib/utils/cn";
import { formatDateTime } from "@/faculty/lib/utils/format";
import type { AiBriefing } from "@/faculty/lib/api/types/faculty.types";

const priorityVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  high: "danger",
  medium: "warning",
  low: "muted",
};

export default function FacultyBriefingsPage() {
  const { data: briefings, isLoading, isError, refetch } = useBriefings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!briefings || briefings.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Sparkles}
          title="AI Briefings"
          description="AI-generated pre-class briefings"
        />
        <EmptyState
          icon={Sparkles}
          title="No briefings available"
          description="AI briefings will appear here before your upcoming classes."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="AI Briefings"
        description="AI-generated pre-class briefings"
      />

      <div className="space-y-4">
        {briefings.map((briefing) => (
          <BriefingCard
            key={briefing.id}
            briefing={briefing}
            isExpanded={expandedId === briefing.id}
            onToggle={() =>
              setExpandedId(expandedId === briefing.id ? null : briefing.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

function BriefingCard({
  briefing,
  isExpanded,
  onToggle,
}: {
  briefing: AiBriefing;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const toggleAction = useToggleBriefingAction();
  const [togglingIndex, setTogglingIndex] = useState<number | null>(null);

  const handleToggleAction = async (actionIndex: number) => {
    setTogglingIndex(actionIndex);
    try {
      await toggleAction.mutateAsync({
        courseId: briefing.courseId,
        actionIndex,
      });
    } finally {
      setTogglingIndex(null);
    }
  };

  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-sm">
      {/* Summary (always visible) */}
      <button
        onClick={onToggle}
        className="w-full p-6 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="default">{briefing.courseCode}</StatusBadge>
              <h3 className="text-sm font-semibold">{briefing.courseName}</h3>
              <Link
                href={`/faculty/courses/${briefing.courseId}`}
                onClick={(e) => e.stopPropagation()}
                className="ml-auto text-xs text-portal-accent hover:underline"
              >
                View Course &rarr;
              </Link>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {briefing.classTime}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Generated {formatDateTime(briefing.generatedAt)}
              </span>
            </div>

            {/* Key Insights Preview */}
            <div className="mt-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {briefing.keyInsights[0]}
              </p>
            </div>

            {/* Quick stats */}
            <div className="mt-3 flex flex-wrap gap-3">
              {briefing.studentsToWatch.length > 0 && (
                <StatusBadge variant="warning" dot>
                  {briefing.studentsToWatch.length} students to watch
                </StatusBadge>
              )}
              {briefing.actionItems.filter((a) => !a.completed).length > 0 && (
                <StatusBadge variant="info">
                  {briefing.actionItems.filter((a) => !a.completed).length} pending actions
                </StatusBadge>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-6 pb-6 space-y-6">
          {/* Key Insights */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-warning" />
              <h4 className="text-sm font-semibold">Key Insights</h4>
            </div>
            <ul className="space-y-2">
              {briefing.keyInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-portal-accent" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Students to Watch */}
          {briefing.studentsToWatch.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-danger" />
                <h4 className="text-sm font-semibold">Students to Watch</h4>
              </div>
              <div className="space-y-2">
                {briefing.studentsToWatch.map((student, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <RiskIndicator level={student.riskLevel} showLabel={false} />
                      <div>
                        <Link
                          href={`/faculty/students/${student.studentId}`}
                          className="text-sm font-medium text-portal-accent hover:underline"
                        >
                          {student.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{student.reason}</p>
                      </div>
                    </div>
                    <StatusBadge variant={getRiskVariant(student.riskLevel)}>
                      {student.riskLevel}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Suggestions */}
          {briefing.topicSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-portal-accent" />
                <h4 className="text-sm font-semibold">Topic Suggestions</h4>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Suggested based on recent quiz results and assignment gaps across your students.
              </p>
              <div className="flex flex-wrap gap-2">
                {briefing.topicSuggestions.map((topic, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-portal-accent-light px-3 py-1.5 text-sm text-portal-accent"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {briefing.actionItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="h-4 w-4 text-success" />
                <h4 className="text-sm font-semibold">Action Items</h4>
              </div>
              <div className="space-y-2">
                {briefing.actionItems.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <button
                      onClick={() => handleToggleAction(i)}
                      disabled={togglingIndex === i}
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                        action.completed
                          ? "border-success bg-success text-white"
                          : "border-input hover:border-portal-accent"
                      )}
                    >
                      {togglingIndex === i ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : action.completed ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3">
                          <path
                            d="M2 6l3 3 5-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </button>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          action.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {action.text}
                      </p>
                    </div>
                    <StatusBadge variant={priorityVariant[action.priority]}>
                      {action.priority}
                    </StatusBadge>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Open the{" "}
                <Link
                  href="/faculty/students"
                  className="text-portal-accent hover:underline"
                >
                  student&apos;s profile
                </Link>
                {" "}to drill into individual risk factors.
              </p>
            </div>
          )}

          {/* Class Metrics */}
          {briefing.classMetrics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Class Metrics</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {briefing.classMetrics.map((metric, i) => {
                  const Icon = TrendIcon[metric.trend];
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <p className="text-xs text-muted-foreground">{metric.metric}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{metric.value}</p>
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5",
                            metric.trend === "up"
                              ? "text-success"
                              : metric.trend === "down"
                              ? "text-danger"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
