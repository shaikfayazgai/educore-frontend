"use client";

import { DollarSign } from "lucide-react";
import { useMinistryBudget } from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { DonutBreakdown } from "@/superadmin/components/shared/charts/donut-breakdown";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatCurrency, formatCompact } from "@/superadmin/lib/utils/format";

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: "#2563eb",
  salaries: "#7c3aed",
  research: "#059669",
  scholarships: "#d97706",
  operations: "#dc2626",
};

const FALLBACK_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#be185d",
  "#65a30d",
];

export default function MinistryBudgetPage() {
  const { data, isLoading, isError, refetch } = useMinistryBudget();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={DollarSign}
          title="Budget Intelligence"
          description="National budget allocation and utilization"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={DollarSign}
          title="Budget Intelligence"
          description="National budget allocation and utilization"
        />
        <ErrorState
          title="Failed to load budget data"
          message="Could not retrieve budget information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Category donut data
  const categoryDonutData = data.byCategory.map((cat, i) => ({
    name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    value: cat.amount,
    color:
      CATEGORY_COLORS[cat.category] ??
      FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  // Top 10 institutions by allocation for bar chart
  const top10Institutions = [...data.byInstitution]
    .sort((a, b) => b.allocated - a.allocated)
    .slice(0, 10);

  const institutionBarData = top10Institutions.map((inst) => ({
    label:
      inst.name.length > 20 ? inst.name.slice(0, 18) + "..." : inst.name,
    allocated: inst.allocated,
    utilized: inst.utilized,
  }));

  // Yearly trend data
  const yearlyTrendData = data.yearlyTrend.map((y) => ({
    label: String(y.year),
    value: y.budget,
    budget: y.budget,
    utilized: y.utilized,
  }));

  // Projections data
  const projectionData = data.projections.map((p) => ({
    label: String(p.year),
    value: p.projected,
    projected: p.projected,
    lower: p.lower,
    upper: p.upper,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DollarSign}
        title="Budget Intelligence"
        description="National budget allocation and utilization"
      />

      {/* Stat Cards + Gauge */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Budget"
          value={formatCurrency(data.totalBudget)}
          icon={DollarSign}
        />
        <StatCard
          label="Allocated"
          value={formatCurrency(data.allocated)}
          icon={DollarSign}
        />
        <StatCard
          label="Utilized"
          value={formatCurrency(data.utilized)}
          icon={DollarSign}
        />
        <GaugeChart
          label="Utilization Rate"
          value={Math.round(data.utilizationRate)}
          size="sm"
        />
      </div>

      {/* Category Breakdown + Institution Bar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutBreakdown
          title="Budget by Category"
          data={categoryDonutData}
          centerLabel="Total"
          centerValue={formatCompact(data.totalBudget)}
        />
        <BarComparison
          title="Top 10 Institutions: Allocated vs Utilized"
          data={institutionBarData}
          bars={[
            { dataKey: "allocated", label: "Allocated", color: "#2563eb" },
            { dataKey: "utilized", label: "Utilized", color: "#059669" },
          ]}
          height={320}
        />
      </div>

      {/* Yearly Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarComparison
          title="Budget vs Utilized (Yearly)"
          data={yearlyTrendData.map((y) => ({
            label: y.label,
            budget: y.budget,
            utilized: y.utilized,
          }))}
          bars={[
            { dataKey: "budget", label: "Budget", color: "#2563eb" },
            { dataKey: "utilized", label: "Utilized", color: "#059669" },
          ]}
          height={300}
        />
        <AreaTrend
          title="Budget Projections"
          data={projectionData}
          color="#7c3aed"
        />
      </div>

      {/* Projection Details Table */}
      {data.projections.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold">Projection Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Projected
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Lower Bound
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Upper Bound
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Confidence Range
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.projections.map((p) => (
                  <tr
                    key={p.year}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{p.year}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(p.projected)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatCurrency(p.lower)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatCurrency(p.upper)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-portal-accent/60"
                            style={{
                              width: `${Math.min(
                                ((p.upper - p.lower) / p.projected) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(p.upper - p.lower)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
