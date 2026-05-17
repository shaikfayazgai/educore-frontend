"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, Loader2, X, MoreHorizontal, Pencil, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram } from "@/admin/lib/hooks/use-admin";
import { ApiError } from "@/admin/lib/api/client";
import { createProgramSchema, type CreateProgramFormData, type CreateProgramFormInput } from "@/admin/lib/schemas/admin.schema";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/admin/components/shared/forms/form-field";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { cn } from "@/admin/lib/utils/cn";
import type { Program } from "@/admin/lib/api/types/admin.types";

const DEGREE_TYPE_OPTIONS = [
  { value: "UG", label: "Undergraduate" },
  { value: "PG", label: "Postgraduate" },
  { value: "PhD", label: "PhD" },
  { value: "Diploma", label: "Diploma" },
];

const DEGREE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  ...DEGREE_TYPE_OPTIONS,
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/* ── Row Actions ─────────────────────────────────────────────────────────── */

function RowActions({ program, onEdit, onToggle, onDelete }: {
  program: Program;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item onSelect={onToggle} className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted", program.status === "active" ? "text-danger" : "text-success")}>
            {program.status === "active" ? <><ShieldBan className="h-4 w-4" /> Deactivate</> : <><ShieldCheck className="h-4 w-4" /> Activate</>}
          </DropdownMenu.Item>
          {/* Hard delete — wipes the programme from the DB. Lets the admin
              clean up duplicates (e.g. two "BSc Biotech" rows with different
              departments that were created by mistake). Behind a
              confirmation dialog so it can't be triggered accidentally. */}
          <DropdownMenu.Item onSelect={onDelete} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-danger/10 focus:bg-danger/10">
            <Trash2 className="h-4 w-4" /> Delete permanently
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

// Collapse repeated values that differ only in case (e.g. "Computer Science"
// vs "computer science") down to a single suggestion. First-seen variant is
// kept as the canonical display.
function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = (v || "").trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/* ── Combo "pick existing OR type a new one" ──────────────────────────────
 * Renders as a native <select> populated with the existing values plus an
 * "Other (type your own)" sentinel. Picking the sentinel — or starting with
 * a value that isn't on the list — flips it into a free-text input so the
 * admin can type a new value. The new value is added to the suggestion list
 * the next time the dialog opens (since the suggestions come live from the
 * programmes API).
 *
 * Designed to be a thin wrapper that delegates value ownership to RHF via
 * Controller — no internal state for the value, only for the "is in custom
 * mode" toggle (which has to survive the moment between picking "Other..."
 * and typing the first character).
 */
const OTHER_SENTINEL = "__other__";

function ComboWithOther({
  label,
  required,
  placeholder,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
  error?: string;
}) {
  // Custom-mode flips on when the current value isn't in the options list
  // (so when editing an existing program with a custom name, the input
  // appears immediately). Also forced on by picking "Other..." from the
  // dropdown — needed because at that instant value === "" which would
  // otherwise look like "show the dropdown again".
  const valueIsCustom = !!value && !options.includes(value);
  const [forceCustom, setForceCustom] = useState(false);
  const isCustom = valueIsCustom || forceCustom;

  // Reset force-mode when the value snaps to an option (e.g. admin picked
  // "Other..." then changed their mind and picked an existing entry).
  useEffect(() => {
    if (options.includes(value)) setForceCustom(false);
  }, [value, options]);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {!isCustom ? (
        <select
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === OTHER_SENTINEL) {
              setForceCustom(true);
              onChange("");
            } else {
              onChange(v);
            }
          }}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}...`}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
          <option value={OTHER_SENTINEL}>Other (type your own)…</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || `Type a new ${label.toLowerCase()}…`}
            autoFocus
            className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
          <button
            type="button"
            onClick={() => { setForceCustom(false); onChange(""); }}
            className="rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
            title="Back to dropdown"
          >
            ← Pick from list
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

/* ── Create / Edit Dialog ────────────────────────────────────────────────── */

function ProgramDialog({
  open,
  onOpenChange,
  editingProgram,
  existingPrograms,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProgram: Program | null;
  existingPrograms: Program[];
}) {
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const isEditing = !!editingProgram;

  // Suggestion lists pulled from the live programmes data so as soon as the
  // admin creates a new program, it shows up here on the next open. Deduped
  // case-insensitively (so "Computer Science" and "computer science" don't
  // both appear) with the first-seen capitalization winning.
  const nameOptions = useMemo(() => dedupeCaseInsensitive(existingPrograms.map((p) => p.name)), [existingPrograms]);
  const deptOptions = useMemo(() => dedupeCaseInsensitive(existingPrograms.map((p) => p.department)), [existingPrograms]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateProgramFormInput, unknown, CreateProgramFormData>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: editingProgram
      ? { name: editingProgram.name, code: editingProgram.code, department: editingProgram.department, duration: editingProgram.duration, totalSemesters: editingProgram.totalSemesters, degreeType: editingProgram.degreeType }
      : { name: "", code: "", department: "", duration: 3, totalSemesters: 6, degreeType: "UG" },
  });

  // The dialog is always mounted at the page root, so useForm's
  // `defaultValues` only fires on the very first mount. When the parent
  // swaps `editingProgram` (admin clicks Edit on a row), the form sticks
  // to its stale initial values — fields end up empty even though the row
  // had real data. Re-hydrate on every (open, editingProgram) transition:
  //   - opening for edit → reset to that row's values
  //   - opening for create → reset to blanks
  //   - closing → nothing to do (next open will reset cleanly)
  useEffect(() => {
    if (!open) return;
    if (editingProgram) {
      reset({
        name: editingProgram.name,
        code: editingProgram.code,
        department: editingProgram.department,
        duration: editingProgram.duration,
        totalSemesters: editingProgram.totalSemesters,
        degreeType: editingProgram.degreeType,
      });
    } else {
      reset({ name: "", code: "", department: "", duration: 3, totalSemesters: 6, degreeType: "UG" });
    }
  }, [open, editingProgram, reset]);

  const onSubmit = useCallback(
    async (data: CreateProgramFormData) => {
      try {
        if (isEditing && editingProgram) {
          await updateProgram.mutateAsync({ id: editingProgram.id, ...data });
          toast.success(`${data.name} updated`);
        } else {
          await createProgram.mutateAsync(data);
          toast.success(`${data.name} created`);
        }
        reset();
        onOpenChange(false);
      } catch {
        toast.error(isEditing ? "Failed to update program" : "Failed to create program");
      }
    },
    [isEditing, editingProgram, createProgram, updateProgram, reset, onOpenChange],
  );

  const isPending = createProgram.isPending || updateProgram.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Edit Program" : "New Program"}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {isEditing ? `Update details for ${editingProgram?.name}` : "Define a new degree program offered by your institution"}
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {/* Program Name — combo: pick from existing programmes (auto-deduped
                case-insensitively) or hit "Other…" to type a new one. The new
                value flows back into the suggestion list as soon as it's saved. */}
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <ComboWithOther
                  label="Program Name"
                  required
                  placeholder="e.g. BSc Computer Science"
                  options={nameOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.name?.message}
                />
              )}
            />
            {/* Department — same pattern, sourced from distinct departments
                across the existing programmes. */}
            <Controller
              control={control}
              name="department"
              render={({ field }) => (
                <ComboWithOther
                  label="Department"
                  required
                  placeholder="e.g. Computer Science"
                  options={deptOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.department?.message}
                />
              )}
            />
            {/* Program Code — short identifier (CSE, ECE, MBA, …). Optional —
                backend derives one from the name if left blank. Letters/digits
                only, uppercase enforced on input so it lines up with how the
                catalog displays course codes. */}
            <FormField
              label="Program Code"
              placeholder="e.g. CSE, ECE, MBA — leave blank to auto-derive"
              hint="Short identifier. Uppercase letters/digits only. Leave blank and we'll generate one from the name."
              error={errors.code?.message}
              maxLength={8}
              {...register("code", {
                setValueAs: (v: string) => (v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
              })}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Duration (years)" type="number" placeholder="3" error={errors.duration?.message} required {...register("duration")} />
              <FormField label="Total Semesters" type="number" placeholder="6" error={errors.totalSemesters?.message} required {...register("totalSemesters")} />
              <FormSelect label="Degree Type" options={DEGREE_TYPE_OPTIONS} error={errors.degreeType?.message} required {...register("degreeType")} />
            </div>

            {(createProgram.isError || updateProgram.isError) && (
              <p className="text-sm text-danger">Operation failed. Please try again.</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Program"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ProgramsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });

  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();
  const { data, isLoading, isError, refetch } = usePrograms({
    search: search || undefined,
    degreeType: degreeFilter || undefined,
    status: statusFilter || undefined,
  });

  const programs = data?.data ?? [];

  const handleSearch = useCallback((value: string) => { setSearch(value); }, []);

  const handleEdit = useCallback((program: Program) => {
    setEditingProgram(program);
    setDialogOpen(true);
  }, []);

  const handleToggle = useCallback((program: Program) => {
    setConfirm({ open: true, program });
  }, []);

  const executeToggle = useCallback(async () => {
    if (!confirm.program) return;
    const newStatus = confirm.program.status === "active" ? "inactive" : "active";
    try {
      await updateProgram.mutateAsync({ id: confirm.program.id, status: newStatus });
      toast.success(newStatus === "active" ? `${confirm.program.name} activated` : `${confirm.program.name} deactivated`);
    } catch {
      toast.error("Failed to update status");
    }
  }, [confirm.program, updateProgram]);

  // Hard-delete a programme. Wired so admins can clean up duplicate rows
  // (e.g. two `BSc Biotech` entries created against different departments
  // before uniqueness was enforced). Confirmation dialog is mandatory.
  const handleDelete = useCallback((program: Program) => {
    setDeleteConfirm({ open: true, program });
  }, []);

  const executeDelete = useCallback(async () => {
    if (!deleteConfirm.program) return;
    try {
      await deleteProgram.mutateAsync(deleteConfirm.program.id);
      toast.success(`${deleteConfirm.program.name} deleted permanently`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete program");
    }
  }, [deleteConfirm.program, deleteProgram]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs & Degrees"
        description="Manage degree programs offered by your institution"
        actions={
          <button
            onClick={() => { setEditingProgram(null); setDialogOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" /> New Program
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput onSearch={handleSearch} placeholder="Search programs..." className="w-full sm:max-w-xs" />
        <select
          value={degreeFilter}
          onChange={(e) => setDegreeFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {DEGREE_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState title="Failed to load programs" message="Could not retrieve program data." onRetry={() => refetch()} />
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">No programs found</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first program or adjust filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[2.2fr_0.7fr_1.1fr_0.7fr_0.8fr_0.7fr_0.8fr_36px] items-center gap-3 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Program</span><span>Code</span><span>Department</span><span>Type</span><span>Duration</span><span>Students</span><span>Status</span><span />
          </div>
          {/* Rows */}
          {programs.map((p) => (
            <div key={p.id} className="group grid grid-cols-[2.2fr_0.7fr_1.1fr_0.7fr_0.8fr_0.7fr_0.8fr_36px] items-center gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/30">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="font-mono text-xs uppercase text-muted-foreground">{p.code || <span className="text-muted-foreground/50">—</span>}</p>
              <p className="text-sm text-muted-foreground">{p.department}</p>
              <StatusBadge variant="default">{p.degreeType}</StatusBadge>
              <p className="text-sm">{p.duration} yr / {p.totalSemesters} sem</p>
              <p className="text-sm font-medium">{p.studentCount}</p>
              <StatusBadge variant={p.status === "active" ? "success" : "muted"} dot>{p.status}</StatusBadge>
              <RowActions
                program={p}
                onEdit={() => handleEdit(p)}
                onToggle={() => handleToggle(p)}
                onDelete={() => handleDelete(p)}
              />
            </div>
          ))}
        </div>
      )}

      <ProgramDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingProgram(null); }}
        editingProgram={editingProgram}
        existingPrograms={programs}
      />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((prev) => ({ ...prev, open: o }))}
        title={confirm.program?.status === "active" ? "Deactivate Program" : "Activate Program"}
        description={
          confirm.program?.status === "active"
            ? confirm.program.studentCount > 0
              ? `Deactivate "${confirm.program?.name}"? ${confirm.program.studentCount} student${confirm.program.studentCount === 1 ? " is" : "s are"} currently enrolled. Existing students keep access; new admissions will be blocked.`
              : `Deactivate "${confirm.program?.name}"? No students are enrolled. New admissions will be blocked.`
            : `Activate "${confirm.program?.name}"? Students can enroll in this program again.`
        }
        confirmLabel={confirm.program?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirm.program?.status === "active" ? "danger" : "default"}
        onConfirm={executeToggle}
      />

      {/* Permanent-delete confirm — danger variant, calls out that the row
          is gone and that any students still tagged to it will need
          re-assignment. Phrased so an admin doing a quick cleanup of a
          duplicate row doesn't accidentally nuke a populated programme. */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(o) => setDeleteConfirm((p) => ({ ...p, open: o }))}
        title="Delete program permanently"
        description={
          deleteConfirm.program
            ? `Permanently delete "${deleteConfirm.program.name}" (${deleteConfirm.program.department})? ${
                deleteConfirm.program.studentCount > 0
                  ? `${deleteConfirm.program.studentCount} student${deleteConfirm.program.studentCount === 1 ? " is" : "s are"} currently mapped to this dept — they'll keep their accounts but the program link is gone. `
                  : ""
              }This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={executeDelete}
      />
    </div>
  );
}
