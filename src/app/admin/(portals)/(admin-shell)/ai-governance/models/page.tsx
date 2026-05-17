"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Cpu,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  Database,
  User,
  RefreshCw,
  Pencil,
  Ban,
  Loader2,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useAiModels, useUpdateAiModel, useTriggerRetrain } from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import {
  formatPercentage,
  formatNumber,
  formatRelative,
} from "@/admin/lib/utils/format";
import type { AiModel } from "@/admin/lib/api/types/admin.types";

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
  const [editOpen, setEditOpen] = useState(false);
  const [deprecateOpen, setDeprecateOpen] = useState(false);
  const [retrainOpen, setRetrainOpen] = useState(false);
  const updateModel = useUpdateAiModel();
  const triggerRetrain = useTriggerRetrain();

  const handleDeprecate = useCallback(async () => {
    const next: AiModel["status"] = model.status === "deprecated" ? "active" : "deprecated";
    try {
      await updateModel.mutateAsync({ id: model.id, status: next });
      toast.success(next === "deprecated" ? `${model.name} deprecated` : `${model.name} reactivated`);
    } catch {
      toast.error("Failed to update model status");
    }
  }, [model, updateModel]);

  const handleRetrain = useCallback(async () => {
    try {
      await triggerRetrain.mutateAsync(model.id);
      toast.success(`Retraining started for ${model.name}. Status will update when complete.`);
    } catch {
      toast.error("Failed to trigger retrain");
    }
  }, [model, triggerRetrain]);

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
              <span>Accuracy: {formatPercentage(model.accuracy * 100)}</span>
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
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRetrainOpen(true)}
              disabled={model.status === "training" || model.status === "deprecated"}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {model.status === "training" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Retraining…
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" /> Trigger Retrain
                </>
              )}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              <Pencil className="h-3 w-3" /> Edit Owner
            </button>
            <button
              onClick={() => setDeprecateOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                model.status === "deprecated"
                  ? "border-success/30 text-success hover:bg-success-light"
                  : "border-danger/30 text-danger hover:bg-danger-light"
              }`}
            >
              <Ban className="h-3 w-3" /> {model.status === "deprecated" ? "Reactivate" : "Deprecate"}
            </button>
          </div>

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
      <EditOwnerDialog open={editOpen} onOpenChange={setEditOpen} model={model} />
      <ConfirmDialog
        open={retrainOpen}
        onOpenChange={setRetrainOpen}
        title="Trigger Retraining"
        description={`Retrain ${model.name} on the latest dataset? Status will switch to "training" and update on completion. Existing predictions remain available during retraining.`}
        confirmLabel="Trigger Retrain"
        onConfirm={handleRetrain}
      />
      <ConfirmDialog
        open={deprecateOpen}
        onOpenChange={setDeprecateOpen}
        title={model.status === "deprecated" ? "Reactivate Model" : "Deprecate Model"}
        description={
          model.status === "deprecated"
            ? `Reactivate ${model.name}? It will resume serving predictions.`
            : `Deprecate ${model.name}? It will stop serving new predictions; downstream consumers should migrate. Existing predictions remain in the audit log.`
        }
        confirmLabel={model.status === "deprecated" ? "Reactivate" : "Deprecate"}
        variant={model.status === "deprecated" ? "default" : "danger"}
        onConfirm={handleDeprecate}
      />
    </div>
  );
}

function EditOwnerDialog({
  open,
  onOpenChange,
  model,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  model: AiModel;
}) {
  const [owner, setOwner] = useState(model.owner);
  const [error, setError] = useState("");
  const updateModel = useUpdateAiModel();

  const handleSave = async () => {
    setError("");
    if (!owner.trim()) {
      setError("Owner name is required");
      return;
    }
    try {
      await updateModel.mutateAsync({ id: model.id, owner: owner.trim() });
      toast.success(`Owner updated to ${owner.trim()}`);
      onOpenChange(false);
    } catch {
      setError("Failed to update owner");
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setOwner(model.owner);
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Edit Model Owner</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Update the responsible owner for {model.name}. Used for escalations and audits.
          </Dialog.Description>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Owner</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Dr. Aarav Sharma — AI Governance Lead"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateModel.isPending}
              className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
            >
              {updateModel.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
