"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ScrollText, ArrowLeft, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useAuditTrail } from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { formatDateTime, formatRelative } from "@/admin/lib/utils/format";
import type { AuditLogEntry } from "@/admin/lib/api/types/admin.types";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "placement", label: "Placement" },
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

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = useCallback((field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="grid w-full grid-cols-[24px_minmax(140px,_1.2fr)_minmax(120px,_1fr)_80px_minmax(80px,_0.8fr)_minmax(120px,_1fr)_70px] items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatRelative(entry.timestamp)}
        </span>
        <span className="truncate text-sm font-medium">{entry.userName}</span>
        <StatusBadge variant="default">{entry.userRole}</StatusBadge>
        <span className="text-sm capitalize">{entry.action}</span>
        <span className="truncate text-sm text-muted-foreground">{entry.resource}</span>
        <div className="flex justify-end">
          <StatusBadge variant={entry.outcome === "success" ? "success" : "danger"} dot>
            {entry.outcome}
          </StatusBadge>
        </div>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border bg-muted/20 px-5 py-4 text-sm">
          <DetailRow label="Full Timestamp" value={formatDateTime(entry.timestamp)} />
          <DetailRow
            label="IP Address"
            value={entry.ipAddress}
            mono
            onCopy={() => handleCopy("ip", entry.ipAddress)}
            copied={copied === "ip"}
          />
          <DetailRow
            label="Resource ID"
            value={entry.resourceId}
            mono
            onCopy={() => handleCopy("rid", entry.resourceId)}
            copied={copied === "rid"}
          />
          <DetailRow
            label="User ID"
            value={entry.userId}
            mono
            onCopy={() => handleCopy("uid", entry.userId)}
            copied={copied === "uid"}
          />
          <DetailRow label="Action" value={entry.action} />
          <DetailRow label="Resource" value={entry.resource} />
          <div className="col-span-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Details</p>
            <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed">
              {entry.details}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`truncate ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</span>
        {onCopy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

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
          {(data?.entries ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <p className="text-sm font-medium">No audit entries found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="grid grid-cols-[24px_minmax(140px,_1.2fr)_minmax(120px,_1fr)_80px_minmax(80px,_0.8fr)_minmax(120px,_1fr)_70px] items-center gap-3 border-b border-border bg-muted/40 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span />
                <span>When</span>
                <span>User</span>
                <span>Role</span>
                <span>Action</span>
                <span>Resource</span>
                <span className="text-right">Outcome</span>
              </div>
              {(data?.entries ?? []).map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
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
