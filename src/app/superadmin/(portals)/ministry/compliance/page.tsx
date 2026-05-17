"use client";

import { ShieldCheck } from "lucide-react";
import { useMinistryCompliance } from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import {
  StatusBadge,
  getComplianceVariant,
  getRiskVariant,
} from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatDate } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";

type InstitutionComplianceRow = {
  id: string;
  name: string;
  score: number;
  status: "compliant" | "at_risk" | "non_compliant";
  deviations: number;
};

const complianceColumns: ColumnDef<InstitutionComplianceRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Institution",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => {
      const score = row.original.score;
      return (
        <span
          className={
            score >= 80
              ? "font-semibold text-success"
              : score >= 60
                ? "font-semibold text-warning"
                : "font-semibold text-danger"
          }
        >
          {score}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={getComplianceVariant(row.original.status)} dot>
        {row.original.status === "compliant"
          ? "Compliant"
          : row.original.status === "at_risk"
            ? "At Risk"
            : "Non-Compliant"}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "deviations",
    header: "Deviations",
    cell: ({ row }) => (
      <span
        className={
          row.original.deviations > 0 ? "font-medium text-danger" : ""
        }
      >
        {row.original.deviations}
      </span>
    ),
  },
];

export default function MinistryCompliancePage() {
  const { data, isLoading, isError, refetch } = useMinistryCompliance();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="Compliance"
          description="National compliance monitoring and frameworks"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="Compliance"
          description="National compliance monitoring and frameworks"
        />
        <ErrorState
          title="Failed to load compliance data"
          message="Could not retrieve compliance information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const trendData = data.trend.map((t) => ({
    label: t.month,
    value: t.score,
  }));

  const sortedInstitutions = [...data.byInstitution].sort(
    (a, b) => a.score - b.score
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Compliance"
        description="National compliance monitoring and frameworks"
      />

      {/* National Score + Framework Scores */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GaugeChart
          label="National Compliance Score"
          value={data.nationalScore}
          size="lg"
        />
        <div className="col-span-1 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.byFramework.map((fw) => (
              <div
                key={fw.framework}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {fw.framework}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {Math.round(fw.avgScore)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fw.compliant}/{fw.institutions} compliant
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Trend */}
      <AreaTrend
        title="Compliance Trend (12 Months)"
        data={trendData}
        color="#059669"
      />

      {/* Compliance by Institution */}
      <DataTable
        columns={complianceColumns}
        data={sortedInstitutions}
        searchKey="name"
        searchPlaceholder="Search institutions..."
        emptyTitle="No compliance data"
        emptyDescription="Institution compliance data is not yet available."
      />

      {/* Recent Deviations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Recent Deviations</h2>
        </div>
        {data.recentDeviations.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No recent deviations found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recentDeviations.map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{dev.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dev.institution} &middot; {formatDate(dev.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={getRiskVariant(dev.severity)}>
                    {dev.severity}
                  </StatusBadge>
                  <StatusBadge
                    variant={dev.resolved ? "success" : "warning"}
                    dot
                  >
                    {dev.resolved ? "Resolved" : "Open"}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
