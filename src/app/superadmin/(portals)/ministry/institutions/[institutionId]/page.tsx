"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Landmark,
  Users,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Award,
  Calendar,
  Globe,
  Building2,
} from "lucide-react";
import { useInstitutionDetail } from "@/superadmin/lib/hooks/use-ministry";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import {
  StatusBadge,
  getComplianceVariant,
  getRiskVariant,
} from "@/superadmin/components/shared/feedback/status-badge";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import {
  formatNumber,
  formatPercentage,
  formatCurrency,
  formatDate,
} from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";
import type { ColumnDef } from "@tanstack/react-table";

type TabId = "overview" | "performance" | "compliance" | "departments";

const accreditationVariant: Record<
  string,
  "success" | "warning" | "info" | "danger"
> = {
  accredited: "success",
  provisional: "warning",
  under_review: "info",
  expired: "danger",
};

const accreditationLabel: Record<string, string> = {
  accredited: "Accredited",
  provisional: "Provisional",
  under_review: "Under Review",
  expired: "Expired",
};

const typeBadgeVariant: Record<string, "default" | "info" | "muted"> = {
  university: "default",
  college: "info",
  institute: "muted",
};

export default function MinistryInstitutionDetailPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = use(params);
  const {
    data: institution,
    isLoading,
    isError,
    refetch,
  } = useInstitutionDetail(institutionId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !institution) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const enrollmentHistoryData = institution.enrollmentHistory.map((h) => ({
    label: String(h.year),
    value: h.count,
  }));

  const complianceHistoryData = institution.complianceHistory.map((h) => ({
    label: h.date,
    value: h.score,
  }));

  const departmentColumns: ColumnDef<
    (typeof institution.departmentBreakdown)[0],
    unknown
  >[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "enrollment",
      header: "Enrollment",
      cell: ({ row }) => formatNumber(row.original.enrollment),
    },
    {
      accessorKey: "faculty",
      header: "Faculty",
      cell: ({ row }) => formatNumber(row.original.faculty),
    },
    {
      accessorKey: "researchOutput",
      header: "Research Output",
      cell: ({ row }) => formatNumber(row.original.researchOutput),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/ministry/institutions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Institutions
      </Link>

      {/* Institution Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold">{institution.name}</h1>
              <StatusBadge
                variant={typeBadgeVariant[institution.type] ?? "muted"}
              >
                {institution.type}
              </StatusBadge>
              <StatusBadge
                variant={
                  accreditationVariant[institution.accreditationStatus] ??
                  "muted"
                }
                dot
              >
                {accreditationLabel[institution.accreditationStatus] ??
                  institution.accreditationStatus}
              </StatusBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {institution.city}, {institution.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Est. {institution.established}
              </span>
              {institution.website && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {institution.website}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-portal-accent-light px-4 py-2">
            <Award className="h-5 w-5 text-portal-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Ranking</p>
              <p className="text-xl font-bold text-portal-accent">
                #{institution.ranking}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Enrollment"
          value={formatNumber(institution.enrollment)}
          icon={Users}
        />
        <StatCard
          label="Retention"
          value={formatPercentage(institution.retentionRate)}
          icon={Users}
        />
        <StatCard
          label="Graduation"
          value={formatPercentage(institution.graduationRate)}
          icon={GraduationCap}
        />
        <StatCard
          label="Compliance"
          value={institution.complianceScore}
          icon={ShieldCheck}
        />
        <StatCard
          label="Placement"
          value={formatPercentage(institution.placementRate)}
          icon={Briefcase}
        />
        <StatCard
          label="Faculty Ratio"
          value={`1:${institution.facultyStudentRatio}`}
          icon={Landmark}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(
          ["overview", "performance", "compliance", "departments"] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <AreaTrend
            title="Enrollment History"
            data={enrollmentHistoryData}
            color="#2563eb"
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Established</p>
              <p className="mt-1 text-lg font-semibold">
                {institution.established}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Chancellor</p>
              <p className="mt-1 text-sm font-semibold">
                {institution.chancellor}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Departments</p>
              <p className="mt-1 text-lg font-semibold">
                {institution.departments}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Programs</p>
              <p className="mt-1 text-lg font-semibold">
                {institution.programs}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(institution.budget)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Research Output</p>
              <p className="mt-1 text-lg font-semibold">
                {formatNumber(institution.researchOutput)}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AreaTrend
              title="Retention Rate (%)"
              data={institution.performanceTrend.map((p) => ({
                label: String(p.year),
                value: p.retention,
              }))}
              color="#2563eb"
              height={220}
            />
            <AreaTrend
              title="Graduation Rate (%)"
              data={institution.performanceTrend.map((p) => ({
                label: String(p.year),
                value: p.graduation,
              }))}
              color="#059669"
              height={220}
            />
            <AreaTrend
              title="Placement Rate (%)"
              data={institution.performanceTrend.map((p) => ({
                label: String(p.year),
                value: p.placement,
              }))}
              color="#7c3aed"
              height={220}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Retention
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Graduation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Placement
                  </th>
                </tr>
              </thead>
              <tbody>
                {institution.performanceTrend.map((p) => (
                  <tr
                    key={p.year}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{p.year}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatPercentage(p.retention)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatPercentage(p.graduation)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatPercentage(p.placement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="space-y-6">
          <AreaTrend
            title="Compliance Score History"
            data={complianceHistoryData}
            color="#059669"
          />

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold">Recent Deviations</h3>
            </div>
            {institution.recentDeviations.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No recent deviations recorded.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {institution.recentDeviations.map((dev, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{dev.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(dev.date)}
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
      )}

      {activeTab === "departments" && (
        <DataTable
          columns={departmentColumns}
          data={institution.departmentBreakdown}
          searchKey="name"
          searchPlaceholder="Search departments..."
          showPagination={false}
          emptyTitle="No departments"
          emptyDescription="Department data is not available for this institution."
        />
      )}
    </div>
  );
}
