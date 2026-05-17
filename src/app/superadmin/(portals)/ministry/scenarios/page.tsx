"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCompare, Lightbulb } from "lucide-react";
import {
  useSimulationResults,
  useScenarioComparison,
} from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";

const COMPARISON_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
];

export default function MinistryScenarioPage() {
  const {
    data: simulations,
    isLoading: simsLoading,
    isError: simsError,
    refetch,
  } = useSimulationResults();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    data: comparison,
    isLoading: compLoading,
    isError: compError,
  } = useScenarioComparison(selectedIds);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };

  if (simsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={GitCompare}
          title="Scenario Comparison"
          description="Compare policy simulation outcomes side by side"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (simsError) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={GitCompare}
          title="Scenario Comparison"
          description="Compare policy simulation outcomes side by side"
        />
        <ErrorState
          title="Failed to load simulations"
          message="Could not retrieve simulation data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const completedSims = (simulations ?? []).filter(
    (s) => s.status === "completed"
  );

  if (completedSims.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={GitCompare}
          title="Scenario Comparison"
          description="Compare policy simulation outcomes side by side"
        />
        <EmptyState
          icon={GitCompare}
          title="No simulations available"
          description="Run at least two simulations to compare scenarios."
          action={{
            label: "Go to Simulations",
            onClick: () => {
              window.location.href = "/ministry/simulation";
            },
          }}
        />
      </div>
    );
  }

  // Build bar comparison data from differentials
  const barData: { label: string; [key: string]: string | number }[] =
    comparison?.differentials.map((d) => {
      const row: { label: string; [key: string]: string | number } = { label: d.metricName };
      d.values.forEach((v) => {
        row[v.scenarioName] = v.value;
      });
      return row;
    }) ?? [];

  const barKeys =
    comparison?.scenarios.map((s, i) => ({
      dataKey: s.scenarioName,
      label: s.scenarioName,
      color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GitCompare}
        title="Scenario Comparison"
        description="Compare policy simulation outcomes side by side"
      />

      {/* Scenario Selection */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold">
          Select Scenarios to Compare
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose at least 2 completed simulations
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {completedSims.map((sim) => {
            const isSelected = selectedIds.includes(sim.id);
            return (
              <button
                key={sim.id}
                onClick={() => handleToggle(sim.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                  isSelected
                    ? "border-portal-accent bg-portal-accent-light text-portal-accent"
                    : "border-border bg-background text-foreground hover:border-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    isSelected
                      ? "border-portal-accent bg-portal-accent"
                      : "border-muted-foreground"
                  )}
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3 text-portal-accent-foreground"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                {sim.scenarioName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Results */}
      {selectedIds.length < 2 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select at least 2 scenarios above to see the comparison
          </p>
        </div>
      )}

      {selectedIds.length >= 2 && compLoading && <DashboardSkeleton />}

      {selectedIds.length >= 2 && compError && (
        <ErrorState
          title="Comparison failed"
          message="Could not compare the selected scenarios."
        />
      )}

      {comparison && selectedIds.length >= 2 && (
        <div className="space-y-6">
          {/* Differentials Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Metrics Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Metric
                    </th>
                    {comparison.scenarios.map((s) => (
                      <th
                        key={s.id}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {s.scenarioName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.differentials.map((d) => (
                    <tr
                      key={d.metricName}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {d.metricName}
                      </td>
                      {d.values.map((v) => (
                        <td key={v.scenarioId} className="px-4 py-3 text-sm">
                          {typeof v.value === "number"
                            ? v.value.toLocaleString()
                            : v.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart */}
          {barData.length > 0 && barKeys.length > 0 && (
            <BarComparison
              title="Key Metrics Comparison"
              data={barData}
              bars={barKeys}
              height={350}
            />
          )}

          {/* Insights from each scenario */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {comparison.scenarios.map((scenario, i) => (
              <div
                key={scenario.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                    }}
                  />
                  <h4 className="text-sm font-semibold">
                    {scenario.scenarioName}
                  </h4>
                </div>
                {scenario.insights.length > 0 ? (
                  <ul className="space-y-1.5">
                    {scenario.insights.map((insight, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No insights available for this scenario.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
