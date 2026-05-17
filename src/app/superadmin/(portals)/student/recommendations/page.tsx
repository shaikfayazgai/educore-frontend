"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Inbox, ExternalLink } from "lucide-react";
import {
  useRecommendations,
  useApproveRecommendation,
  useDismissRecommendation,
} from "@/superadmin/lib/hooks/use-student";
import type { StudentRecommendation, DismissReason } from "@/superadmin/lib/api/types/student.types";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { AiRecommendationCard } from "@/superadmin/components/shared/ai/ai-recommendation-card";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";

type FilterTab = "all" | "pending" | "approved" | "dismissed";

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "dismissed", label: "Dismissed" },
];

const typeVariantMap: Record<StudentRecommendation["type"], { variant: "info" | "default" | "success" | "warning" | "danger"; label: string }> = {
  course: { variant: "info", label: "Course" },
  skill: { variant: "default", label: "Skill" },
  job: { variant: "success", label: "Job" },
  resource: { variant: "warning", label: "Resource" },
  intervention: { variant: "danger", label: "Intervention" },
};

const dismissReasonOptions: { value: DismissReason; label: string }[] = [
  { value: "not_relevant", label: "Not relevant to my goals" },
  { value: "already_completed", label: "Already completed" },
  { value: "too_advanced", label: "Too advanced for me" },
  { value: "too_basic", label: "Too basic for me" },
  { value: "not_interested", label: "Not interested in this area" },
];

export default function StudentRecommendationsPage() {
  const { data: recommendations, isLoading, isError, refetch } = useRecommendations();
  const approveMutation = useApproveRecommendation();
  const dismissMutation = useDismissRecommendation();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Sparkles} title="AI Recommendations" description="Personalized AI-powered recommendations" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const filtered = (recommendations ?? []).filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const counts = {
    all: (recommendations ?? []).length,
    pending: (recommendations ?? []).filter((r) => r.status === "pending").length,
    approved: (recommendations ?? []).filter((r) => r.status === "approved").length,
    dismissed: (recommendations ?? []).filter((r) => r.status === "dismissed").length,
  };

  const handleDismissWithReason = async (id: string, reason: DismissReason) => {
    await dismissMutation.mutateAsync({ id, reason });
    setDismissingId(null);
    setDismissedMessage("Got it. Your future recommendations will be adjusted.");
    setTimeout(() => setDismissedMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="AI Recommendations"
        description="Personalized AI-powered recommendations for your academic journey"
      />

      <p className="text-sm text-muted-foreground -mt-3">
        Recommendations are generated automatically based on your academic progress, skills, and career goals.
      </p>

      {/* Dismissed confirmation toast */}
      {dismissedMessage && (
        <div className="rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
          {dismissedMessage}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">({counts[tab.value]})</span>
          </button>
        ))}
      </div>

      {/* Recommendations */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === "all" ? "No recommendations yet" : `No ${filter} recommendations`}
          description={
            filter === "all"
              ? "AI recommendations will appear here as the system analyzes your progress."
              : "Try switching to a different filter."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((rec) => {
            const typeConfig = typeVariantMap[rec.type];

            return (
              <div key={rec.id} className="relative">
                {/* Type badge overlay */}
                <div className="absolute right-3 top-3 z-10">
                  <StatusBadge variant={typeConfig.variant} dot>
                    {typeConfig.label}
                  </StatusBadge>
                </div>

                <AiRecommendationCard
                  id={rec.id}
                  title={rec.title}
                  description={rec.description}
                  confidence={rec.confidence}
                  priority={rec.priority}
                  explanation={rec.explanation}
                  status={rec.status}
                  onApprove={async (id) => {
                    await approveMutation.mutateAsync(id);
                  }}
                  onDismiss={async (id) => {
                    // Instead of accepting the freeform reason from the shared component,
                    // we intercept and show our structured dismiss dropdown
                    setDismissingId(id);
                  }}
                />

                {/* Follow-up action for approved recommendations */}
                {rec.status === "approved" && rec.followUpUrl && rec.followUpLabel && (
                  <div className="mt-2">
                    <Link
                      href={rec.followUpUrl}
                      className={cn(
                        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5",
                        "bg-portal-accent text-portal-accent-foreground text-sm font-medium",
                        "transition-colors hover:bg-portal-accent/90"
                      )}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {rec.followUpLabel}
                    </Link>
                  </div>
                )}

                {/* Structured dismiss reason selector */}
                {dismissingId === rec.id && (
                  <div className="mt-2 rounded-xl border border-border bg-card p-3 shadow-lg">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Why are you dismissing this?
                    </p>
                    <select
                      autoFocus
                      defaultValue=""
                      onChange={async (e) => {
                        const reason = e.target.value as DismissReason;
                        if (reason) {
                          await handleDismissWithReason(rec.id, reason);
                        }
                      }}
                      className={cn(
                        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-portal-accent/50"
                      )}
                    >
                      <option value="" disabled>
                        Select a reason...
                      </option>
                      {dismissReasonOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setDismissingId(null)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
