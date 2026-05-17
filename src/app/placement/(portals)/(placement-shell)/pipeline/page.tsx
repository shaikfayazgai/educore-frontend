"use client";

import { useState, useCallback } from "react";
import {
  GitCompare,
  ChevronRight,
  Loader2,
  MessageSquarePlus,
  Check,
} from "lucide-react";
import { usePipeline, useUpdatePipelineItem } from "@/placement/lib/hooks/use-placement";
import { PageHeader } from "@/placement/components/shared/misc/page-header";
import { StatusBadge } from "@/placement/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/placement/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/placement/components/shared/feedback/error-state";
import { EmptyState } from "@/placement/components/shared/feedback/empty-state";
import { formatRelative } from "@/placement/lib/utils/format";
import { cn } from "@/placement/lib/utils/cn";
import type { PipelineStage } from "@/placement/lib/api/types/common.types";

const ALL_STAGES: PipelineStage[] = [
  "matched",
  "applied",
  "interviewed",
  "offered",
  "placed",
  "rejected",
];

const STAGE_TABS: { label: string; value: PipelineStage | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Matched", value: "matched" },
  { label: "Applied", value: "applied" },
  { label: "Interviewed", value: "interviewed" },
  { label: "Offered", value: "offered" },
  { label: "Placed", value: "placed" },
  { label: "Rejected", value: "rejected" },
];

function getStageVariant(stage: PipelineStage) {
  const map: Record<PipelineStage, "default" | "info" | "warning" | "success" | "danger" | "muted"> = {
    matched: "muted",
    applied: "info",
    interviewed: "default",
    offered: "warning",
    placed: "success",
    rejected: "danger",
  };
  return map[stage];
}

function getNextStage(current: PipelineStage): PipelineStage | null {
  const flow: PipelineStage[] = [
    "matched",
    "applied",
    "interviewed",
    "offered",
    "placed",
  ];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

const STAGE_LABEL: Record<PipelineStage, string> = {
  matched: "Matched",
  applied: "Applied",
  interviewed: "Interviewed",
  offered: "Offered",
  placed: "Placed",
  rejected: "Rejected",
};

export default function PlacementPipelinePage() {
  const [stage, setStage] = useState<PipelineStage | "all">("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const queryStage = stage === "all" ? undefined : stage;
  const { data: items, isLoading, isError, refetch } = usePipeline({
    stage: queryStage,
  });
  const updateItem = useUpdatePipelineItem();

  const pipeline = items ?? [];

  // Stage counts for summary
  const stageCounts = pipeline.reduce(
    (acc, item) => {
      acc[item.stage] = (acc[item.stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleMoveStage = async (
    id: string,
    newStage: PipelineStage
  ) => {
    setMovingId(id);
    try {
      await updateItem.mutateAsync({ id, stage: newStage });
      setActionFeedback({
        id,
        type: "success",
        message: `Moved to ${STAGE_LABEL[newStage]}.`,
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback({
        id,
        type: "error",
        message: "Failed to move stage.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    } finally {
      setMovingId(null);
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      await updateItem.mutateAsync({ id, notes: noteText });
      setEditingNotes(null);
      setNoteText("");
      setActionFeedback({
        id,
        type: "success",
        message: "Notes saved.",
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback({
        id,
        type: "error",
        message: "Failed to save notes.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GitCompare}
        title="Pipeline"
        description="Track candidates through the placement pipeline"
      />

      {/* Stage Summary Counts */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ALL_STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={cn(
                "rounded-lg border p-3 text-center transition-colors",
                stage === s
                  ? "border-portal-accent bg-portal-accent-light"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              <p className="text-lg font-semibold">
                {stageCounts[s] || 0}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {STAGE_LABEL[s]}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Stage Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {STAGE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStage(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              stage === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pipeline Items */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load pipeline"
          message="Could not retrieve pipeline data. Please try again."
          onRetry={() => refetch()}
        />
      ) : pipeline.length === 0 ? (
        <EmptyState
          title="No pipeline items"
          description={
            stage !== "all"
              ? `No items in the "${STAGE_LABEL[stage as PipelineStage]}" stage.`
              : "The pipeline is empty. Run matching to generate initial candidates."
          }
        />
      ) : (
        <div className="space-y-4">
          {pipeline.map((item) => {
            const nextStage = getNextStage(item.stage);
            const isEditing = editingNotes === item.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {item.studentName}
                      </p>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {item.jobTitle}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.company} &middot; Moved{" "}
                      {formatRelative(item.movedToStageAt)}
                    </p>
                    {item.nextAction && (
                      <p className="mt-2 text-xs">
                        <span className="font-medium text-portal-accent">
                          Next:
                        </span>{" "}
                        {item.nextAction}
                      </p>
                    )}
                  </div>

                  {/* Right: Stage badge + Actions */}
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <StatusBadge variant={getStageVariant(item.stage)} dot>
                      {STAGE_LABEL[item.stage]}
                    </StatusBadge>

                    {/* Move to next stage dropdown */}
                    {nextStage && (
                      <button
                        onClick={() => handleMoveStage(item.id, nextStage)}
                        disabled={movingId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                      >
                        {movingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {STAGE_LABEL[nextStage]}
                      </button>
                    )}

                    {/* Reject option */}
                    {item.stage !== "rejected" && item.stage !== "placed" && (
                      <button
                        onClick={() => handleMoveStage(item.id, "rejected")}
                        disabled={movingId === item.id}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3 border-t border-border pt-3">
                  {isEditing ? (
                    <div className="flex items-end gap-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add notes..."
                        className="flex min-h-[60px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          disabled={updateItem.isPending}
                          className="flex items-center gap-1 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground disabled:opacity-50"
                        >
                          {updateItem.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(null);
                            setNoteText("");
                          }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.notes ? (
                          <p className="text-xs text-muted-foreground">
                            {item.notes}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No notes
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingNotes(item.id);
                          setNoteText(item.notes || "");
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
                      >
                        <MessageSquarePlus className="h-3 w-3" />
                        {item.notes ? "Edit" : "Add note"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Per-card feedback */}
                {actionFeedback?.id === item.id && (
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
            );
          })}
        </div>
      )}
    </div>
  );
}
