"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Play,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useMatchResults,
  useRunMatching,
  useApproveMatch,
  useRejectMatch,
} from "@/superadmin/lib/hooks/use-placement";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { AiConfidenceIndicator } from "@/superadmin/components/shared/ai/ai-confidence-indicator";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";
import type { MatchStatus } from "@/superadmin/lib/api/types/common.types";
import type { MatchRunConfig } from "@/superadmin/lib/api/types/placement.types";

const STATUS_TABS: { label: string; value: MatchStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function getMatchStatusVariant(status: MatchStatus) {
  const map: Record<MatchStatus, "warning" | "success" | "danger"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
  };
  return map[status];
}

export default function PlacementMatchingPage() {
  const [status, setStatus] = useState<MatchStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [config, setConfig] = useState<MatchRunConfig>({
    department: "",
    minGpa: 0,
    minEmployability: 0,
    maxResults: 50,
  });
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const queryStatus = status === "all" ? undefined : status;
  const { data, isLoading, isError, refetch } = useMatchResults({
    status: queryStatus,
    pageSize: 50,
  });

  const runMatching = useRunMatching();
  const approveMatch = useApproveMatch();
  const rejectMatch = useRejectMatch();

  const matches = data?.matches ?? [];

  const handleRunMatching = async () => {
    try {
      await runMatching.mutateAsync({
        department: config.department || undefined,
        minGpa: config.minGpa || undefined,
        minEmployability: config.minEmployability || undefined,
        maxResults: config.maxResults || 50,
      });
      setDialogOpen(false);
      refetch();
    } catch {
      // Error handled by mutation state
    }
  };

  const handleApprove = async (matchId: string) => {
    try {
      await approveMatch.mutateAsync(matchId);
      setActionFeedback({
        id: matchId,
        type: "success",
        message: "Match approved successfully.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch {
      setActionFeedback({
        id: matchId,
        type: "error",
        message: "Failed to approve match.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      await rejectMatch.mutateAsync(matchId);
      setActionFeedback({
        id: matchId,
        type: "success",
        message: "Match rejected.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch {
      setActionFeedback({
        id: matchId,
        type: "error",
        message: "Failed to reject match.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="AI Matching Engine"
        description="Match students with job opportunities using AI"
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            disabled={runMatching.isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {runMatching.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {runMatching.isPending ? "Running..." : "Run Matching"}
          </button>
        }
      />

      {/* Run Matching Feedback */}
      {runMatching.isError && (
        <div className="rounded-lg bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          Failed to run matching. Please try again.
        </div>
      )}
      {runMatching.isSuccess && (
        <div className="rounded-lg bg-success-light px-4 py-3 text-sm font-medium text-success">
          Matching completed successfully. Results are shown below.
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              status === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load match results"
          message="Could not retrieve matching results. Please try again."
          onRetry={() => refetch()}
        />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No match results"
          description={
            status !== "all"
              ? "No matches with this status. Try a different filter."
              : "Run the matching engine to generate student-job matches."
          }
          action={{
            label: "Run Matching",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
            >
              {/* Match Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {match.studentName}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {match.studentDepartment}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {match.jobTitle} at {match.company}
                  </p>
                </div>
                <StatusBadge
                  variant={getMatchStatusVariant(match.status)}
                  dot
                >
                  {match.status}
                </StatusBadge>
              </div>

              {/* Match Score */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Match Score</p>
                  <span className="text-sm font-semibold">
                    {Math.round(match.matchScore * 100)}%
                  </span>
                </div>
                <AiConfidenceIndicator
                  confidence={match.matchScore}
                  size="md"
                  showLabel={false}
                />
              </div>

              {/* Skills */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Matched Skills
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {match.matchedSkills.length > 0 ? (
                      match.matchedSkills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-medium text-success"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        None
                      </span>
                    )}
                    {match.matchedSkills.length > 4 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        +{match.matchedSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Gap Skills
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {match.gapSkills.length > 0 ? (
                      match.gapSkills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-danger-light px-2 py-0.5 text-[10px] font-medium text-danger"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        None
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              {match.explanation && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {match.explanation}
                  </p>
                </div>
              )}

              {/* Actions for pending */}
              {match.status === "pending" && (
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => handleApprove(match.id)}
                    disabled={
                      approveMatch.isPending || rejectMatch.isPending
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
                  >
                    {approveMatch.isPending &&
                    approveMatch.variables === match.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(match.id)}
                    disabled={
                      approveMatch.isPending || rejectMatch.isPending
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {rejectMatch.isPending &&
                    rejectMatch.variables === match.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </button>
                </div>
              )}

              {/* Per-card feedback */}
              {actionFeedback?.id === match.id && (
                <div
                  className={cn(
                    "mt-3 rounded-lg px-3 py-2 text-xs font-medium",
                    actionFeedback.type === "success"
                      ? "bg-success-light text-success"
                      : "bg-danger-light text-danger"
                  )}
                >
                  {actionFeedback.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Run Matching Config Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold">
              Run Matching Engine
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Configure matching parameters and run the AI engine.
            </Dialog.Description>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Department Filter
                </label>
                <input
                  type="text"
                  value={config.department || ""}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="All departments (leave empty)"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min GPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={config.minGpa || ""}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        minGpa: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.0"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Min Employability
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.minEmployability || ""}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        minEmployability: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Results</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={config.maxResults || 50}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      maxResults: parseInt(e.target.value) || 50,
                    }))
                  }
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </Dialog.Close>
              <button
                onClick={handleRunMatching}
                disabled={runMatching.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {runMatching.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {runMatching.isPending ? "Running..." : "Run Engine"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
