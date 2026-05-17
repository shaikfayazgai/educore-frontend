"use client";

import { BarChart3 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useAnalytics } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { KpiCard } from "@/superadmin/components/shared/charts/kpi-card";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DataTable } from "@/superadmin/components/shared/data-table";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatPercentage, formatNumber, formatGpa } from "@/superadmin/lib/utils/format";

interface DeptRow {
  department: string;
  enrollment: number;
  retention: number;
  graduation: number;
  avgGpa: number;
  placementRate: number;
}

const deptColumns: ColumnDef<DeptRow, unknown>[] = [
  { accessorKey: "department", header: "Department" },
  {
    accessorKey: "enrollment",
    header: "Enrollment",
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "retention",
    header: "Retention %",
    cell: ({ getValue }) => formatPercentage(getValue() as number),
  },
  {
    accessorKey: "graduation",
    header: "Graduation %",
    cell: ({ getValue }) => formatPercentage(getValue() as number),
  },
  {
    accessorKey: "avgGpa",
    header: "Avg GPA",
    cell: ({ getValue }) => formatGpa(getValue() as number),
  },
  {
    accessorKey: "placementRate",
    header: "Placement %",
    cell: ({ getValue }) => formatPercentage(getValue() as number),
  },
];

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="Institutional performance metrics and trends"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="Institutional performance metrics and trends"
        />
        <ErrorState
          title="Failed to load analytics"
          message="Could not retrieve analytics data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const barData = data.departmentComparison.map((d) => ({
    label: d.department,
    enrollment: d.enrollment,
    retention: d.retention,
    graduation: d.graduation,
    placementRate: d.placementRate,
  }));

  const trendData = data.yearlyTrends.map((y) => ({
    label: y.year,
    value: y.enrollment,
    enrollment: y.enrollment,
    retention: y.retention,
    graduation: y.graduation,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Institutional performance metrics and trends"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi) => {
          const changeValue = kpi.previousValue
            ? Math.round(
                ((kpi.value - kpi.previousValue) / kpi.previousValue) * 1000
              ) / 10
            : 0;
          return (
            <KpiCard
              key={kpi.name}
              label={kpi.name}
              value={
                kpi.unit === "%"
                  ? formatPercentage(kpi.value)
                  : kpi.unit === "ratio"
                    ? `1:${kpi.value}`
                    : formatNumber(kpi.value)
              }
              change={{ value: changeValue, label: "vs previous" }}
            />
          );
        })}
      </div>

      {/* Department Comparison Bar Chart */}
      <BarComparison
        title="Department Performance Comparison"
        data={barData}
        bars={[
          { dataKey: "enrollment", label: "Enrollment", color: "#2563eb" },
          { dataKey: "retention", label: "Retention %", color: "#059669" },
          { dataKey: "graduation", label: "Graduation %", color: "#7c3aed" },
          { dataKey: "placementRate", label: "Placement %", color: "#d97706" },
        ]}
      />

      {/* Yearly Enrollment Trends */}
      <AreaTrend
        title="Enrollment Trend Over Years"
        data={trendData}
        dataKey="enrollment"
        color="#2563eb"
      />

      {/* Department Details Table */}
      <div>
        <h2 className="mb-4 text-sm font-semibold">Department Details</h2>
        <DataTable
          columns={deptColumns}
          data={data.departmentComparison}
          searchKey="department"
          searchPlaceholder="Search departments..."
          showPagination={false}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Showing current academic year performance across all departments.
        </p>
      </div>
    </div>
  );
}
