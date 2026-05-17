"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Loader2, X, MoreHorizontal, Eye, Pencil, ShieldBan, ShieldCheck,
  Search, UserCog, Globe, MapPin, Mail, Calendar, Hash,
  Trash2, Upload, ArrowUpRight,
} from "lucide-react";
import {
  useForm,
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useSuperAdminUniversities,
  useSuperAdminUniversityDetail,
  useSuperAdminTrashUniversities,
  useCreateUniversity,
  useUpdateUniversity,
  useMoveUniversityToTrash,
} from "@/superadmin/lib/hooks/use-super-admin";
import { useCreatesBlocked } from "@/superadmin/lib/hooks/use-system-status";
import { createUniversitySchema, type CreateUniversityFormData } from "@/superadmin/lib/schemas/super-admin.schema";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { SlideDrawer } from "@/superadmin/components/shared/feedback/slide-drawer";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { SuspendDialog } from "@/superadmin/components/shared/feedback/suspend-dialog";
import { ImportUniversitiesDialog } from "@/superadmin/components/shared/feedback/import-universities-dialog";
import { ApiError } from "@/superadmin/lib/api/client";
import { FormField } from "@/superadmin/components/shared/forms/form-field";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { CustomSelect } from "@/superadmin/components/shared/forms/custom-select";
import { CountrySelect, StateSelect } from "@/superadmin/components/shared/forms/country-state-select";
import { PhoneInput } from "@/superadmin/components/shared/forms/phone-input";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatDate, formatNumber } from "@/superadmin/lib/utils/format";
import type { University, UniversityType } from "@/superadmin/lib/api/types/super-admin.types";

const UNIVERSITY_TYPE_OPTIONS = [
  { value: "govt_central", label: "Govt Central" },
  { value: "state",        label: "State" },
  { value: "private",      label: "Private" },
  { value: "others",       label: "Others" },
];

/** Build a safe absolute URL from a stored domain. The admin entered
 *  values like "oxford.edu" without a scheme, so we prepend https://;
 *  if they already typed http(s):// we keep it. Returns null when the
 *  value is empty so the caller can render plain text instead. */
