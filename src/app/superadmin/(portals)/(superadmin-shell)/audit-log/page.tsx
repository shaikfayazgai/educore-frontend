"use client";

import { useState } from "react";
import { Search, X, Trash2, Download, Loader2, Settings2, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  usePlatformAuditLog,
  useDeleteAuditEntry,
  useBulkDeleteAuditLog,
  downloadAuditLog,
  usePlatformSettings,
  useUpdatePlatformSettings,
} from "@/superadmin/lib/hooks/use-super-admin";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { CustomSelect } from "@/superadmin/components/shared/forms/custom-select";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { ApiError } from "@/superadmin/lib/api/client";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatRelative } from "@/superadmin/lib/utils/format";

const ACTION_LABELS: Record<string, string> = {
  create_university: "Created University",
  suspend_university: "Suspended University",
  reactivate_university: "Reactivated University",
  trash_university: "Moved to Trash",
  restore_university: "Restored from Trash",
  export_university_trash: "Exported Trashed Tenant",
  purge_university_trash: "Permanently Deleted (Trash)",
  create_ministry: "Created Ministry",
  link_university: "Linked University",
  unlink_university: "Unlinked University",
  update_settings: "Updated Settings",
  delete_audit_entry: "Deleted Audit Entry",
  bulk_delete_audit: "Bulk Deleted Audit",
  login: "Logged In",
  login_failed: "Login Failed",
  logout: "Logged Out",
};

const ACTION_COLORS: Record<string, string> = {
  create_university: "text-success",
  suspend_university: "text-danger",
  reactivate_university: "text-success",
  trash_university: "text-warning",
  restore_university: "text-success",
  export_university_trash: "text-primary-500",
  purge_university_trash: "text-danger",
  create_ministry: "text-success",
  link_university: "text-primary-500",
  unlink_university: "text-warning",
  update_settings: "text-foreground",
  delete_audit_entry: "text-danger",
  bulk_delete_audit: "text-danger",
  login: "text-muted-foreground",
  login_failed: "text-danger",
  logout: "text-muted-foreground",
};

const RANGE_OPTIONS = [
  { value: "1", label: "Last 1 day" },
  { value: "7", label: "Last 7 days" },
  { value: "15", label: "Last 15 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 1 year" },
  { value: "-1", label: "All entries (clear everything)" },
];

