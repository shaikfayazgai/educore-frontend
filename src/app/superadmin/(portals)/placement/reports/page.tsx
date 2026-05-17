"use client";

import {
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { usePlacementReports } from "@/superadmin/lib/hooks/use-placement";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { formatPercentage, formatCurrency, formatNumber } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

export default function PlacementReportsPage() {
  const { data, isLoading, isError, refetch } = usePlacementReports();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={FileBarChart}
          title="Reports"
          description="Placement analytics and insights"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={FileBarChart}
          title="Reports"
          description="Placement analytics and insights"
        />
        <ErrorState
          title="Failed to load reports"
          message="Could not retrieve placement analytics. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const departmentData = data.byDepartment.map((d) => ({
    label: d.department,
    rate: d.rate,
    placed: d.placed,
    total: d.total,
  }));

  const timeToPlacementData = data.timeToPlacement.map((t) => ({
    label: t.stage,
    avgDays: t.avgDays,
  }));

  const skillsDemandData = data.topSkillsDemand.map((s) => ({
    label: s.skill,
    demand: s.demand,
    supply: s.supply,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileBarChart}
        title="Reports"
        description="Placement analytics and insights"
      />

      {/* Overall Rate + Department Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GaugeChart
          label="Overall Placement Rate"
          value={Math.round(data.overallRate)}
          size="lg"
        />
        <div className="lg:col-span-2">
          <BarComparison
            title="Placement Rate by Department"
            data={departmentData}
            bars={[
              { dataKey: "rate", label: "Rate (%)", color: "#2563eb" },
            ]}
          />
        </div>
      </div>

      {/* Equity Metrics Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Equity Metrics
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Group
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Placement Rate
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Benchmark
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.equityMetrics.map((metric) => (
                <tr key={metric.group}>
                  <td className="py-3 text-sm font-medium">
                    {metric.group}
                  </td>
                  <td className="py-3 text-right text-sm">
                    {formatPercentage(metric.rate)}
                  </td>
                  <td className="py-3 text-right text-sm text-muted-foreground">
                    {formatPercentage(metric.benchmark)}
                  </td>
                  <td className="py-3 text-right">
                    <StatusBadge
                      variant={
                        metric.status === "above"
                          ? "success"
                          : metric.status === "below"
                            ? "danger"
                            : "muted"
                      }
                    >
                      <span className="flex items-center gap-1">
                        {metric.status === "above" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : metric.status === "below" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {metric.status === "above"
                          ? "Above"
                          : metric.status === "below"
                            ? "Below"
                            : "At Benchmark"}
                      </span>
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row: Time to Placement + Skills */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarComparison
          title="Avg Time to Placement (Days per Stage)"
          data={timeToPlacementData}
          bars={[
            { dataKey: "avgDays", label: "Avg Days", color: "#0891b2" },
          ]}
        />
        <BarComparison
          title="Skills Demand vs Supply"
          data={skillsDemandData}
          bars={[
            { dataKey: "demand", label: "Demand", color: "#dc2626" },
            { dataKey: "supply", label: "Supply", color: "#059669" },
          ]}
        />
      </div>

      {/* Cohort Analysis Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Cohort Analysis
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cohort
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Placement Rate
                </th>
                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Salary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.byCohort.map((cohort) => (
                <tr key={cohort.cohort}>
                  <td className="py-3 text-sm font-medium">
                    {cohort.cohort}
                  </td>
                  <td className="py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            cohort.rate >= 80
                              ? "bg-success"
                              : cohort.rate >= 60
                                ? "bg-warning"
                                : "bg-danger"
                          )}
                          style={{ width: `${cohort.rate}%` }}
                        />
                      </div>
                      <span className="font-semibold">
                        {formatPercentage(cohort.rate)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm font-semibold">
                    {formatCurrency(cohort.avgSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
