"use client";

import Link from "next/link";
import {
  UserPlus,
  ClipboardList,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAdmissionsDashboard } from "@/superadmin/lib/hooks/use-admissions";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DonutBreakdown } from "@/superadmin/components/shared/charts/donut-breakdown";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatNumber, formatPercentage } from "@/superadmin/lib/utils/format";

const PIPELINE_COLORS: Record<string, string> = {
  submitted: "#6b7280",
  under_review: "#2563eb",
  interview: "#f59e0b",
  accepted: "#059669",
  rejected: "#dc2626",
  waitlisted: "#8b5cf6",
};

const PIPELINE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  interview: "Interview",
  interview_scheduled: "Interview",
  interview_completed: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  enrolled: "Enrolled",
};

const DEMO_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#be185d",
  "#65a30d",
];

export default function AdmissionsDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdmissionsDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={UserPlus}
          title="Admissions"
          description="AI-powered admissions intelligence"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={UserPlus}
          title="Admissions"
          description="AI-powered admissions intelligence"
        />
        <ErrorState
          title="Failed to load admissions dashboard"
          message="Could not retrieve admissions data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const totalPipeline = data.pipeline.reduce((s, p) => s + p.count, 0) || 1;

  const departmentChartData = data.byDepartment.map((d) => ({
    label: d.department,
    applications: d.applications,
    capacity: d.capacity,
  }));

  const monthlyTrendData = data.byMonth.map((m) => ({
    label: m.month,
    value: m.applications,
    decisions: m.decisions,
  }));

  const demographicsData = data.demographics.map((d, i) => ({
    name: d.category,
    value: d.count,
    color: DEMO_COLORS[i % DEMO_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserPlus}
        title="Admissions"
        description={`AI-powered admissions intelligence | ${data.currentCycle}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/admissions/applications"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ClipboardList className="h-4 w-4" />
              Applications
            </Link>
            <Link
              href="/admin/admissions/predictions"
              className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
            >
              <TrendingUp className="h-4 w-4" />
              Predictions
            </Link>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={formatNumber(data.totalApplications)}
          icon={Users}
        />
        <StatCard
          label="Pending Review"
          value={formatNumber(data.pendingReview)}
          icon={Clock}
        />
        <StatCard
          label="Accepted"
          value={formatNumber(data.accepted)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Acceptance Rate"
          value={formatPercentage(data.acceptanceRate)}
          icon={TrendingUp}
        />
      </div>

      {/* Pipeline Visualization */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Application Pipeline</h2>
        <div className="flex h-8 overflow-hidden rounded-lg">
          {data.pipeline.map((stage) => {
            const pct = (stage.count / totalPipeline) * 100;
            if (pct < 1) return null;
            const color = PIPELINE_COLORS[stage.stage] ?? "#9ca3af";
            return (
              <Link
                key={stage.stage}
                href={`/admin/admissions/applications?status=${stage.stage}`}
                className="relative group flex items-center justify-center text-xs font-medium text-white transition-all first:rounded-l-lg last:rounded-r-lg hover:opacity-90"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  minWidth: stage.count > 0 ? "40px" : "0",
                }}
              >
                <span className="truncate px-1">
                  {stage.count}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="rounded-lg border border-border bg-white px-3 py-1.5 shadow-md whitespace-nowrap">
                    <p className="text-xs font-medium text-foreground">
                      {PIPELINE_LABELS[stage.stage] ?? stage.stage}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stage.count} ({pct.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
          {data.pipeline.map((stage) => (
            <Link
              key={stage.stage}
              href={`/admin/admissions/applications?status=${stage.stage}`}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: PIPELINE_COLORS[stage.stage] ?? "#9ca3af" }}
              />
              <span className="text-xs text-muted-foreground">
                {PIPELINE_LABELS[stage.stage] ?? stage.stage}
              </span>
              <span className="text-xs font-medium">{stage.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarComparison
          title="Applications by Department"
          data={departmentChartData}
          bars={[
            { dataKey: "applications", label: "Applications", color: "#2563eb" },
            { dataKey: "capacity", label: "Capacity", color: "#059669" },
          ]}
        />
        <AreaTrend
          title="Monthly Applications Trend"
          data={monthlyTrendData}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutBreakdown
          title="Demographics Breakdown"
          data={demographicsData}
          centerValue={data.totalApplications}
          centerLabel="Total"
        />

        {/* Quick Links */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/admissions/applications"
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-portal-accent-light">
                  <ClipboardList className="h-4 w-4 text-portal-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">Review Applications</p>
                  <p className="text-xs text-muted-foreground">
                    {data.pendingReview} pending review
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/admin/admissions/predictions"
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-portal-accent-light">
                  <TrendingUp className="h-4 w-4 text-portal-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">View Predictions</p>
                  <p className="text-xs text-muted-foreground">
                    AI-powered enrollment forecasts
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-light">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Accepted Students</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(data.accepted)} accepted this cycle
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-success">
                {formatPercentage(data.acceptanceRate)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-light">
                  <XCircle className="h-4 w-4 text-danger" />
                </div>
                <div>
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(data.rejected)} this cycle
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-danger">
                {formatNumber(data.rejected)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
