"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Hash,
  Inbox,
  Mail,
  MessageSquare,
  RefreshCcw,
  Search,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useComplaints,
  useUpdateComplaint,
  useMarkComplaintsSeen,
} from "@/superadmin/lib/hooks/use-super-admin";
import type {
  ComplaintIssueType,
  ComplaintStatus,
  TenantComplaint,
} from "@/superadmin/lib/api/types/super-admin.types";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { SlideDrawer } from "@/superadmin/components/shared/feedback/slide-drawer";
import { formatDate } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_TONE: Record<
  ComplaintStatus,
  { dot: string; pill: string; ring: string }
> = {
  open: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    ring: "ring-red-200 dark:ring-red-500/30",
  },
  in_progress: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
    ring: "ring-amber-200 dark:ring-amber-500/30",
  },
  resolved: {
    dot: "bg-emerald-500",
    pill:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    ring: "ring-emerald-200 dark:ring-emerald-500/30",
  },
  dismissed: {
    dot: "bg-muted-foreground",
    pill: "bg-muted text-muted-foreground",
    ring: "ring-border",
  },
};

const ISSUE_LABEL: Record<ComplaintIssueType, string> = {
  suspended: "Wrongly suspended",
  deactivated: "Reactivate request",
  activate: "Activation request",
  queries: "Query / question",
  other: "Other",
};

