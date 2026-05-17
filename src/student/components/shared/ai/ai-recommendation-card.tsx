"use client";

import { useState } from "react";
import { Sparkles, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/student/lib/utils/cn";
import { AiConfidenceIndicator } from "./ai-confidence-indicator";
import { ApproveDismissActions } from "./approve-dismiss-actions";
import { ExplainabilityDrawer } from "./explainability-drawer";

interface AiRecommendationCardProps {
  id: string;
  title: string;
  description: string;
  confidence: number;
  priority: "high" | "medium" | "low";
  explanation: {
    summary: string;
    factors: {
      name: string;
      value: string | number;
      weight: number;
      direction: "positive" | "negative" | "neutral";
    }[];
    dataSources: string[];
    modelVersion: string;
    generatedAt: string;
  };
  status?: "pending" | "approved" | "dismissed";
  onApprove: (id: string) => void | Promise<void>;
  onDismiss: (id: string, reason: string) => void | Promise<void>;
  className?: string;
}

const priorityConfig = {
  high: { color: "text-danger", bg: "bg-danger-light", label: "High Priority" },
  medium: { color: "text-warning", bg: "bg-warning-light", label: "Medium" },
  low: { color: "text-info", bg: "bg-info-light", label: "Low" },
};

export function AiRecommendationCard({
  id,
  title,
  description,
  confidence,
  priority,
  explanation,
  status = "pending",
  onApprove,
  onDismiss,
  className,
}: AiRecommendationCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  const handleApprove = async () => {
    await onApprove(id);
    setLocalStatus("approved");
  };

  const handleDismiss = async (reason: string) => {
    await onDismiss(id, reason);
    setLocalStatus("dismissed");
  };

  const pConfig = priorityConfig[priority];

  if (localStatus === "approved") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-success/20 bg-success-light/50 p-4",
          className
        )}
      >
        <CheckCircle2 className="h-5 w-5 text-success" />
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-success">Approved</p>
        </div>
      </div>
    );
  }

  if (localStatus === "dismissed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 opacity-60",
          className
        )}
      >
        <XCircle className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium line-through">{title}</p>
          <p className="text-xs text-muted-foreground">Dismissed</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-portal-accent-light">
              <Sparkles className="h-4.5 w-4.5 text-portal-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              pConfig.bg,
              pConfig.color
            )}
          >
            {pConfig.label}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AiConfidenceIndicator confidence={confidence} />
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
            >
              <Info className="h-3 w-3" />
              Why this recommendation?
            </button>
          </div>
          <ApproveDismissActions
            onApprove={handleApprove}
            onDismiss={handleDismiss}
          />
        </div>
      </div>

      <ExplainabilityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={title}
        summary={explanation.summary}
        factors={explanation.factors}
        dataSources={explanation.dataSources}
        modelVersion={explanation.modelVersion}
        generatedAt={explanation.generatedAt}
      />
    </>
  );
}
