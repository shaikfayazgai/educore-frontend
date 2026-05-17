"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, Loader2, X, MoreHorizontal, Eye, Pencil, ShieldBan, ShieldCheck, Send,
  Search, Users, GraduationCap, UserCog, Globe, MapPin, Mail, Calendar,
  ChevronDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useSuperAdminUniversities, useSuperAdminUniversityDetail,
  useCreateUniversity, useUpdateUniversity,
} from "@/admin/lib/hooks/use-super-admin";
import { createUniversitySchema, type CreateUniversityFormData } from "@/admin/lib/schemas/super-admin.schema";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { SlideDrawer } from "@/admin/components/shared/feedback/slide-drawer";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { FormField } from "@/admin/components/shared/forms/form-field";
import { Skeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { CustomSelect } from "@/admin/components/shared/forms/custom-select";
import { cn } from "@/admin/lib/utils/cn";
import { formatDate, formatNumber } from "@/admin/lib/utils/format";
import type { University } from "@/admin/lib/api/types/super-admin.types";

/* ── Row Actions ─────────────────────────────────────────────────────────── */

function RowActions({ university, onView, onEdit, onResend, onToggle }: {
  university: University; onView: () => void; onEdit: () => void; onResend: () => void; onToggle: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-primary-50 hover:text-primary-600 group-hover:opacity-100 data-[state=open]:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-48 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onView} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" /> View Details
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onResend} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Send className="h-4 w-4 text-muted-foreground" /> Resend Invite
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item onSelect={onToggle} className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted", university.status === "active" ? "text-danger" : "text-success")}>
            {university.status === "active" ? <><ShieldBan className="h-4 w-4" /> Suspend</> : <><ShieldCheck className="h-4 w-4" /> Reactivate</>}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────────────────── */

function DetailDrawer({ id, open, onClose, onToggle, onResend }: {
  id: string | null; open: boolean; onClose: () => void; onToggle: (u: University) => void; onResend: (u: University) => void;
}) {
  const { data: u, isLoading } = useSuperAdminUniversityDetail(id ?? "");

  return (
    <SlideDrawer open={open} onClose={onClose} title={u?.name ?? "University"} description={u ? `${u.shortName} — ${u.city}, ${u.country}` : undefined} width="lg"
      footer={u && (
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => onResend(u)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Resend Invite</button>
          <button onClick={() => onToggle(u)} className={cn("rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5", u.status === "active" ? "bg-danger shadow-danger/25 hover:bg-danger/90" : "bg-success shadow-success/25 hover:bg-success/90")}>
            {u.status === "active" ? "Suspend" : "Reactivate"}
          </button>
        </div>
      )}
    >
      {isLoading ? (
        <div className="space-y-6"><Skeleton className="h-6 w-24" /><div className="grid grid-cols-3 gap-4"><Skeleton className="h-24 rounded-lg" /><Skeleton className="h-24 rounded-lg" /><Skeleton className="h-24 rounded-lg" /></div><Skeleton className="h-40 rounded-lg" /></div>
      ) : !u ? (
        <p className="py-16 text-center text-sm text-muted-foreground">University not found.</p>
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", u.status === "active" ? "bg-success" : "bg-danger")} />
            <span className={cn("text-sm font-semibold capitalize", u.status === "active" ? "text-success" : "text-danger")}>{u.status}</span>
          </div>

          {/* Stats — inline row */}
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/40 p-4">
            {[
              { label: "Total Users", value: u.userCount },
              { label: "Students", value: u.studentCount },
              { label: "Faculty", value: u.facultyCount },
            ].map((s, i) => (
              <div key={s.label} className={cn(i > 0 && "border-l border-border/30 pl-4")}>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight">{formatNumber(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">University Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { icon: Globe, label: "Domain", value: u.domain },
                { icon: MapPin, label: "Location", value: `${u.city}, ${u.country}` },
                { icon: Mail, label: "Admin Email", value: u.adminEmail },
                { icon: UserCog, label: "Admin", value: u.adminName },
                { icon: Calendar, label: "Created", value: formatDate(u.createdAt) },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="mt-0.5 text-sm font-medium">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </SlideDrawer>
  );
}

/* ── Create Drawer ───────────────────────────────────────────────────────── */

function CreateDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mutation = useCreateUniversity();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUniversityFormData>({
    resolver: zodResolver(createUniversitySchema),
    defaultValues: { name: "", shortName: "", domain: "", city: "", country: "", adminEmail: "", adminName: "" },
  });
  const close = useCallback(() => { reset(); onClose(); }, [onClose, reset]);
  const onSubmit = useCallback(async (d: CreateUniversityFormData) => {
    try { await mutation.mutateAsync(d); reset(); onClose(); toast.success(`${d.name} created`, { description: `Invitation sent to ${d.adminEmail}` }); } catch { toast.error("Failed to create university"); }
  }, [mutation, reset, onClose]);

  return (
    <SlideDrawer open={open} onClose={close} title="New University" description="Onboard a new university tenant" width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
          <button type="submit" form="create-uni" disabled={mutation.isPending} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create University
          </button>
        </div>
      }
    >
      <form id="create-uni" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <h3 className="text-sm font-semibold">University Details</h3>
        <FormField label="University Name" placeholder="e.g. Oxford University" error={errors.name?.message} required {...register("name")} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Short Name" placeholder="e.g. OXF" error={errors.shortName?.message} required {...register("shortName")} />
          <FormField label="Domain" placeholder="e.g. oxford.edu" error={errors.domain?.message} required {...register("domain")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" placeholder="e.g. Oxford" error={errors.city?.message} required {...register("city")} />
          <FormField label="Country" placeholder="e.g. United Kingdom" error={errors.country?.message} required {...register("country")} />
        </div>

        <div className="h-px bg-border/30" />

        <h3 className="text-sm font-semibold">Administrator Account</h3>
        <FormField label="Full Name" placeholder="Full name of initial admin" error={errors.adminName?.message} required {...register("adminName")} />
        <FormField label="Email Address" type="email" placeholder="admin@oxford.edu" error={errors.adminEmail?.message} required {...register("adminEmail")} />

        {mutation.isError && <p className="text-sm text-danger">Failed to create. Please try again.</p>}
      </form>
    </SlideDrawer>
  );
}

/* ── Edit Drawer ─────────────────────────────────────────────────────────── */

function EditDrawer({ university, open, onClose }: { university: University | null; open: boolean; onClose: () => void }) {
  const mutation = useUpdateUniversity();
  const { register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<CreateUniversityFormData>({
    resolver: zodResolver(createUniversitySchema),
  });

  // Populate form when university changes
  useEffect(() => {
    if (university) {
      setValue("name", university.name);
      setValue("shortName", university.shortName);
      setValue("domain", university.domain);
      setValue("city", university.city);
      setValue("country", university.country);
      setValue("adminName", university.adminName);
      setValue("adminEmail", university.adminEmail);
    }
  }, [university, setValue]);

  const close = useCallback(() => { reset(); onClose(); }, [onClose, reset]);
  const onSubmit = useCallback(async (d: CreateUniversityFormData) => {
    if (!university) return;
    try {
      await mutation.mutateAsync({ id: university.id, ...d });
      onClose();
      toast.success(`${d.name} updated`);
    } catch { toast.error("Failed to update university"); }
  }, [mutation, university, onClose]);

  return (
    <SlideDrawer open={open} onClose={close} title="Edit University" description={university?.name} width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
          <button type="submit" form="edit-uni" disabled={mutation.isPending || !isDirty} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </button>
        </div>
      }
    >
      <form id="edit-uni" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <h3 className="text-sm font-semibold">University Details</h3>
        <FormField label="University Name" placeholder="e.g. Oxford University" error={errors.name?.message} required {...register("name")} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Short Name" placeholder="e.g. OXF" error={errors.shortName?.message} required {...register("shortName")} />
          <FormField label="Domain" placeholder="e.g. oxford.edu" error={errors.domain?.message} required {...register("domain")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" placeholder="e.g. Oxford" error={errors.city?.message} required {...register("city")} />
          <FormField label="Country" placeholder="e.g. United Kingdom" error={errors.country?.message} required {...register("country")} />
        </div>

        <div className="h-px bg-border/30" />

        <h3 className="text-sm font-semibold">Administrator Account</h3>
        <FormField label="Full Name" placeholder="Full name of admin" error={errors.adminName?.message} required {...register("adminName")} />
        <FormField label="Email Address" type="email" placeholder="admin@oxford.edu" error={errors.adminEmail?.message} required {...register("adminEmail")} />

        {mutation.isError && <p className="text-sm text-danger">Failed to update. Please try again.</p>}
      </form>
    </SlideDrawer>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

const STATUS_OPTS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export default function SuperAdminUniversitiesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; uni: University | null }>({ open: false, uni: null });
  const [editOpen, setEditOpen] = useState(false);
  const [editUni, setEditUni] = useState<University | null>(null);

  const update = useUpdateUniversity();
  const { data, isLoading, isError, refetch } = useSuperAdminUniversities({ search: search || undefined, status: statusFilter || undefined, page, pageSize: 20 });
  const universities = data?.data ?? [];
  const meta = data?.meta;

  const openDetail = useCallback((u: University) => { setSelectedId(u.id); setDetailOpen(true); }, []);
  const openEdit = useCallback((u: University) => { setEditUni(u); setEditOpen(true); }, []);
  const handleToggle = useCallback((u: University) => { setConfirm({ open: true, uni: u }); }, []);
  const executeToggle = useCallback(async () => {
    if (!confirm.uni) return;
    const s = confirm.uni.status === "active";
    try { await update.mutateAsync({ id: confirm.uni.id, status: s ? "suspended" : "active" }); toast.success(s ? `${confirm.uni.name} suspended` : `${confirm.uni.name} reactivated`); } catch { toast.error("Action failed"); }
  }, [confirm.uni, update]);
  const handleResend = useCallback(async (u: University) => {
    try { await update.mutateAsync({ id: u.id, updatedAt: new Date().toISOString() }); toast.success("Invite sent", { description: u.adminEmail }); } catch { toast.error("Failed to send invite"); }
  }, [update]);

  return (
    <div>
      {/* ── Gradient wash — fades into white ───────────────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]"
        style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }}
      />

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Universities</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage and onboard university tenants</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600">
            <Plus className="h-4 w-4" /> New University
          </button>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search universities..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-lg bg-card pl-11 pr-10 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-300" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <CustomSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTS} />
        </div>

        {/* Table */}
        <div className="mt-8 pb-8">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border/30 px-6 py-4 last:border-0">
                  <Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-28" /><Skeleton className="h-5 w-36" /><Skeleton className="ml-auto h-5 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Failed to load" message="Could not retrieve data." onRetry={() => refetch()} />
          ) : universities.length === 0 ? (
            <div className="rounded-lg bg-card py-20 text-center shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50"><Search className="h-7 w-7 text-primary-300" /></div>
              <p className="mt-5 text-base font-semibold">No universities found</p>
              <p className="mt-1 text-sm text-muted-foreground">Adjust your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              {/* Table header */}
              <div className="grid grid-cols-[2.5fr_1fr_1.5fr_0.8fr_0.7fr_1fr_40px] items-center gap-4 bg-muted/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>University</span><span>Domain</span><span>Admin</span><span>Users</span><span>Status</span><span>Created</span><span />
              </div>
              {/* Table rows */}
              <div className="divide-y divide-border/30">
                {universities.map((u) => (
                  <div key={u.id} onClick={() => openDetail(u)}
                    className="group grid cursor-pointer grid-cols-[2.5fr_1fr_1.5fr_0.8fr_0.7fr_1fr_40px] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40"
                  >
                    <div>
                      <p className="text-sm font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.city}, {u.country}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.domain}</p>
                    <div>
                      <p className="text-sm">{u.adminName}</p>
                      <p className="text-xs text-muted-foreground">{u.adminEmail}</p>
                    </div>
                    <p className="font-mono text-sm font-medium">{formatNumber(u.userCount)}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", u.status === "active" ? "bg-success" : "bg-danger")} />
                      <span className={cn("text-xs font-semibold capitalize", u.status === "active" ? "text-success" : "text-danger")}>{u.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                    <RowActions university={u} onView={() => openDetail(u)} onEdit={() => openEdit(u)} onResend={() => handleResend(u)} onToggle={() => handleToggle(u)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-colors disabled:opacity-40 hover:bg-primary-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-colors disabled:opacity-40 hover:bg-primary-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditDrawer university={editUni} open={editOpen} onClose={() => { setEditOpen(false); setEditUni(null); }} />
      <DetailDrawer id={selectedId} open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedId(null); }} onToggle={handleToggle} onResend={handleResend} />
      <ConfirmDialog open={confirm.open} onOpenChange={(o) => setConfirm((p) => ({ ...p, open: o }))}
        title={confirm.uni?.status === "active" ? "Suspend University" : "Reactivate University"}
        description={confirm.uni?.status === "active" ? `Suspend "${confirm.uni?.name}"? All users will lose access.` : `Reactivate "${confirm.uni?.name}"? Access will be restored.`}
        confirmLabel={confirm.uni?.status === "active" ? "Suspend" : "Reactivate"}
        variant={confirm.uni?.status === "active" ? "danger" : "default"}
        onConfirm={executeToggle}
      />
    </div>
  );
}
