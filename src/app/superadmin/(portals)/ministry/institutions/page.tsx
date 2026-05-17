"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { useInstitutions } from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import {
  StatusBadge,
  getComplianceVariant,
} from "@/superadmin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber, formatPercentage } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { InstitutionSummary } from "@/superadmin/lib/api/types/ministry.types";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "institute", label: "Institute" },
];

const COMPLIANCE_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "compliant", label: "Compliant" },
  { value: "at_risk", label: "At Risk" },
  { value: "non_compliant", label: "Non-Compliant" },
];

const REGION_OPTIONS = [
  { value: "", label: "All Regions" },
  { value: "North", label: "North" },
  { value: "South", label: "South" },
  { value: "East", label: "East" },
  { value: "West", label: "West" },
  { value: "Central", label: "Central" },
  { value: "Northeast", label: "Northeast" },
];

const typeBadgeVariant: Record<string, "default" | "info" | "muted"> = {
  university: "default",
  college: "info",
  institute: "muted",
};

const columns: ColumnDef<InstitutionSummary, unknown>[] = [
  {
    accessorKey: "ranking",
    header: "Rank",
    cell: ({ row }) => (
      <span className="font-semibold text-muted-foreground">
        #{row.original.ranking}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Institution",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.city}, {row.original.region}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <StatusBadge variant={typeBadgeVariant[row.original.type] ?? "muted"}>
        {row.original.type}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "enrollment",
    header: "Enrollment",
    cell: ({ row }) => formatNumber(row.original.enrollment),
  },
  {
    accessorKey: "retentionRate",
    header: "Retention",
    cell: ({ row }) => formatPercentage(row.original.retentionRate),
  },
  {
    accessorKey: "graduationRate",
    header: "Graduation",
    cell: ({ row }) => formatPercentage(row.original.graduationRate),
  },
  {
    accessorKey: "complianceScore",
    header: "Compliance",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.complianceScore}</span>
        <StatusBadge
          variant={getComplianceVariant(row.original.complianceStatus)}
          dot
        >
          {row.original.complianceStatus === "compliant"
            ? "Compliant"
            : row.original.complianceStatus === "at_risk"
              ? "At Risk"
              : "Non-Compliant"}
        </StatusBadge>
      </div>
    ),
  },
  {
    accessorKey: "placementRate",
    header: "Placement",
    cell: ({ row }) => formatPercentage(row.original.placementRate),
  },
];

export default function MinistryInstitutionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [complianceStatus, setComplianceStatus] = useState("");

  const { data, isLoading, isError, refetch } = useInstitutions({
    search: search || undefined,
    region: region || undefined,
    type: type || undefined,
    complianceStatus: complianceStatus || undefined,
  });

  const handleRowClick = useCallback(
    (row: InstitutionSummary) => {
      router.push(`/ministry/institutions/${row.id}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Landmark}
          title="Institutions"
          description="National institution directory and rankings"
        />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Landmark}
          title="Institutions"
          description="National institution directory and rankings"
        />
        <ErrorState
          title="Failed to load institutions"
          message="Could not retrieve institution data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const institutions = data?.institutions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Landmark}
        title="Institutions"
        description="National institution directory and rankings"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={setSearch}
          placeholder="Search institutions..."
          className="w-full sm:max-w-xs"
        />
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={complianceStatus}
          onChange={(e) => setComplianceStatus(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {COMPLIANCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={institutions}
        showSearch={false}
        onRowClick={handleRowClick}
        emptyTitle="No institutions found"
        emptyDescription="Try adjusting your search or filters."
      />
    </div>
  );
}