export default function SuperAdminComplaintsPage() {
  const params = useSearchParams();
  const focusId = params.get("focus");

  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ComplaintIssueType | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TenantComplaint | null>(null);

  const query = useComplaints({
    status: statusFilter || undefined,
    issueType: typeFilter || undefined,
  });
  const update = useUpdateComplaint();
  const markSeen = useMarkComplaintsSeen();

  // Mark everything as seen the first time the page loads — clears the bell
  // badge for new entries.
  useEffect(() => {
    markSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open a complaint if ?focus=<id> is in the URL.
  useEffect(() => {
    if (!focusId || !query.data?.items) return;
    const found = query.data.items.find((c) => c.id === focusId);
    if (found) setSelected(found);
  }, [focusId, query.data?.items]);

  const filteredItems = useMemo(() => {
    if (!query.data?.items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return query.data.items;
    return query.data.items.filter(
      (c) =>
        c.adminEmail.toLowerCase().includes(q) ||
        c.adminName.toLowerCase().includes(q) ||
        (c.universityName || "").toLowerCase().includes(q) ||
        (c.universityCode || "").toLowerCase().includes(q) ||
        c.comment.toLowerCase().includes(q),
    );
  }, [query.data?.items, search]);

  const counts = query.data?.counts;

  if (query.isError) {
    return (
      <div className="p-6">
        <ErrorState message="Could not load complaints." onRetry={() => query.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Inbox className="h-6 w-6 text-primary-600" />
            Complaints &amp; queries
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tickets submitted by suspended or deactivated tenants from the lockout page.
            Each tenant can hold a maximum of <strong>3 open</strong> tickets at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-muted"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", query.isFetching && "animate-spin")} />
          Refresh
        </button>
      </header>

      {/* Counts row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(
          [
            ["Total", counts?.total ?? 0, "text-foreground"],
            ["Open", counts?.open ?? 0, "text-red-700 dark:text-red-400"],
            ["In progress", counts?.inProgress ?? 0, "text-amber-700 dark:text-amber-400"],
            ["Resolved", counts?.resolved ?? 0, "text-emerald-700 dark:text-emerald-400"],
            ["Dismissed", counts?.dismissed ?? 0, "text-muted-foreground"],
          ] as const
        ).map(([label, value, tone]) => (
          <div
            key={label}
            className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={cn("mt-1 text-2xl font-semibold", tone)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, university, or text…"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | "")}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ComplaintIssueType | "")}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">All types</option>
            <option value="suspended">Wrongly suspended</option>
            <option value="deactivated">Reactivate</option>
            <option value="activate">Activation</option>
            <option value="queries">Queries</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {query.isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">No complaints found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              When a locked-out tenant submits a query, it appears here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {filteredItems.map((c) => {
              const tone = STATUS_TONE[c.status];
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c)}
                    className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", tone.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{c.adminName || c.adminEmail}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                            tone.pill,
                            tone.ring,
                          )}
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {ISSUE_LABEL[c.issueType]}
                        </span>
                        {!c.seenBySuperAdmin && c.status === "open" && (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {c.comment}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {c.universityName && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.universityName}
                          </span>
                        )}
                        {c.universityCode && (
                          <span className="inline-flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {c.universityCode}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {c.adminEmail}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 -rotate-90 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail drawer */}
      <SlideDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Complaint details"
      >
        {selected && (
          <ComplaintDetail
            complaint={selected}
            isUpdating={update.isPending}
            onUpdate={(status, note) =>
              update.mutate(
                { id: selected.id, status, resolutionNote: note },
                {
                  onSuccess: (res) => {
                    toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
                    setSelected(res.data);
                  },
                  onError: (err) => {
                    toast.error(
                      err instanceof Error ? err.message : "Could not update complaint",
                    );
                  },
                },
              )
            }
          />
        )}
      </SlideDrawer>
    </div>
  );
}

interface ComplaintDetailProps {
  complaint: TenantComplaint;
  isUpdating: boolean;
  onUpdate: (status: ComplaintStatus, note: string | null) => void;
}

function ComplaintDetail({ complaint: c, isUpdating, onUpdate }: ComplaintDetailProps) {
  const [note, setNote] = useState(c.resolutionNote || "");
  const tone = STATUS_TONE[c.status];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {/* Header card */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                tone.pill,
                tone.ring,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
              {STATUS_LABEL[c.status]}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(c.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-base font-semibold">{c.adminName}</p>
          <p className="text-xs text-muted-foreground">{c.adminEmail}</p>
        </div>

        {/* Tenant info */}
        <Field label="University">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {c.universityName || "—"}
          </span>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="University code">{c.universityCode || "—"}</Field>
          <Field label="Tenant ID">{c.tenantId || "—"}</Field>
        </div>

        {/* Issue meta */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Issue type">
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {ISSUE_LABEL[c.issueType]}
            </span>
          </Field>
          <Field label="Issue date">{c.issueDate}</Field>
        </div>

        {/* Comment */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            User&apos;s message
          </p>
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <MessageSquare className="mb-1.5 h-3.5 w-3.5 text-primary-600" />
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.comment}</p>
          </div>
        </div>

        {/* Resolution */}
        {c.status === "resolved" || c.status === "dismissed" ? (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resolution
            </p>
            <div className="space-y-2 rounded-xl border border-border/60 bg-card p-3 text-sm">
              <p className="whitespace-pre-wrap text-sm">
                {c.resolutionNote || (
                  <span className="text-muted-foreground italic">No note left.</span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {c.resolvedBy ? `By ${c.resolvedBy}` : ""}{" "}
                {c.resolvedAt ? `· ${formatDate(c.resolvedAt)}` : ""}
              </p>
            </div>
          </div>
        ) : null}

        {/* Resolution note input — used when transitioning to resolved/dismissed */}
        {(c.status === "open" || c.status === "in_progress") && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resolution note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Short summary of how you handled this — visible only to staff."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/40 bg-muted/30 p-4">
        <div className="flex flex-wrap gap-2">
          {c.status === "open" && (
            <button
              type="button"
              onClick={() => onUpdate("in_progress", note || null)}
              disabled={isUpdating}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-amber-100 px-3 text-xs font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30"
            >
              <Clock className="h-3.5 w-3.5" />
              Mark in progress
            </button>
          )}
          {(c.status === "open" || c.status === "in_progress") && (
            <>
              <button
                type="button"
                onClick={() => onUpdate("resolved", note || null)}
                disabled={isUpdating}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve
              </button>
              <button
                type="button"
                onClick={() => onUpdate("dismissed", note || null)}
                disabled={isUpdating}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-card px-3 text-xs font-medium ring-1 ring-border hover:bg-muted disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </>
          )}
          {(c.status === "resolved" || c.status === "dismissed") && (
            <button
              type="button"
              onClick={() => onUpdate("open", null)}
              disabled={isUpdating}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-card px-3 text-xs font-medium ring-1 ring-border hover:bg-muted disabled:opacity-50"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Re-open
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{children}</p>
    </div>
  );
}
