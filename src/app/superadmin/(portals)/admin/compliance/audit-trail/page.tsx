"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ScrollText, ArrowLeft } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useAuditTrail } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DataTable } from "@/superadmin/components/shared/data-table";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { formatDateTime } from "@/superadmin/lib/utils/format";
import type { AuditLogEntry } from "@/superadmin/lib/api/types/admin.types";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "research", label: "Research" },
  { value: "placement", label: "Placement" },
  { value: "ministry", label: "Ministry" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "export", label: "Export" },
];

const auditColumns: ColumnDef<AuditLogEntry, unknown>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-xs">
        {formatDateTime(getValue() as string)}
      </span>
    ),
  },
  { accessorKey: "userName", header: "User" },
  {
    accessorKey: "userRole",
    header: "Role",
    cell: ({ getValue }) => (
      <StatusBadge variant="default">{getValue() as string}</StatusBadge>
    ),
  },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "resource", header: "Resource" },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ getValue }) => {
      const details = getValue() as string;
      return (
        <span
          className="block max-w-[200px] truncate text-xs text-muted-foreground"
          title={details}
        >
          {details}
        </span>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "outcome",
    header: "Outcome",
    cell: ({ getValue }) => {
      const outcome = getValue() as "success" | "failure";
      return (
        <StatusBadge variant={outcome === "success" ? "success" : "danger"} dot>
          {outcome}
        </StatusBadge>
      );
    },
  },
];

export default function AdminAuditTrailPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAuditTrail({
    search: search || undefined,
    action: actionFilter || undefined,
    role: roleFilter || undefined,
    page,
    pageSize: 20,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/compliance"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Compliance
        </Link>
        <PageHeader
          icon={ScrollText}
          title="Audit Trail"
          description="System-wide audit log of all administrative actions"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Showing all system activities. Use filters to narrow results by action
          type, user role, or search term.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search audit entries..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load audit trail"
          message="Could not retrieve audit log entries. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={auditColumns}
            data={data?.entries ?? []}
            showSearch={false}
            showPagination={false}
            emptyTitle="No audit entries found"
            emptyDescription="Try adjusting your search or filters."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} entries)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                  disabled={page >= data.meta.totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
