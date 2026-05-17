"use client";

import { useState } from "react";
import { Award, Users, Briefcase, ShieldCheck } from "lucide-react";
import { useQualityIndicators } from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatPercentage, formatNumber } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { QualityIndicator } from "@/superadmin/lib/api/types/ministry.types";

const REGION_OPTIONS = [
  { value: "", label: "All Regions" },
  { value: "North", label: "North" },
  { value: "South", label: "South" },
  { value: "East", label: "East" },
  { value: "West", label: "West" },
  { value: "Central", label: "Central" },
  { value: "Northeast", label: "Northeast" },
];

const SORT_OPTIONS = [
  { value: "overallScore", label: "Overall Score" },
  { value: "facultyRatio", label: "Faculty Ratio" },
  { value: "researchOutput", label: "Research Output" },
  { value: "placementRate", label: "Placement Rate" },
];

const accreditationVariant: Record<string, "success" | "warning" | "info" | "danger" | "muted"> = {
  accredited: "success",
  provisional: "warning",
  under_review: "info",
  expired: "danger",
};

const columns: ColumnDef<QualityIndicator, unknown>[] = [
  {
    accessorKey: "institutionName",
    header: "Institution",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.institutionName}</span>
    ),
  },
  {
    accessorKey: "region",
    header: "Region",
  },
  {
    accessorKey: "facultyRatio",
    header: "Faculty Ratio",
    cell: ({ row }) => (
      <span>1:{row.original.facultyRatio}</span>
    ),
  },
  {
    accessorKey: "researchOutput",
    header: "Research Output",
    cell: ({ row }) => formatNumber(row.original.researchOutput),
  },
  {
    accessorKey: "placementRate",
    header: "Placement Rate",
    cell: ({ row }) => formatPercentage(row.original.placementRate),
  },
  {
    accessorKey: "studentSatisfaction",
    header: "Satisfaction",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-portal-accent"
            style={{
              width: `${Math.min(row.original.studentSatisfaction, 100)}%`,
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {row.original.studentSatisfaction}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: "accreditationStatus",
    header: "Accreditation",
    cell: ({ row }) => (
      <StatusBadge
        variant={accreditationVariant[row.original.accreditationStatus] ?? "muted"}
        dot
      >
        {row.original.accreditationStatus.replace(/_/g, " ")}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "overallScore",
    header: "Score",
    cell: ({ row }) => (
      <span className="text-lg font-semibold">{row.original.overallScore}</span>
    ),
  },
];

export default function MinistryQualityPage() {
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState("overallScore");

  const { data, isLoading, isError, refetch } = useQualityIndicators({
    region: region || undefined,
    sort: sort || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Award}
          title="Quality Indicators"
          description="Institution quality metrics and rankings"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Award}
          title="Quality Indicators"
          description="Institution quality metrics and rankings"
        />
        <ErrorState
          title="Failed to load quality data"
          message="Could not retrieve quality indicators. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const indicators = data ?? [];

  // Summary stats
  const avgFacultyRatio =
    indicators.length > 0
      ? Math.round(
          indicators.reduce((acc, i) => acc + i.facultyRatio, 0) /
            indicators.length
        )
      : 0;
  const avgPlacementRate =
    indicators.length > 0
      ? (
          indicators.reduce((acc, i) => acc + i.placementRate, 0) /
          indicators.length
        ).toFixed(1)
      : "0";
  const accreditedCount = indicators.filter(
    (i) => i.accreditationStatus === "accredited"
  ).length;
  const accreditedPct =
    indicators.length > 0
      ? Math.round((accreditedCount / indicators.length) * 100)
      : 0;

  // Top 10 for bar chart
  const top10 = [...indicators]
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10);

  const barData = top10.map((inst) => ({
    label: inst.institutionName.length > 20
      ? inst.institutionName.slice(0, 18) + "..."
      : inst.institutionName,
    score: inst.overallScore,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Award}
        title="Quality Indicators"
        description="Institution quality metrics and rankings"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Avg Faculty Ratio"
          value={`1:${avgFacultyRatio}`}
          icon={Users}
        />
        <StatCard
          label="Avg Placement Rate"
          value={`${avgPlacementRate}%`}
          icon={Briefcase}
        />
        <StatCard
          label="Accredited"
          value={`${accreditedPct}%`}
          icon={ShieldCheck}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {REGION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort by: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Top 10 Bar Chart */}
      {barData.length > 0 && (
        <BarComparison
          title="Top 10 Institutions by Overall Score"
          data={barData}
          bars={[
            { dataKey: "score", label: "Overall Score", color: "#2563eb" },
          ]}
          height={350}
        />
      )}

      {/* Full Table */}
      <DataTable
        columns={columns}
        data={indicators}
        searchKey="institutionName"
        searchPlaceholder="Search institutions..."
        emptyTitle="No quality data"
        emptyDescription="Quality indicator data is not yet available."
      />
    </div>
  );
}
