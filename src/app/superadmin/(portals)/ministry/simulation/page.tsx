"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Globe,
  Plus,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from "lucide-react";
import {
  useSimulationResults,
  useRunSimulation,
} from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { FormField, FormSelect } from "@/superadmin/components/shared/forms/form-field";
import { formatDate, formatPercentage } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";
import type { SimulationResult } from "@/superadmin/lib/api/types/ministry.types";

const SIMULATION_TYPES = [
  { value: "budget", label: "Budget" },
  { value: "hiring", label: "Hiring" },
  { value: "enrollment", label: "Enrollment" },
  { value: "policy", label: "Policy" },
];

const statusVariant: Record<string, "default" | "success" | "danger" | "warning"> = {
  running: "warning",
  completed: "success",
  failed: "danger",
};

const typeVariant: Record<string, "default" | "info" | "muted" | "warning"> = {
  budget: "default",
  hiring: "info",
  enrollment: "warning",
  policy: "muted",
};

function SimulationCard({
  simulation,
  isExpanded,
  onToggle,
}: {
  simulation: SimulationResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Build projection chart data from metrics
  const projectionData =
    simulation.projections.length > 0
      ? simulation.projections.map((p) => {
          const firstMetricKey = Object.keys(p.metrics)[0];
          return {
            label: String(p.year),
            value: firstMetricKey ? p.metrics[firstMetricKey] : 0,
            ...p.metrics,
          };
        })
      : [];

  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{simulation.scenarioName}</h3>
            <StatusBadge variant={typeVariant[simulation.type] ?? "muted"}>
              {simulation.type}
            </StatusBadge>
            <StatusBadge
              variant={statusVariant[simulation.status] ?? "muted"}
              dot
            >
              {simulation.status}
            </StatusBadge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Confidence: {formatPercentage(simulation.confidence, 0)}
            </span>
            <span>{formatDate(simulation.createdAt)}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-border px-6 py-4">
          {/* Projections Chart */}
          {projectionData.length > 0 && (
            <AreaTrend
              title="Projections"
              data={projectionData}
              color="#2563eb"
              height={220}
            />
          )}

          {/* Parameters */}
          {Object.keys(simulation.parameters).length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Parameters
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(simulation.parameters).map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs"
                  >
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{String(val)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {simulation.insights.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-warning" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  AI Insights
                </p>
              </div>
              <ul className="space-y-1.5">
                {simulation.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-portal-accent" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MinistrySimulationPage() {
  const { data: simulations, isLoading, isError, refetch } = useSimulationResults();
  const runSimulation = useRunSimulation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [scenarioName, setScenarioName] = useState("");
  const [simType, setSimType] = useState("budget");
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [paramKey, setParamKey] = useState("");
  const [paramValue, setParamValue] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});

  const handleAddParam = () => {
    if (paramKey.trim() && paramValue.trim()) {
      setParams((prev) => ({ ...prev, [paramKey.trim()]: paramValue.trim() }));
      setParamKey("");
      setParamValue("");
    }
  };

  const handleRemoveParam = (key: string) => {
    setParams((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRunSimulation = async () => {
    if (!scenarioName.trim()) return;
    await runSimulation.mutateAsync({
      scenarioName: scenarioName.trim(),
      type: simType as "budget" | "hiring" | "enrollment" | "policy",
      timeHorizonYears: timeHorizon,
      parameters: params,
    });
    setDialogOpen(false);
    setScenarioName("");
    setSimType("budget");
    setTimeHorizon(5);
    setParams({});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Globe}
          title="Policy Simulation"
          description="Run and analyze policy scenario simulations"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Globe}
          title="Policy Simulation"
          description="Run and analyze policy scenario simulations"
        />
        <ErrorState
          title="Failed to load simulations"
          message="Could not retrieve simulation results. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const results = simulations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Globe}
        title="Policy Simulation"
        description="Run and analyze policy scenario simulations"
        actions={
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover">
                <Plus className="h-4 w-4" />
                Run New Simulation
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">
                    Run New Simulation
                  </Dialog.Title>
                  <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Configure and run a policy scenario simulation.
                </Dialog.Description>

                <div className="mt-4 space-y-4">
                  <FormField
                    label="Scenario Name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g., 20% Budget Increase"
                    required
                  />

                  <FormSelect
                    label="Simulation Type"
                    options={SIMULATION_TYPES}
                    value={simType}
                    onChange={(e) => setSimType(e.target.value)}
                    required
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">
                      Time Horizon: {timeHorizon} years
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      value={timeHorizon}
                      onChange={(e) => setTimeHorizon(Number(e.target.value))}
                      className="w-full accent-portal-accent"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3 years</span>
                      <span>10 years</span>
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">
                      Parameters
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={paramKey}
                        onChange={(e) => setParamKey(e.target.value)}
                        placeholder="Key"
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                      />
                      <input
                        type="text"
                        value={paramValue}
                        onChange={(e) => setParamValue(e.target.value)}
                        placeholder="Value"
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddParam}
                        disabled={!paramKey.trim() || !paramValue.trim()}
                        className="flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {Object.keys(params).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(params).map(([key, val]) => (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                          >
                            {key}: {val}
                            <button
                              onClick={() => handleRemoveParam(key)}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Dialog.Close className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                    Cancel
                  </Dialog.Close>
                  <button
                    onClick={handleRunSimulation}
                    disabled={
                      !scenarioName.trim() || runSimulation.isPending
                    }
                    className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                  >
                    {runSimulation.isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Run Simulation
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      />

      {/* Simulation Results */}
      {results.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No simulations yet"
          description="Run your first policy simulation to see results here."
          action={{
            label: "Run Simulation",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {results.map((sim) => (
            <SimulationCard
              key={sim.id}
              simulation={sim}
              isExpanded={expandedId === sim.id}
              onToggle={() =>
                setExpandedId(expandedId === sim.id ? null : sim.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