function toExternalHref(domain: string): string | null {
  const trimmed = domain.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** One row inside the University Info card. Renders as a link (opens in
 *  a new tab) when `href` is set, plain text otherwise — keeps the card
 *  body terse without sprinkling conditionals at every call site. */
function InfoRow({
  icon: Icon, label, value, href,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-primary-700 underline-offset-2 hover:underline"
          >
            <span className="truncate">{value}</span>
            <ArrowUpRight className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ── Row Actions ─────────────────────────────────────────────────────────── */

function RowActions({ university, onView, onEdit, onActivate, onSuspend, onTrash }: {
  university: University;
  onView: () => void;
  onEdit: () => void;
  /** Flip inactive → active. Only meaningful when status === 'inactive'. */
  onActivate: () => void;
  /** Open the suspend-with-comment dialog. Available for active AND inactive
   *  rows (suspending an inactive tenant is still a valid escalation). */
  onSuspend: () => void;
  onTrash: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-primary-50 hover:text-primary-600 data-[state=open]:bg-primary-50 data-[state=open]:text-primary-600">
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
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          {/* Activate appears only for inactive rows (flips to active without
              a comment). Suspend (with mandatory reason → moves to trash)
              is available for BOTH active AND inactive — the platform admin
              may want to escalate from "deactivated" to "suspended in trash"
              with an audit-grade reason note. */}
          {university.status === "inactive" && (
            <DropdownMenu.Item onSelect={onActivate} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-success outline-none transition-colors hover:bg-muted focus:bg-muted">
              <ShieldCheck className="h-4 w-4" /> Activate
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item onSelect={onSuspend} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-muted focus:bg-muted">
            <ShieldBan className="h-4 w-4" /> Suspend
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item onSelect={onTrash} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────────────────── */

function DetailDrawer({ id, open, onClose, onActivate, onSuspend, onTrash }: {
  id: string | null;
  open: boolean;
  onClose: () => void;
  onActivate: (u: University) => void;
  onSuspend: (u: University) => void;
  onTrash: (u: University) => void;
}) {
  const { data: u, isLoading } = useSuperAdminUniversityDetail(id ?? "");

  return (
    <SlideDrawer open={open} onClose={onClose} title={u?.name ?? "University"} description={u ? `${u.shortName} — ${u.city}, ${u.country}` : undefined} width="lg"
      footer={u && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={() => onTrash(u)} className="rounded-lg px-3 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10">
            Delete
          </button>
          {u.status === "inactive" && (
            <button type="button" onClick={() => onActivate(u)} className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white shadow-lg shadow-success/25 transition-all hover:-translate-y-0.5 hover:bg-success/90">
              Activate
            </button>
          )}
          <button type="button" onClick={() => onSuspend(u)} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-lg shadow-danger/25 transition-all hover:-translate-y-0.5 hover:bg-danger/90">
            Suspend
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
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Users",    value: formatNumber(u.userCount) },
              { label: "Students", value: formatNumber(u.studentCount) },
              { label: "Faculty",  value: formatNumber(u.facultyCount) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-muted/40 px-4 py-3 ring-1 ring-border/30">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-card ring-1 ring-border/30">
            <h3 className="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">University Info</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pb-5 pt-3">
              <InfoRow icon={Hash}     label="University Code" value={u.universityCode || "—"} />
              <InfoRow icon={Globe}    label="Domain"          value={u.domain} href={u.domain ? toExternalHref(u.domain) : null} />
              <InfoRow icon={MapPin}   label="Location"        value={[u.city, u.state, u.country].filter(Boolean).join(", ")} />
              <InfoRow icon={Hash}     label="Pin Code"        value={u.pinCode || "—"} />
              <InfoRow icon={UserCog}  label="Type"            value={UNIVERSITY_TYPE_OPTIONS.find((o) => o.value === u.universityType)?.label ?? u.universityType} />
              <InfoRow icon={Calendar} label="Created"         value={formatDate(u.createdAt)} />
            </div>
          </div>

          <div className="rounded-lg bg-card ring-1 ring-border/30">
            <h3 className="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administrator</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pb-5 pt-3">
              {[
                { icon: UserCog, label: "Full Name",   value: u.adminName },
                { icon: Mail,    label: "Email",       value: u.adminEmail },
                { icon: Hash,    label: "Phone",       value: u.adminPhone || "—" },
                { icon: UserCog, label: "Designation", value: u.adminDesignation || "—" },
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

          {u.status === "suspended" && u.suspensionComment && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-danger">Suspension reason</p>
              <p className="mt-1 text-sm">{u.suspensionComment}</p>
              {u.suspendedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Suspended on {formatDate(u.suspendedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </SlideDrawer>
  );
}

/* ── Create / Edit drawer body (shared) ──────────────────────────────────── */

const emptyUniversityForm: CreateUniversityFormData = {
  name: "", shortName: "", universityCode: "", universityType: "others",
  domain: "", city: "", state: "", pinCode: "",
  country: "", countryCode: "",
  adminEmail: "", adminName: "", adminPhone: "", adminDesignation: "",
  status: "active",
};

function UniversityFormFields({
  control,
  register,
  errors,
  watch,
  setValue,
}: {
  control: Control<CreateUniversityFormData>;
  register: UseFormRegister<CreateUniversityFormData>;
  errors: FieldErrors<CreateUniversityFormData>;
  watch: UseFormWatch<CreateUniversityFormData>;
  setValue: UseFormSetValue<CreateUniversityFormData>;
}) {
  const country = watch("country");
  const countryCode = watch("countryCode");
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold">University Details</h3>
      <FormField label="University Name" placeholder="e.g. Oxford University" error={errors.name?.message} required {...register("name")} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Short Name" placeholder="e.g. OXF" error={errors.shortName?.message} required {...register("shortName")} />
        <FormField label="University Code" placeholder="e.g. OX01" error={errors.universityCode?.message} required {...register("universityCode")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Controller name="universityType" control={control} render={({ field }) => (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Type of University<span className="ml-0.5 text-danger">*</span></label>
            <CustomSelect value={field.value} onChange={field.onChange} options={UNIVERSITY_TYPE_OPTIONS} />
            {errors.universityType?.message && <p className="text-xs text-danger">{errors.universityType.message}</p>}
          </div>
        )} />
        <FormField label="Domain" placeholder="e.g. oxford.edu" error={errors.domain?.message} required {...register("domain")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Controller name="country" control={control} render={({ field }) => (
          <CountrySelect
            label="Country"
            value={field.value}
            required
            error={errors.country?.message}
            // University location only — does NOT touch the admin phone's
            // dial code (the dial code is its own selectable picker on the
            // Phone Number field below).
            onChange={(name) => { field.onChange(name); setValue("state", ""); }}
          />
        )} />
        <Controller name="state" control={control} render={({ field }) => (
          <StateSelect
            label="State"
            countryName={country}
            value={field.value}
            error={errors.state?.message}
            onChange={(name) => field.onChange(name)}
          />
        )} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" placeholder="e.g. Oxford" error={errors.city?.message} required {...register("city")} />
        <FormField label="Pin Code" placeholder="e.g. 518501" error={errors.pinCode?.message} {...register("pinCode")} />
      </div>

      <div className="h-px bg-border/30" />

      <h3 className="text-sm font-semibold">Administrator Account</h3>
      <FormField label="Full Name" placeholder="Full name of admin" error={errors.adminName?.message} required {...register("adminName")} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email Address" type="email" placeholder="admin@oxford.edu" error={errors.adminEmail?.message} required {...register("adminEmail")} />
        <PhoneInput
          label="Phone Number"
          dialCode={countryCode}
          onDialCodeChange={(code) =>
            setValue("countryCode", code, { shouldDirty: true, shouldValidate: true })
          }
          placeholder="9876543210"
          required
          error={errors.adminPhone?.message ?? errors.countryCode?.message}
          {...register("adminPhone")}
        />
      </div>
      <FormField label="Designation (optional)" placeholder="e.g. Registrar / Provost" error={errors.adminDesignation?.message} {...register("adminDesignation")} />

      <div className="h-px bg-border/30" />

      <Controller name="status" control={control} render={({ field }) => {
        const isActive = field.value === "active";
        const isSuspended = field.value === "suspended";
        return (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Active</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  When off, all logins to this tenant are blocked (same effect as Suspend
                  but without a reason note).
                </p>
              </div>
              {/* Single iOS-style toggle. Suspended is shown as a read-only red switch. */}
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                disabled={isSuspended}
                onClick={() => field.onChange(isActive ? "inactive" : "active")}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2",
                  isSuspended
                    ? "cursor-not-allowed bg-danger/60"
                    : isActive
                      ? "bg-success"
                      : "bg-muted-foreground/40",
                )}
                title={isSuspended ? "Suspended — change via the Suspend action" : ""}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
                    isActive || isSuspended ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
            {isSuspended && (
              <p className="mt-2 text-xs text-danger">
                This tenant is currently <strong>Suspended</strong>. Use the Reactivate action
                from the universities list to restore access.
              </p>
            )}
          </div>
        );
      }} />
    </div>
  );
}

/* ── Create Drawer ───────────────────────────────────────────────────────── */

function CreateDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mutation = useCreateUniversity();
  const form = useForm<CreateUniversityFormData>({
    resolver: zodResolver(createUniversitySchema),
    defaultValues: emptyUniversityForm,
  });
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = form;

  const close = useCallback(() => { reset(emptyUniversityForm); onClose(); }, [onClose, reset]);
  const onSubmit = useCallback(async (d: CreateUniversityFormData) => {
    try {
      await mutation.mutateAsync(d);
      reset(emptyUniversityForm);
      onClose();
      toast.success(`${d.name} created`, {
        description: `Login credentials emailed to ${d.adminEmail}.`,
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create university");
    }
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
      <form id="create-uni" onSubmit={handleSubmit(onSubmit)}>
        <UniversityFormFields control={control} register={register} errors={errors} watch={watch} setValue={setValue} />
        <p className="mt-3 text-xs text-muted-foreground">
          A login email with email + a temporary password will be sent automatically. The admin
          can change it on first sign-in from the university portal.
        </p>
        {mutation.isError && (
          <p className="mt-3 text-sm text-danger">
            {mutation.error instanceof ApiError && mutation.error.code === "EMAIL_EXISTS"
              ? "Duplicate email — that admin email is already used by another university."
              : mutation.error instanceof ApiError && mutation.error.code === "UNIVERSITY_CODE_EXISTS"
                ? "Duplicate university code — that code is already in use."
                : mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Failed to create. Please try again."}
          </p>
        )}
      </form>
    </SlideDrawer>
  );
}

/* ── Edit Drawer ─────────────────────────────────────────────────────────── */

function EditDrawer({ university, open, onClose }: { university: University | null; open: boolean; onClose: () => void }) {
  const mutation = useUpdateUniversity();
  const form = useForm<CreateUniversityFormData>({
    resolver: zodResolver(createUniversitySchema),
    defaultValues: emptyUniversityForm,
  });
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isDirty } } = form;

  useEffect(() => {
    if (open && university) {
      reset({
        name: university.name,
        shortName: university.shortName,
        universityCode: (university.universityCode ?? "").trim(),
        universityType: (university.universityType ?? "others") as UniversityType,
        domain: university.domain,
        city: university.city,
        state: university.state ?? "",
        pinCode: university.pinCode ?? "",
        country: university.country,
        countryCode: university.countryCode ?? "",
        adminName: university.adminName,
        adminEmail: university.adminEmail,
        adminPhone: university.adminPhone ?? "",
        adminDesignation: university.adminDesignation ?? "",
        status: university.status ?? "active",
      });
    } else if (!open) {
      reset(emptyUniversityForm);
    }
  }, [open, university, reset]);

  const close = useCallback(() => { reset(emptyUniversityForm); onClose(); }, [onClose, reset]);
  const onSubmit = useCallback(async (d: CreateUniversityFormData) => {
    if (!university) return;
    try {
      await mutation.mutateAsync({ id: university.id, ...d });
      onClose();
      toast.success(`${d.name} updated`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update university");
    }
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
      <form id="edit-uni" key={university?.id ?? "closed"} onSubmit={handleSubmit(onSubmit)}>
        <UniversityFormFields control={control} register={register} errors={errors} watch={watch} setValue={setValue} />
        {mutation.isError && (
          <p className="mt-3 text-sm text-danger">
            {mutation.error instanceof ApiError && mutation.error.code === "EMAIL_EXISTS"
              ? "Duplicate email — that admin email is already used by another university."
              : mutation.error instanceof ApiError && mutation.error.code === "UNIVERSITY_CODE_EXISTS"
                ? "Duplicate university code — that code is already in use."
                : mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Failed to update. Please try again."}
          </p>
        )}
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
  // System-status flag readout — drives the disable-with-tooltip state
  // on Import + New University. Polls every 30s so a flip elsewhere
  // reaches this page without manual refresh.
  const { blocked: createsBlocked, tooltip: createsBlockedTooltip } = useCreatesBlocked();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; uni: University | null }>({ open: false, uni: null });
  const [reactivateConfirm, setReactivateConfirm] = useState<{ open: boolean; uni: University | null }>({ open: false, uni: null });
  const [trashConfirm, setTrashConfirm] = useState<{ open: boolean; uni: University | null }>({ open: false, uni: null });
  const [editOpen, setEditOpen] = useState(false);
  const [editUni, setEditUni] = useState<University | null>(null);

  const update = useUpdateUniversity();
  const moveToTrash = useMoveUniversityToTrash();
  const { data: trashMeta } = useSuperAdminTrashUniversities({ page: 1, pageSize: 1 });
  const trashTotal = trashMeta?.meta?.total ?? 0;
  const { data, isLoading, isError, refetch } = useSuperAdminUniversities({ search: search || undefined, status: statusFilter || undefined, page, pageSize: 20 });
  const universities = data?.data ?? [];
  const meta = data?.meta;

  const openDetail = useCallback((u: University) => { setSelectedId(u.id); setDetailOpen(true); }, []);
  const openEdit = useCallback((u: University) => { setEditUni(u); setEditOpen(true); }, []);
  // Suspend always opens the comment dialog (works for active AND inactive).
  const handleSuspend = useCallback((u: University) => {
    setSuspendDialog({ open: true, uni: u });
  }, []);
  // Activate just confirms and flips status to 'active' (no comment needed).
  const handleActivate = useCallback((u: University) => {
    setReactivateConfirm({ open: true, uni: u });
  }, []);
  const isReactivateSuspended = reactivateConfirm.uni?.status === "suspended";
  const executeReactivate = useCallback(async () => {
    if (!reactivateConfirm.uni) return;
    try {
      await update.mutateAsync({ id: reactivateConfirm.uni.id, status: "active" });
      toast.success(`${reactivateConfirm.uni.name} ${isReactivateSuspended ? "reactivated" : "activated"}`);
    } catch {
      toast.error("Action failed");
    }
  }, [isReactivateSuspended, reactivateConfirm.uni, update]);
  const executeSuspend = useCallback(async (comment: string) => {
    if (!suspendDialog.uni) return;
    try {
      await update.mutateAsync({
        id: suspendDialog.uni.id,
        status: "suspended",
        suspensionComment: comment,
      });
      toast.success(`${suspendDialog.uni.name} suspended`);
      setSuspendDialog({ open: false, uni: null });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to suspend");
    }
  }, [suspendDialog.uni, update]);

  const handleTrash = useCallback((u: University) => {
    setTrashConfirm({ open: true, uni: u });
  }, []);

  const executeTrash = useCallback(async () => {
    if (!trashConfirm.uni) return;
    try {
      await moveToTrash.mutateAsync(trashConfirm.uni.id);
      toast.success(`Deleted ${trashConfirm.uni.name}`, {
        description: "Permanently removed in 30 days unless restored from Trash.",
      });
      setTrashConfirm({ open: false, uni: null });
      setDetailOpen(false);
      setSelectedId(null);
    } catch {
      toast.error("Could not delete");
    }
  }, [trashConfirm.uni, moveToTrash]);

  return (
    <div>
      {/* Gradient wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]"
        style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }}
      />

      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Universities</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage and onboard university tenants</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/superadmin/trash"
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg shadow-primary-900/[0.04] transition-all hover:bg-muted"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              Trash
              {trashTotal > 0 && (
                <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">
                  {trashTotal}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              disabled={createsBlocked}
              title={createsBlocked ? createsBlockedTooltip : undefined}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg shadow-primary-900/[0.04] transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              Import
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={createsBlocked}
              title={createsBlocked ? createsBlockedTooltip : undefined}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Plus className="h-4 w-4" /> New University
            </button>
          </div>
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
              {/* Horizontal-scroll wrapper. The grid stays at its natural
                  min width (~1100px) so columns don't collapse into each
                  other on narrow viewports — instead the whole table
                  scrolls. Header + rows share the same grid template so
                  columns stay aligned across scroll positions. */}
              <div className="overflow-x-auto">
                <div className="min-w-[1100px]">
                  {/* Table header — Users column replaced by per-role
                      counts (Students / Faculty / Placement). Icons
                      dropped to keep the header dense and scannable. */}
                  <div className="grid grid-cols-[2fr_0.9fr_1.4fr_70px_70px_80px_90px_110px_40px] items-center gap-3 bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>University</span>
                    <span>Code</span>
                    <span>Admin</span>
                    <span className="text-right">Students</span>
                    <span className="text-right">Faculty</span>
                    <span className="text-right">Placement</span>
                    <span>Status</span>
                    <span>Created</span>
                    <span className="text-right">Action</span>
                  </div>
                  {/* Table rows */}
                  <div className="divide-y divide-border/30">
                    {universities.map((u) => (
                      <div key={u.id} onClick={() => openDetail(u)}
                        className="group grid cursor-pointer grid-cols-[2fr_0.9fr_1.4fr_70px_70px_80px_90px_110px_40px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[u.city, u.state, u.country].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <p className="truncate text-sm font-mono text-muted-foreground">{u.universityCode || "—"}</p>
                        <div className="min-w-0">
                          <p className="truncate text-sm">{u.adminName}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.adminEmail}</p>
                        </div>
                        <p className="text-right font-mono text-sm font-medium tabular-nums">{formatNumber(u.studentCount)}</p>
                        <p className="text-right font-mono text-sm font-medium tabular-nums">{formatNumber(u.facultyCount)}</p>
                        <p className="text-right font-mono text-sm font-medium tabular-nums">{formatNumber(u.placementCount)}</p>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            u.status === "active" ? "bg-success"
                              : u.status === "inactive" ? "bg-muted-foreground"
                              : "bg-danger",
                          )} />
                          <span className={cn(
                            "truncate text-xs font-semibold capitalize",
                            u.status === "active" ? "text-success"
                              : u.status === "inactive" ? "text-muted-foreground"
                              : "text-danger",
                          )}>{u.status}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                        <RowActions
                          university={u}
                          onView={() => openDetail(u)}
                          onEdit={() => openEdit(u)}
                          onActivate={() => handleActivate(u)}
                          onSuspend={() => handleSuspend(u)}
                          onTrash={() => handleTrash(u)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
      <ImportUniversitiesDialog open={importOpen} onOpenChange={setImportOpen} />
      <EditDrawer university={editUni} open={editOpen} onClose={() => { setEditOpen(false); setEditUni(null); }} />
      <DetailDrawer
        id={selectedId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedId(null); }}
        onActivate={handleActivate}
        onSuspend={handleSuspend}
        onTrash={handleTrash}
      />
      <SuspendDialog
        open={suspendDialog.open}
        onOpenChange={(o) => setSuspendDialog((p) => ({ ...p, open: o }))}
        universityName={suspendDialog.uni?.name ?? ""}
        onConfirm={executeSuspend}
      />
      <ConfirmDialog open={trashConfirm.open} onOpenChange={(o) => setTrashConfirm((p) => ({ ...p, open: o }))}
        title="Delete University"
        description={trashConfirm.uni ? `“${trashConfirm.uni.name}” will move to Trash. You can export or restore it from Trash for 30 days; after that it will be permanently deleted.` : ""}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeTrash}
      />
      <ConfirmDialog open={reactivateConfirm.open} onOpenChange={(o) => setReactivateConfirm((p) => ({ ...p, open: o }))}
        title={isReactivateSuspended ? "Reactivate University" : "Activate University"}
        description={reactivateConfirm.uni
          ? (isReactivateSuspended
              ? `Reactivate "${reactivateConfirm.uni.name}"? Access will be restored for all users.`
              : `Activate "${reactivateConfirm.uni.name}"? Login will be enabled again for all users.`)
          : ""}
        confirmLabel={isReactivateSuspended ? "Reactivate" : "Activate"}
        variant="default"
        onConfirm={executeReactivate}
      />
    </div>
  );
}
