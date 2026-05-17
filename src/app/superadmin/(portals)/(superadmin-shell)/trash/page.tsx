"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  Download,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSuperAdminTrashUniversities,
  useRestoreUniversityFromTrash,
  usePermanentDeleteUniversityFromTrash,
  useExtendTrashedUniversity,
} from "@/superadmin/lib/hooks/use-super-admin";
import { downloadTrashedUniversityExport } from "@/superadmin/lib/api/client";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { ExtendDeletionDialog } from "@/superadmin/components/shared/feedback/extend-deletion-dialog";
import { SlideDrawer } from "@/superadmin/components/shared/feedback/slide-drawer";
import { formatDate, formatNumber } from "@/superadmin/lib/utils/format";
import type { TrashedUniversity } from "@/superadmin/lib/api/types/super-admin.types";
import { cn } from "@/superadmin/lib/utils/cn";
import { ApiError } from "@/superadmin/lib/api/client";
import {
  Building2, Globe, Hash, Mail, MapPin, Phone, UserCog, MessageSquare,
} from "lucide-react";

const UNIVERSITY_TYPE_LABEL: Record<string, string> = {
  govt_central: "Govt Central", state: "State", private: "Private", others: "Others",
};

/** Tailwind classes per "days left" tier — drives the highlight color column. */
function deletionTierClasses(daysLeft: number): {
  text: string; bg: string; ring: string; label: string;
} {
  if (daysLeft <= 7)  return { text: "text-danger",  bg: "bg-danger/10",  ring: "ring-danger/30",  label: "Critical" };
  if (daysLeft <= 14) return { text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100/60 dark:bg-amber-500/10", ring: "ring-amber-400/40", label: "Warning"  };
  return { text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100/60 dark:bg-emerald-500/10", ring: "ring-emerald-400/40", label: "Safe" };
}

export default function SuperAdminUniversityTrashPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<TrashedUniversity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TrashedUniversity | null>(null);
  const [extendTarget, setExtendTarget] = useState<TrashedUniversity | null>(null);
  const [detailUni, setDetailUni] = useState<TrashedUniversity | null>(null);
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const focusRowRef = useRef<HTMLDivElement | null>(null);
  const focusedNotifiedRef = useRef<string | null>(null);

  const restore = useRestoreUniversityFromTrash();
  const permanentDelete = usePermanentDeleteUniversityFromTrash();
  const extend = useExtendTrashedUniversity();
  const { data, isLoading, isError, error, refetch } = useSuperAdminTrashUniversities({
    search: search || undefined,
    page,
    pageSize: 20,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const handleExport = useCallback(async (u: TrashedUniversity) => {
    setExportingId(u.id);
    try {
      await downloadTrashedUniversityExport(u.id);
      toast.success("Export downloaded", { description: u.name });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportingId(null);
    }
  }, []);

  const executeRestore = useCallback(async () => {
    if (!restoreConfirm) return;
    try {
      await restore.mutateAsync(restoreConfirm.id);
      toast.success(`Restored ${restoreConfirm.name}`);
      setRestoreConfirm(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Restore failed");
    }
  }, [restore, restoreConfirm]);

  const executePermanentDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await permanentDelete.mutateAsync(deleteConfirm.id);
      toast.success(`Permanently deleted ${deleteConfirm.name}`);
      setDeleteConfirm(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Permanent delete failed");
    }
  }, [deleteConfirm, permanentDelete]);

  // Auto-scroll-and-open the row when a notification deep-links via ?focus=<id>.
  useEffect(() => {
    if (!focusId || rows.length === 0) return;
    if (focusedNotifiedRef.current === focusId) return;
    const target = rows.find((r) => r.id === focusId);
    if (!target) return;
    focusedNotifiedRef.current = focusId;
    setDetailUni(target);
    requestAnimationFrame(() => {
      focusRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusId, rows]);

  const executeExtend = useCallback(async (iso: string) => {
    if (!extendTarget) return;
    try {
      await extend.mutateAsync({ id: extendTarget.id, permanentDeleteAt: iso });
      toast.success(`Extended deletion date for ${extendTarget.name}`);
      setExtendTarget(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not extend date");
    }
  }, [extend, extendTarget]);

  return (
    <div>
      <div
        className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]"
        style={{
          background:
            "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)",
        }}
      />

      <div className="relative px-8 pt-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/superadmin/universities"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Universities
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Tenants moved here are permanently deleted after{" "}
              <span className="font-medium text-foreground">30 days</span>. Until then you
              can export their data, restore them, or extend the deletion date.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trashed tenants..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg bg-card pl-11 pr-10 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 pb-8">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border/30 px-6 py-4 last:border-0">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="ml-auto h-9 w-28" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Failed to load trash"
              message={error instanceof Error ? error.message : "Could not load data."}
              onRetry={() => refetch()}
            />
          ) : rows.length === 0 ? (
            <div className="rounded-lg bg-card py-20 text-center shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                <Trash2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-5 text-base font-semibold">Trash is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Deleted universities appear here for 30 days before removal.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 md:block">
                <div className="grid grid-cols-[2fr_0.9fr_1fr_1fr_1.7fr] items-center gap-4 bg-muted/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Tenant</span>
                  <span>University Code</span>
                  <span>Deleted</span>
                  <span>Permanent Deletion</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-border/30">
                  {rows.map((u) => {
                    const tier = deletionTierClasses(u.daysUntilPermanentDelete);
                    const isFocused = focusId === u.id;
                    return (
                      <div
                        key={u.id}
                        ref={isFocused ? focusRowRef : undefined}
                        onClick={() => setDetailUni(u)}
                        className={cn(
                          "grid cursor-pointer grid-cols-[2fr_0.9fr_1fr_1fr_1.7fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40",
                          isFocused && "bg-primary-50/70 ring-2 ring-inset ring-primary-300 animate-pulse",
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[u.city, u.state, u.country].filter(Boolean).join(", ")} · {u.domain}
                          </p>
                          {u.suspensionComment && (
                            <p className="mt-1 line-clamp-1 text-xs italic text-danger/80" title={u.suspensionComment}>
                              <MessageSquare className="mr-1 inline-block h-3 w-3" />
                              {u.suspensionComment}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-mono text-muted-foreground">
                          {u.universityCode || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.deletedAt ? formatDate(u.deletedAt) : "—"}
                        </p>
                        <div className={cn("inline-flex flex-col rounded-md px-3 py-1.5 ring-1", tier.bg, tier.ring)}>
                          <p className={cn("text-xs font-medium", tier.text)}>
                            {u.permanentDeleteAt ? formatDate(u.permanentDeleteAt) : "—"}
                          </p>
                          <p className={cn("text-xs font-bold", tier.text)}>
                            {u.daysUntilPermanentDelete === 0
                              ? "Deleting soon"
                              : `${u.daysUntilPermanentDelete} day${u.daysUntilPermanentDelete === 1 ? "" : "s"} left`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setExtendTarget(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                            title="Extend deletion date"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            Extend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExport(u)}
                            disabled={exportingId === u.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                          >
                            {exportingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            Export
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreConfirm(u)}
                            disabled={restore.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(u)}
                            disabled={permanentDelete.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/5 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete permanently
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {rows.map((u) => {
                  const tier = deletionTierClasses(u.daysUntilPermanentDelete);
                  return (
                    <div
                      key={u.id}
                      onClick={() => setDetailUni(u)}
                      className="cursor-pointer rounded-lg bg-card p-4 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-colors hover:bg-primary-50/40"
                    >
                      <p className="text-sm font-semibold">{u.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[u.city, u.state, u.country].filter(Boolean).join(", ")} · {u.domain}
                      </p>
                      {u.suspensionComment && (
                        <p className="mt-1 text-xs italic text-danger/80">
                          <MessageSquare className="mr-1 inline-block h-3 w-3" />
                          {u.suspensionComment}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        University Code: <span className="font-mono">{u.universityCode || "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deleted: {u.deletedAt ? formatDate(u.deletedAt) : "—"}
                      </p>
                      <div className={cn("mt-2 inline-flex flex-col rounded-md px-3 py-1.5 ring-1", tier.bg, tier.ring)}>
                        <p className={cn("text-xs font-medium", tier.text)}>
                          {u.permanentDeleteAt ? formatDate(u.permanentDeleteAt) : "—"}
                        </p>
                        <p className={cn("text-xs font-bold", tier.text)}>
                          {u.daysUntilPermanentDelete === 0
                            ? "Deleting soon"
                            : `${u.daysUntilPermanentDelete} day${u.daysUntilPermanentDelete === 1 ? "" : "s"} left`}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setExtendTarget(u)} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                          <CalendarPlus className="h-3.5 w-3.5" /> Extend
                        </button>
                        <button type="button" onClick={() => handleExport(u)} disabled={exportingId === u.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50">
                          {exportingId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Export
                        </button>
                        <button type="button" onClick={() => setRestoreConfirm(u)} disabled={restore.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50">
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(u)} disabled={permanentDelete.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/5 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50">
                          <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg bg-card px-4 py-2 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-colors disabled:opacity-40 hover:bg-primary-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="rounded-lg bg-card px-4 py-2 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-colors disabled:opacity-40 hover:bg-primary-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!restoreConfirm}
        onOpenChange={(o) => !o && setRestoreConfirm(null)}
        title="Restore university"
        description={restoreConfirm ? `Move "${restoreConfirm.name}" back to the active universities list?` : ""}
        confirmLabel="Restore"
        variant="default"
        onConfirm={executeRestore}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title="Delete permanently"
        description={deleteConfirm ? `Permanently delete "${deleteConfirm.name}" and all related data? This cannot be undone.` : ""}
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={executePermanentDelete}
      />
      <ExtendDeletionDialog
        open={!!extendTarget}
        onOpenChange={(o) => !o && setExtendTarget(null)}
        universityName={extendTarget?.name ?? ""}
        currentDate={extendTarget?.permanentDeleteAt}
        onConfirm={executeExtend}
      />

      {/* Trashed-tenant detail drawer */}
      <SlideDrawer
        open={!!detailUni}
        onClose={() => setDetailUni(null)}
        title={detailUni?.name ?? "Trashed tenant"}
        description={detailUni ? `${detailUni.shortName} — ${[detailUni.city, detailUni.state, detailUni.country].filter(Boolean).join(", ")}` : undefined}
        width="lg"
        footer={detailUni && (
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => { setExtendTarget(detailUni); setDetailUni(null); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <CalendarPlus className="h-4 w-4" /> Extend deletion
            </button>
            <button
              type="button"
              onClick={() => { handleExport(detailUni); }}
              disabled={exportingId === detailUni.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {exportingId === detailUni.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export
            </button>
            <button
              type="button"
              onClick={() => { setRestoreConfirm(detailUni); setDetailUni(null); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              <RotateCcw className="h-4 w-4" /> Restore
            </button>
            <button
              type="button"
              onClick={() => { setDeleteConfirm(detailUni); setDetailUni(null); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/5 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" /> Delete permanently
            </button>
          </div>
        )}
      >
        {detailUni && (
          <div className="space-y-6">
            {/* Deletion countdown banner */}
            {(() => {
              const tier = deletionTierClasses(detailUni.daysUntilPermanentDelete);
              return (
                <div className={cn("rounded-lg p-4 ring-1", tier.bg, tier.ring)}>
                  <p className={cn("text-xs font-semibold uppercase tracking-wider", tier.text)}>
                    Permanent deletion
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {detailUni.permanentDeleteAt ? formatDate(detailUni.permanentDeleteAt) : "—"}
                  </p>
                  <p className={cn("text-xs font-bold", tier.text)}>
                    {detailUni.daysUntilPermanentDelete === 0
                      ? "Deleting soon"
                      : `${detailUni.daysUntilPermanentDelete} day${detailUni.daysUntilPermanentDelete === 1 ? "" : "s"} left`}
                  </p>
                </div>
              );
            })()}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Users",    value: formatNumber(detailUni.userCount) },
                { label: "Students", value: formatNumber(detailUni.studentCount) },
                { label: "Faculty",  value: formatNumber(detailUni.facultyCount) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/40 px-4 py-3 ring-1 ring-border/30">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* University info */}
            <div className="rounded-lg bg-card ring-1 ring-border/30">
              <h3 className="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">University Info</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pb-5 pt-3">
                {[
                  { icon: Hash,      label: "University Code", value: detailUni.universityCode || "—" },
                  { icon: Building2, label: "Type",            value: UNIVERSITY_TYPE_LABEL[detailUni.universityType] ?? detailUni.universityType },
                  { icon: Globe,     label: "Domain",          value: detailUni.domain },
                  { icon: MapPin,    label: "Location",        value: [detailUni.city, detailUni.state, detailUni.country].filter(Boolean).join(", ") },
                  { icon: Hash,      label: "Pin Code",        value: detailUni.pinCode || "—" },
                  { icon: Hash,      label: "Status",          value: detailUni.status },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <row.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="mt-0.5 text-sm font-medium capitalize">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Administrator */}
            <div className="rounded-lg bg-card ring-1 ring-border/30">
              <h3 className="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administrator</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pb-5 pt-3">
                {[
                  { icon: UserCog, label: "Full Name",   value: detailUni.adminName },
                  { icon: Mail,    label: "Email",       value: detailUni.adminEmail },
                  { icon: Phone,   label: "Phone",       value: detailUni.adminPhone || "—" },
                  { icon: UserCog, label: "Designation", value: detailUni.adminDesignation || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <row.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="mt-0.5 text-sm font-medium break-all">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suspension comment */}
            {detailUni.suspensionComment && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-danger">Suspension reason (at time of delete)</p>
                <p className="mt-1 text-sm">{detailUni.suspensionComment}</p>
                {detailUni.suspendedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">Suspended on {formatDate(detailUni.suspendedAt)}</p>
                )}
              </div>
            )}

            {/* Trash metadata */}
            <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              Deleted on {detailUni.deletedAt ? formatDate(detailUni.deletedAt) : "—"} ·
              Created on {formatDate(detailUni.createdAt)}
            </div>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}
