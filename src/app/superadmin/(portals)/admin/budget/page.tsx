"use client";

import { Wallet, AlertTriangle, DollarSign, PiggyBank, TrendingDown } from "lucide-react";
import { useBudgetOverview } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatCurrency, formatPercentage, formatRelative } from "@/superadmin/lib/utils/format";

const ALERT_TYPE_LABELS: Record<string, string> = {
  overspend: "Overspend",
  approaching_limit: "Approaching Limit",
  anomaly: "Anomaly",
};

export default function AdminBudgetPage() {
  const { data, isLoading, isError, refetch } = useBudgetOverview();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Wallet}
          title="Budget & Resources"
          description="Financial overview and department allocation tracking"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Wallet}
          title="Budget & Resources"
          description="Financial overview and department allocation tracking"
        />
        <ErrorState
          title="Failed to load budget data"
          message="Could not retrieve budget information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const monthlyData = data.monthlySpend.map((m) => ({
    label: m.month,
    value: m.amount,
  }));

  const deptData = data.byDepartment.map((d) => ({
    label: d.department,
    allocated: d.allocated,
    spent: d.spent,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Budget & Resources"
        description="Financial overview and department allocation tracking"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Budget"
          value={formatCurrency(data.totalBudget)}
          icon={DollarSign}
        />
        <StatCard
          label="Spent"
          value={formatCurrency(data.spent)}
          icon={TrendingDown}
        />
        <StatCard
          label="Remaining"
          value={formatCurrency(data.remaining)}
          icon={PiggyBank}
        />
        <div>
          <GaugeChart
            label="Utilization Rate"
            value={Math.round(data.utilizationRate)}
            size="sm"
          />
          <p className="mt-1 px-2 text-center text-xs text-muted-foreground">
            Current fiscal year utilization. Target: 85-95% by year end.
          </p>
        </div>
      </div>

      {/* Monthly Spend Trend */}
      <AreaTrend
        title="Monthly Spend"
        data={monthlyData}
        color="#7c3aed"
      />

      {/* Department Allocation */}
      <BarComparison
        title="Department Allocation vs Spend"
        data={deptData}
        bars={[
          { dataKey: "allocated", label: "Allocated", color: "#2563eb" },
          { dataKey: "spent", label: "Spent", color: "#dc2626" },
        ]}
      />

      {/* Budget Alerts */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold">Budget Alerts</h3>
        </div>
        {data.alerts.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No budget alerts at this time.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-6 py-4"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{alert.department}</p>
                    <StatusBadge variant={getRiskVariant(alert.severity)}>
                      {alert.severity}
                    </StatusBadge>
                    <StatusBadge variant="muted">
                      {ALERT_TYPE_LABELS[alert.type] || alert.type}
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelative(alert.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-border px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Budget alerts are generated automatically when departments approach or exceed their allocated budget.
          </p>
        </div>
      </div>
    </div>
  );
}
