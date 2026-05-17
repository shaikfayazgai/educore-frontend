"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  Database,
  User,
} from "lucide-react";
import { useAiModels } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import {
  formatPercentage,
  formatNumber,
  formatRelative,
} from "@/superadmin/lib/utils/format";
import type { AiModel } from "@/superadmin/lib/api/types/admin.types";

function getModelStatusVariant(
  status: AiModel["status"]
): "success" | "muted" | "warning" | "danger" {
  const map = {
    active: "success" as const,
    inactive: "muted" as const,
    training: "warning" as const,
    deprecated: "danger" as const,
  };
  return map[status];
}

function ModelCard({ model }: { model: AiModel }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between p-6 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start gap-3">
          {expanded ? (
            <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{model.name}</h3>
              <StatusBadge variant="muted">v{model.version}</StatusBadge>
              <StatusBadge variant={getModelStatusVariant(model.status)} dot>
                {model.status}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {model.domain}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Accuracy: {formatPercentage(model.accuracy)}</span>
              <span>Bias: {model.biasScore.toFixed(2)}</span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {formatNumber(model.dataPoints)} data points
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Trained {formatRelative(model.lastTrainedAt)}
              </span>
            </div>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="space-y-4 border-t border-border p-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <p className="mt-1 text-sm">{model.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">
              <span className="text-muted-foreground">Owner:</span>{" "}
              {model.owner}
            </p>
          </div>
          {model.fairnessMetrics.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Fairness Metrics by Demographic
              </p>
              <div className="space-y-2">
                {model.fairnessMetrics.map((fm) => (
                  <div
                    key={fm.demographic}
                    className="flex items-center gap-3"
                  >
                    <span className="w-28 text-xs text-muted-foreground">
                      {fm.demographic}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-portal-accent transition-all"
                        style={{ width: `${Math.min(fm.score * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium">
                      {(fm.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAiModelsPage() {
  const { data: models, isLoading, isError, refetch } = useAiModels();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Cpu}
          title="Model Registry"
          description="All registered AI models"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !models) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Cpu}
          title="Model Registry"
          description="All registered AI models"
        />
        <ErrorState
          title="Failed to load models"
          message="Could not retrieve AI model data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/ai-governance"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Cpu}
          title="Model Registry"
          description="View and manage all registered AI models, their performance metrics, and fairness scores"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Models are automatically retrained based on data drift detection. Last system-wide retraining check: 7 days ago.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}
