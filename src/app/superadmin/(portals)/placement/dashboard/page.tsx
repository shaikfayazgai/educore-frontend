"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Percent,
  Sparkles,
  GitCompare,
  ArrowRight,
  Building2,
  Calendar,
} from "lucide-react";
import { usePlacementDashboard } from "@/superadmin/lib/hooks/use-placement";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatPercentage, formatNumber, formatDate } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";
import type { PipelineStage } from "@/superadmin/lib/api/types/common.types";

const STAGE_LABELS: Record<PipelineStage, string> = {
  matched: "Matched",
  applied: "Applied",
  interviewed: "Interviewed",
  offered: "Offered",
  placed: "Placed",
  rejected: "Rejected",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  matched: "#6366f1",
  applied: "#2563eb",
  interviewed: "#0891b2",
  offered: "#d97706",
  placed: "#059669",
  rejected: "#dc2626",
};

export default function PlacementDashboardPage() {
  const { data, isLoading, isError, refetch } = usePlacementDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Placement activity overview"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Placement activity overview"
        />
        <ErrorState
          title="Failed to load dashboard"
          message="Could not retrieve placement data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const pipelineTotal = Object.values(data.pipeline).reduce(
    (sum, v) => sum + v,
    0
  );

  const placementTrendData = data.monthlyPlacements.map((m) => ({
    label: m.month,
    value: m.placed,
    placed: m.placed,
    target: m.target,
  }));

  // Pipeline bar data
  const pipelineStages = Object.entries(data.pipeline) as [
    PipelineStage,
    number,
  ][];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Placement activity overview"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Placement Rate"
          value={formatPercentage(data.placementRate)}
          icon={Percent}
        />
        <StatCard
          label="Active Matches"
          value={formatNumber(data.activeMatches)}
          icon={Sparkles}
        />
        <StatCard
          label="Total Pipeline"
          value={formatNumber(pipelineTotal)}
          icon={GitCompare}
        />
      </div>

      {/* Pipeline Summary Bar */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Pipeline Summary
        </p>
        <div className="space-y-3">
          {pipelineStages.map(([stage, count]) => {
            const pct = pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0;
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium">
                  {STAGE_LABELS[stage]}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STAGE_COLORS[stage],
                    }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-semibold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarComparison
          title="Monthly Placements vs Target"
          data={placementTrendData}
          bars={[
            { dataKey: "placed", label: "Placed", color: "#059669" },
            { dataKey: "target", label: "Target", color: "#d1d5db" },
          ]}
        />

        {/* Upcoming Drives */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Upcoming Drives</h2>
          </div>
          {data.upcomingDrives.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No upcoming drives scheduled.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.upcomingDrives.map((drive, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{drive.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {drive.company}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {formatDate(drive.date)}
                    </p>
                    <p className="text-xs font-medium">
                      {drive.positions} positions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Employers */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Top Employers</h2>
          <Link
            href="/placement/employers"
            className="flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.topEmployers.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No employer data available.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.topEmployers.map((employer, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{employer.name}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">
                  {employer.hires}{" "}
                  <span className="font-normal text-muted-foreground">
                    hires
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
