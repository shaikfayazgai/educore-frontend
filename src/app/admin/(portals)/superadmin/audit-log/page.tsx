"use client";

import { useState } from "react";
import { Search, X, ScrollText } from "lucide-react";
import { usePlatformAuditLog } from "@/admin/lib/hooks/use-super-admin";
import { Skeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { CustomSelect } from "@/admin/components/shared/forms/custom-select";
import { cn } from "@/admin/lib/utils/cn";
import { formatRelative } from "@/admin/lib/utils/format";

const ACTION_LABELS: Record<string, string> = {
  create_university: "Created University",
  suspend_university: "Suspended University",
  reactivate_university: "Reactivated University",
  update_settings: "Updated Settings",
  login: "Logged In",
  logout: "Logged Out",
};

const ACTION_COLORS: Record<string, string> = {
  create_university: "text-success",
  suspend_university: "text-danger",
  reactivate_university: "text-success",
  update_settings: "text-foreground",
  login: "text-muted-foreground",
  logout: "text-muted-foreground",
};

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = usePlatformAuditLog({
    search: search || undefined,
    action: actionFilter || undefined,
    page,
    pageSize: 20,
  });

  const rawEntries = data?.data ?? [];
  const meta = data?.meta;

  const entries = dateRange
    ? rawEntries.filter((e) => {
        const entryDate = new Date(e.timestamp);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - Number(dateRange));
        return entryDate >= cutoff;
      })
    : rawEntries;

  return (
    <div>
      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]" style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }} />

      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track all platform actions and access events</p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <ScrollText className="h-4 w-4 text-primary-400" strokeWidth={1.8} />
            <span>{meta?.total ?? 0} total entries</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by actor, target, or details..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-lg bg-card pl-11 pr-10 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <CustomSelect value={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1); }} options={[
            { value: "", label: "All Actions" },
            { value: "create_university", label: "Created University" },
            { value: "suspend_university", label: "Suspended University" },
            { value: "reactivate_university", label: "Reactivated University" },
            { value: "update_settings", label: "Updated Settings" },
            { value: "login", label: "Login" },
          ]} />
          <CustomSelect value={dateRange} onChange={(v) => { setDateRange(v); setPage(1); }} options={[
            { value: "", label: "All Time" },
            { value: "7", label: "Last 7 Days" },
            { value: "30", label: "Last 30 Days" },
            { value: "90", label: "Last 90 Days" },
          ]} />
        </div>

        {/* Table */}
        <div className="mt-8 pb-8">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border/30 px-6 py-4 last:border-0">
                  <Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-28" /><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-32" /><Skeleton className="ml-auto h-5 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Failed to load audit log" message="Could not retrieve audit data." onRetry={() => refetch()} />
          ) : entries.length === 0 ? (
            <div className="rounded-lg bg-card py-20 text-center shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50"><Search className="h-7 w-7 text-primary-300" /></div>
              <p className="mt-5 text-base font-semibold">No audit entries found</p>
              <p className="mt-1 text-sm text-muted-foreground">Adjust your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="grid grid-cols-[0.9fr_1.3fr_1.1fr_1fr_1.5fr_0.8fr] items-center gap-4 bg-muted/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Timestamp</span><span>Actor</span><span>Action</span><span>Target</span><span>Details</span><span>IP</span>
              </div>
              <div className="divide-y divide-border/30">
                {entries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[0.9fr_1.3fr_1.1fr_1fr_1.5fr_0.8fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40">
                    <p className="whitespace-nowrap text-xs text-muted-foreground">{formatRelative(entry.timestamp)}</p>
                    <div>
                      <p className="text-sm font-semibold">{entry.actorName}</p>
                      <p className="text-xs text-muted-foreground">{entry.actorEmail}</p>
                    </div>
                    <span className={cn("text-sm font-semibold", ACTION_COLORS[entry.action] ?? "text-foreground")}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <p className="text-sm">{entry.target}</p>
                    <p className="truncate text-xs text-muted-foreground" title={entry.details}>{entry.details}</p>
                    <p className="font-mono text-xs text-muted-foreground">{entry.ipAddress}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 disabled:opacity-40 hover:bg-primary-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 disabled:opacity-40 hover:bg-primary-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