const RETENTION_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [bulkRange, setBulkRange] = useState("90");
  const [isExporting, setIsExporting] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const { data, isLoading, isError, refetch } = usePlatformAuditLog({
    search: search || undefined,
    action: actionFilter || undefined,
    page,
    pageSize: 20,
  });

  const deleteOne = useDeleteAuditEntry();
  const bulkDelete = useBulkDeleteAuditLog();
  const settings = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const entries = data?.data ?? [];
  const meta = data?.meta;

  const autoDelete = settings.data?.auditLogAutoDelete ?? false;
  const retentionDays = settings.data?.auditLogRetentionDays ?? 90;

  const handleExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true);
    try {
      await downloadAuditLog(format, {
        search: search || undefined,
        action: actionFilter || undefined,
      });
      toast.success(`Audit log exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEntryId) return;
    try {
      await deleteOne.mutateAsync(deleteEntryId);
      toast.success("Audit entry deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleteEntryId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDelete.mutateAsync(Number(bulkRange));
      const count = result.data?.deleted ?? 0;
      toast.success(`Deleted ${count} audit ${count === 1 ? "entry" : "entries"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Bulk delete failed");
    } finally {
      setBulkConfirmOpen(false);
    }
  };

  const handleToggleAutoDelete = async (next: boolean) => {
    try {
      await updateSettings.mutateAsync({ auditLogAutoDelete: next });
      toast.success(`Auto-purge ${next ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update setting");
    }
  };

  const handleChangeRetention = async (days: string) => {
    try {
      await updateSettings.mutateAsync({ auditLogRetentionDays: Number(days) });
      toast.success(`Retention set to ${days} days`);
    } catch {
      toast.error("Failed to update setting");
    }
  };

  const selectedRangeLabel =
    RANGE_OPTIONS.find((r) => r.value === bulkRange)?.label ?? "selected range";

  return (
    <div>
      {/* Gradient wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]"
        style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }}
      />

      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track all platform actions and access events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  disabled={isExporting || entries.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-medium shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-colors hover:bg-primary-50 disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 w-48 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
                >
                  <DropdownMenu.Item
                    onSelect={() => handleExport("csv")}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Export as CSV
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => handleExport("xlsx")}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    Export as Excel
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button
              onClick={() => setMaintenanceOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 transition-colors",
                maintenanceOpen
                  ? "bg-primary-500 text-white ring-primary-500"
                  : "bg-card ring-border/30 shadow-lg shadow-primary-900/[0.04] hover:bg-primary-50"
              )}
            >
              <Settings2 className="h-4 w-4" />
              Maintenance
            </button>
          </div>
        </div>

        {/* Maintenance card */}
        {maintenanceOpen && (
          <div className="mt-5 grid grid-cols-1 gap-4 rounded-lg bg-card p-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 lg:grid-cols-2">
            {/* Auto-delete toggle */}
            <div>
              <h3 className="text-sm font-semibold">Auto-purge old entries</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                When on, audit entries older than the retention window are deleted automatically each time this page loads.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    Auto-purge older than{" "}
                  </span>
                  <CustomSelect
                    value={String(retentionDays)}
                    onChange={(v) => handleChangeRetention(v)}
                    options={RETENTION_OPTIONS}
                    className="w-32"
                  />
                </div>
                <button
                  onClick={() => handleToggleAutoDelete(!autoDelete)}
                  disabled={updateSettings.isPending || settings.isLoading}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                    autoDelete ? "bg-primary-500" : "bg-muted-foreground/30"
                  )}
                  aria-pressed={autoDelete}
                  aria-label="Toggle auto-purge"
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      autoDelete ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Currently:{" "}
                <span className={cn("font-medium", autoDelete ? "text-success" : "text-muted-foreground")}>
                  {autoDelete ? `ON — purging entries older than ${retentionDays} days` : "OFF — keeping every entry"}
                </span>
              </p>
            </div>

            {/* Manual cleanup */}
            <div>
              <h3 className="text-sm font-semibold">Manual cleanup</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Delete a chunk of audit entries right now. This action cannot be undone.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <CustomSelect
                  value={bulkRange}
                  onChange={setBulkRange}
                  options={RANGE_OPTIONS}
                  className="flex-1"
                />
                <button
                  onClick={() => setBulkConfirmOpen(true)}
                  disabled={bulkDelete.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-light px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/15 disabled:opacity-50"
                >
                  {bulkDelete.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by actor, target, or details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg bg-card pl-11 pr-10 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <CustomSelect
            value={actionFilter}
            onChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Actions" },
              { value: "create_university", label: "Created University" },
              { value: "suspend_university", label: "Suspended University" },
              { value: "reactivate_university", label: "Reactivated University" },
              { value: "trash_university", label: "Moved to Trash" },
              { value: "restore_university", label: "Restored from Trash" },
              { value: "export_university_trash", label: "Exported Trashed Tenant" },
              { value: "purge_university_trash", label: "Permanently Deleted (Trash)" },
              { value: "create_ministry", label: "Created Ministry" },
              { value: "link_university", label: "Linked University" },
              { value: "unlink_university", label: "Unlinked University" },
              { value: "update_settings", label: "Updated Settings" },
              { value: "delete_audit_entry", label: "Deleted Audit Entry" },
              { value: "bulk_delete_audit", label: "Bulk Deleted Audit" },
              { value: "login", label: "Login" },
              { value: "login_failed", label: "Login Failed" },
            ]}
          />
        </div>

        {/* Table */}
        <div className="mt-8 pb-8">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 border-b border-border/30 px-6 py-4 last:border-0"
                >
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="ml-auto h-5 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Failed to load audit log"
              message="Could not retrieve audit data."
              onRetry={() => refetch()}
            />
          ) : entries.length === 0 ? (
            <div className="rounded-lg bg-card py-20 text-center shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50">
                <Search className="h-7 w-7 text-primary-300" />
              </div>
              <p className="mt-5 text-base font-semibold">No audit entries found</p>
              <p className="mt-1 text-sm text-muted-foreground">Adjust your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="grid grid-cols-[0.9fr_1.3fr_1.1fr_1fr_1.5fr_0.8fr_40px] items-center gap-4 bg-muted/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Timestamp</span>
                <span>Actor</span>
                <span>Action</span>
                <span>Target</span>
                <span>Details</span>
                <span>IP</span>
                <span />
              </div>
              <div className="divide-y divide-border/30">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group grid grid-cols-[0.9fr_1.3fr_1.1fr_1fr_1.5fr_0.8fr_40px] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40"
                  >
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelative(entry.timestamp)}
                    </p>
                    <div>
                      <p className="text-sm font-semibold">{entry.actorName}</p>
                      <p className="text-xs text-muted-foreground">{entry.actorEmail}</p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        ACTION_COLORS[entry.action] ?? "text-foreground"
                      )}
                    >
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <p className="text-sm">{entry.target}</p>
                    <p className="truncate text-xs text-muted-foreground" title={entry.details}>
                      {entry.details}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{entry.ipAddress}</p>
                    <button
                      onClick={() => setDeleteEntryId(entry.id)}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                      aria-label="Delete entry"
                      title="Delete this audit entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 disabled:opacity-40 hover:bg-primary-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 disabled:opacity-40 hover:bg-primary-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm: single delete */}
      <ConfirmDialog
        open={!!deleteEntryId}
        onOpenChange={(o) => !o && setDeleteEntryId(null)}
        title="Delete this audit entry?"
        description="This will permanently remove the entry from the audit log. The action will itself be logged."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />

      {/* Confirm: bulk delete */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        onOpenChange={setBulkConfirmOpen}
        title="Bulk delete audit entries?"
        description={
          bulkRange === "-1"
            ? "This will permanently delete EVERY audit entry. This cannot be undone."
            : `This will permanently delete every audit entry from the ${selectedRangeLabel
                .replace(/^Last /, "")
                .toLowerCase()}. This cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
