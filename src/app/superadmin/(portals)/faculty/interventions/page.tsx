"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck, Plus } from "lucide-react";
import { useInterventions } from "@/superadmin/lib/hooks/use-faculty";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatDate, formatRelative } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { Intervention } from "@/superadmin/lib/api/types/faculty.types";

type StatusFilter = "all" | "planned" | "active" | "completed" | "abandoned";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  planned: "info",
  active: "default",
  completed: "success",
  abandoned: "muted",
};

const typeLabels: Record<string, string> = {
  academic_support: "Academic Support",
  counseling: "Counseling",
  mentoring: "Mentoring",
  schedule_adjustment: "Schedule Adjustment",
  financial_aid: "Financial Aid",
};

const columns: ColumnDef<Intervention, unknown>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.studentName}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <StatusBadge variant="muted">
        {typeLabels[row.original.type] || row.original.type}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={statusVariant[row.original.status]} dot>
        {row.original.status}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.startDate)}</span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelative(row.original.updatedAt)}
      </span>
    ),
  },
];

export default function FacultyInterventionsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError, refetch } = useInterventions({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const handleRowClick = useCallback(
    (row: Intervention) => {
      router.push(`/faculty/interventions/${row.id}`);
    },
    [router]
  );

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const interventions = data?.interventions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCheck}
        title="Interventions"
        description="Manage student interventions"
        actions={
          <Link
            href="/faculty/interventions/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Intervention
          </Link>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === filter.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={interventions}
        showSearch={false}
        onRowClick={handleRowClick}
        emptyTitle="No interventions found"
        emptyDescription={
          statusFilter === "all"
            ? "Create your first intervention to get started."
            : `No ${statusFilter} interventions found.`
        }
      />
    </div>
  );
}
