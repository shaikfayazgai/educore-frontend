"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Plus, Loader2, X, Upload, Download, MoreHorizontal, Eye, Pencil, ShieldCheck, MailPlus, Mail, CheckSquare, Square, Send, KeyRound, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { ApiError, api } from "@/admin/lib/api/client";
import { cn } from "@/admin/lib/utils/cn";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useAdminUsers, useCreateUser, useUpdateUser, useBulkImportUsers, usePrograms,
  useSendOnboardingEmails, useDeleteUser,
} from "@/admin/lib/hooks/use-admin";
import { useCreatesBlocked } from "@/admin/lib/hooks/use-system-status";
import { FileUpload } from "@/admin/components/shared/forms/file-upload";
import {
  createUserSchema,
  type CreateUserFormData,
} from "@/admin/lib/schemas/admin.schema";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { DataTable } from "@/admin/components/shared/data-table";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/admin/components/shared/forms/form-field";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { SlideDrawer } from "@/admin/components/shared/feedback/slide-drawer";
import { formatRelative } from "@/admin/lib/utils/format";
import type { AdminUser } from "@/admin/lib/api/types/admin.types";
import type { PortalRole } from "@/admin/lib/api/types/common.types";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "placement", label: "Placement" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  ...ROLE_OPTIONS,
];

/**
 * Active/Inactive toggle for the Users list status column. One click flips
 * the account between `active` and `inactive`.
 *
 * Backend wiring (already in place):
 *   * `PATCH /api/admin/users/{id} {status:'inactive'}` updates the DB AND
 *     calls `revoke_all_login_sessions` so any live JWT is invalidated.
 *   * Future login attempts return 403 ACCOUNT_DEACTIVATED.
 *   * A mid-session API call from the now-deactivated user gets bounced to
 *     `/account-suspended` by the api-client.
 * So one toggle click = full lockout; no second confirmation needed for
 * deactivation (the row 3-dots Delete action is the destructive path).
 */
function StatusToggle({ user, onToggle }: { user: AdminUser; onToggle: () => void }) {
  const isActive = user.status === "active";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={isActive ? `Deactivate ${user.name}` : `Activate ${user.name}`}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        title={isActive ? "Active — click to deactivate (locks the user out)" : "Inactive — click to re-activate"}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
          isActive ? "bg-success" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            isActive ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </button>
      <span
        className={cn(
          "text-xs font-medium capitalize",
          isActive ? "text-success" : user.status === "suspended" ? "text-danger" : "text-muted-foreground",
        )}
      >
        {user.status}
      </span>
    </div>
  );
}

function RowActions({ user, onView, onEdit, onToggleStatus, onResendInvitation, onRevoke, onDelete }: {
  user: AdminUser;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onResendInvitation: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}) {
  // Onboarded users (welcomedAt set) have credentials. Pending users don't —
  // they get the "Send invitation" affordance instead of revoke.
  const isOnboarded = !!user.welcomedAt;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {/* 3-dots is always visible (admin asked for "menu side editing
            panel not there" — the original hover-only opacity hid it on
            screenshots and confused them into thinking the feature wasn't
            shipped). */}
        <button onClick={(e) => e.stopPropagation()} aria-label="Row actions" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onView} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" /> View profile
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit user
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />

          {/* Credential lifecycle — resend invitation when not yet onboarded;
              revoke (force re-onboarding) when already onboarded. */}
          <DropdownMenu.Item onSelect={onResendInvitation} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-portal-accent outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Send className="h-4 w-4" />
            {isOnboarded ? "Re-send credentials" : "Send invitation"}
          </DropdownMenu.Item>
          {isOnboarded && (
            <DropdownMenu.Item onSelect={onRevoke} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-warning outline-none transition-colors hover:bg-muted focus:bg-muted">
              <KeyRound className="h-4 w-4" /> Revoke credentials
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />

          {/* Suspend removed per admin's request — Delete is the only "destructive"
              action surfaced. We still show Activate on already-suspended/inactive
              rows so the admin can re-enable an account that some other flow
              (e.g. Revoke credentials, repeated bad-password lockout) deactivated. */}
          {user.status !== "active" && (
            <DropdownMenu.Item onSelect={onToggleStatus} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-success outline-none transition-colors hover:bg-muted focus:bg-muted">
              <ShieldCheck className="h-4 w-4" /> Activate
            </DropdownMenu.Item>
          )}

          {/* Hard delete — wipes the row from login_accounts on the backend.
              The single destructive action. Always behind a confirmation. */}
          <DropdownMenu.Item onSelect={onDelete} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-danger/10 focus:bg-danger/10">
            <Trash2 className="h-4 w-4" /> Delete permanently
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Renders a clickable column header that triggers backend-side sort.
 *  Shows ▲/▼ arrows when this column is the active sort. The DataTable's
 *  built-in TanStack Table sort is doing in-memory ordering of the
 *  currently-rendered page only; the real sort comes from the API call.
 *  Keep that visual indicator in the header so admins know the column
 *  drives a server-side ORDER BY. */
function SortableHeader({
  label, column, sortBy, sortDir, onSort,
}: {
  label: string;
  column: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (column: string) => void;
}) {
  const active = sortBy === column;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onSort(column); }}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <span className={cn("text-[10px]", active ? "text-foreground" : "text-muted-foreground/40")}>
        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

function createUserColumns(callbacks: {
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onResendInvitation: (user: AdminUser) => void;
  onRevoke: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  /** Current backend-side sort state — drives the ▲/▼ chevron in headers. */
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (column: string) => void;
}): ColumnDef<AdminUser, unknown>[] {
  const { sortBy, sortDir, onSort } = callbacks;
  return [
    {
      accessorKey: "name",
      header: () => <SortableHeader label="Name" column="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
    },
    {
      accessorKey: "email",
      header: () => <SortableHeader label="Email" column="email" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      // Unified ID No. — single field for every role. Falls back through
      // legacy aliases so older rows still render correctly until the
      // backend's read path always populates `idNo`.
      id: "idNumber",
      header: "ID No.",
      cell: ({ row }) => {
        const u = row.original;
        const v = u.idNo || u.studentId || u.employeeId;
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {v || <span className="text-muted-foreground/50">—</span>}
          </span>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => (
        <StatusBadge variant="default">{getValue() as string}</StatusBadge>
      ),
    },
    { accessorKey: "department", header: "Department" },
    {
      accessorKey: "status",
      header: "Status",
      // Read-only status badge. The actual flip-to-inactive control lives
      // inside the Edit User dialog (Status dropdown) — admin's request:
      // the list view shouldn't expose a one-click lockout, only show the
      // current state. Variant colour matches behaviour:
      //   active → green, suspended → red, inactive → muted grey.
      cell: ({ row }) => {
        const status = row.original.status;
        const variant: "success" | "danger" | "muted" =
          status === "active" ? "success" : status === "suspended" ? "danger" : "muted";
        return <StatusBadge variant={variant} dot>{status}</StatusBadge>;
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: () => <SortableHeader label="Last Login" column="last_login_at" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      cell: ({ getValue }) => {
        const val = getValue() as string | null;
        return (
          <span className="text-xs text-muted-foreground">
            {val ? formatRelative(val) : "Never"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          user={row.original}
          onView={() => callbacks.onView(row.original)}
          onEdit={() => callbacks.onEdit(row.original)}
          onToggleStatus={() => callbacks.onToggleStatus(row.original)}
          onResendInvitation={() => callbacks.onResendInvitation(row.original)}
          onRevoke={() => callbacks.onRevoke(row.original)}
          onDelete={() => callbacks.onDelete(row.original)}
        />
      ),
    },
  ];
}

const DESIGNATION_OPTIONS = [
  { value: "professor", label: "Professor" },
  { value: "associate_professor", label: "Associate Professor" },
  { value: "assistant_professor", label: "Assistant Professor" },
  { value: "lecturer", label: "Lecturer" },
];

// Placement officers don't fit the academic ladder — their roles are
// employer-facing. Kept separate from DESIGNATION_OPTIONS so the dropdown
// doesn't offer "Professor" to a placement hire.
const PLACEMENT_DESIGNATION_OPTIONS = [
  { value: "", label: "Select a designation..." },
  { value: "placement_officer", label: "Placement Officer" },
  { value: "senior_placement_officer", label: "Senior Placement Officer" },
  { value: "training_placement_officer", label: "Training & Placement Officer" },
  { value: "placement_coordinator", label: "Placement Coordinator" },
  { value: "head_of_placements", label: "Head of Placements" },
  { value: "industry_relations_manager", label: "Industry Relations Manager" },
];

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();
  const { data: programsData } = usePrograms({ status: "active" });
  const activePrograms = programsData?.data ?? [];

  // De-dupe by name — two active programmes can share a name (e.g. the same
  // BSc Biotech offered in two academic years). Without this the <select>
  // gets duplicate <option value="BSc Biotech"> entries and React warns about
  // non-unique keys.
  const programOptions = (() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [{ value: "", label: "Select a program..." }];
    for (const p of activePrograms) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        opts.push({ value: p.name, label: `${p.name} (${p.degreeType})` });
      }
    }
    return opts;
  })();

  // Distinct departments derived from active programs
  const departmentOptions = (() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [{ value: "", label: "Select a department..." }];
    for (const p of activePrograms) {
      if (!seen.has(p.department)) {
        seen.add(p.department);
        opts.push({ value: p.department, label: p.department });
      }
    }
    return opts;
  })();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "student", firstName: "", lastName: "", email: "", department: "" },
  });

  const selectedRole = watch("role");
  const selectedProgram = watch("program");

  // Auto-derive Department from Program for students
  const handleProgramChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const programName = e.target.value;
      setValue("program", programName);
      const matched = activePrograms.find((p) => p.name === programName);
      if (matched) {
        setValue("department", matched.department, { shouldValidate: true });
      }
    },
    [activePrograms, setValue]
  );

  // Cap semester options to selected program's totalSemesters
  const semesterCap = selectedRole === "student" && selectedProgram
    ? activePrograms.find((p) => p.name === selectedProgram)?.totalSemesters ?? 8
    : 8;
  const semesterOptions = Array.from({ length: semesterCap }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
  }));

  // Capture the real backend error message instead of hiding behind the
  // mutation's boolean isError flag. Without this, every failure shows
  // "Failed to create user. Please try again." regardless of cause — which
  // makes debugging (registrations-disabled / EMAIL_TAKEN / ID_NO_TAKEN /
  // DB constraint violations / missing-column errors) impossible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (data: CreateUserFormData) => {
      setSubmitError(null);
      try {
        await createUser.mutateAsync(data);
        reset();
        onOpenChange(false);
      } catch (err) {
        if (err instanceof ApiError) {
          setSubmitError(err.message);
        } else {
          setSubmitError(
            err instanceof Error ? err.message : "Unexpected error. Please try again."
          );
        }
      }
    },
    [createUser, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Create User</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Select a role first — the form fields will adjust accordingly.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
            {/* Role — FIRST */}
            <FormSelect
              label="Role"
              options={ROLE_OPTIONS}
              error={errors.role?.message}
              required
              {...register("role")}
            />

            <div className="h-px bg-border" />

            {/* Personal Information — common to all roles */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Personal Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="First Name" placeholder="First name" error={errors.firstName?.message} required {...register("firstName")} />
                  <FormField label="Last Name" placeholder="Last name" error={errors.lastName?.message} required {...register("lastName")} />
                </div>
                <FormField label="Email" type="email" placeholder="user@institution.edu" error={errors.email?.message} required {...register("email")} />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Role-specific fields */}
            {selectedRole === "student" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Academic Information</h3>
                {activePrograms.length === 0 && (
                  <div className="mb-3 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
                    No active programs. <a href="/admin/programs" className="font-semibold underline">Create a program first</a> before adding students.
                  </div>
                )}
                <div className="space-y-3">
                  <FormField label="ID No." placeholder="e.g. STU-2024-001" error={errors.idNo?.message} required {...register("idNo")} />
                  <FormSelect
                    label="Program"
                    options={programOptions}
                    error={errors.program?.message}
                    required
                    {...register("program", { onChange: handleProgramChange })}
                  />
                  <FormField
                    label="Department"
                    error={errors.department?.message}
                    hint="Auto-filled from selected program"
                    readOnly
                    required
                    {...register("department")}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Year Start" placeholder="e.g. 2024" error={errors.academicYearStart?.message} {...register("academicYearStart")} />
                    <FormField label="Year End" placeholder="e.g. 2027" error={errors.academicYearEnd?.message} {...register("academicYearEnd")} />
                    <FormSelect label="Current Semester" options={semesterOptions} error={errors.currentSemester?.message} {...register("currentSemester")} />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "faculty" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Professional Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="ID No." placeholder="e.g. FAC-2024-001" error={errors.idNo?.message} required {...register("idNo")} />
                    <FormSelect label="Department" options={departmentOptions} error={errors.department?.message} required {...register("department")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormSelect label="Designation" options={DESIGNATION_OPTIONS} error={errors.designation?.message} required {...register("designation")} />
                    <FormField label="Specialization" placeholder="e.g. Machine Learning" error={errors.specialization?.message} {...register("specialization")} />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "placement" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Professional Information</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Placement officers operate institution-wide and are not scoped to a department.
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="ID No."
                      placeholder="e.g. PLC-2024-001"
                      error={errors.idNo?.message}
                      required
                      {...register("idNo")}
                    />
                    <FormSelect
                      label="Designation"
                      options={PLACEMENT_DESIGNATION_OPTIONS}
                      error={errors.designation?.message}
                      required
                      {...register("designation")}
                    />
                  </div>
                  <FormField
                    label="Specialization"
                    placeholder="e.g. Tech & Engineering Recruitment"
                    error={errors.specialization?.message}
                    {...register("specialization")}
                  />
                </div>
              </div>
            )}

            {selectedRole === "admin" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Department</h3>
                <FormSelect label="Department" options={departmentOptions} error={errors.department?.message} required {...register("department")} />
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-danger/30 bg-danger-light/30 px-3 py-2 text-sm text-danger">
                {submitError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={createUser.isPending} className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50">
                {createUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ParsedRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  /** Unified ID No. — parser folds any of `idno`, `studentid`, or
   *  `employeeid` columns into this single field. */
  idNo?: string;
  program?: string;
  valid: boolean;
  /** True when the row collides with another row in the file or an existing
   *  user in the DB on email / ID No. Coloured amber in the preview. */
  duplicate?: boolean;
  error?: string;
}

function parseCSV(
  text: string,
  existing?: { emails: Set<string>; idNos: Set<string> },
): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const emailIdx = header.indexOf("email");
  const firstNameIdx = header.indexOf("firstname");
  const lastNameIdx = header.indexOf("lastname");
  const roleIdx = header.indexOf("role");
  const deptIdx = header.indexOf("department");
  // ID No. column — prefer `idno`, fall back to legacy `studentid` /
  // `employeeid` headers so existing template files still work.
  const idNoIdx = header.indexOf("idno");
  const studentIdIdx = header.indexOf("studentid");
  const employeeIdIdx = header.indexOf("employeeid");
  const programIdx = header.indexOf("program");

  if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1 || roleIdx === -1 || deptIdx === -1) {
    return [];
  }

  const validRoles = ["student", "faculty", "admin", "placement"];

  // Two-pass parse so within-file duplicates can be flagged on the second
  // occurrence and beyond. Pattern mirrors the super-admin bulk-import
  // checker which highlights conflicts on the row preview before submit.
  const rawRows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const idFromIdNo = idNoIdx >= 0 ? (cols[idNoIdx] || "").trim() : "";
    const idFromStudent = studentIdIdx >= 0 ? (cols[studentIdIdx] || "").trim() : "";
    const idFromEmployee = employeeIdIdx >= 0 ? (cols[employeeIdIdx] || "").trim() : "";
    return {
      email: (cols[emailIdx] || "").toLowerCase(),
      firstName: cols[firstNameIdx] || "",
      lastName: cols[lastNameIdx] || "",
      role: (cols[roleIdx] || "").toLowerCase(),
      department: cols[deptIdx] || "",
      idNo: idFromIdNo || idFromStudent || idFromEmployee,
      program: programIdx >= 0 ? (cols[programIdx] || "").trim() : "",
    };
  });

  // First pass: count occurrences so the second+ row gets the dup flag.
  const emailCount = new Map<string, number>();
  const idNoCount = new Map<string, number>();
  for (const r of rawRows) {
    if (r.email) emailCount.set(r.email, (emailCount.get(r.email) || 0) + 1);
    if (r.idNo) idNoCount.set(r.idNo, (idNoCount.get(r.idNo) || 0) + 1);
  }

  return rawRows.map((r) => {
    const errors: string[] = [];
    const duplicateReasons: string[] = [];

    // Field-level validation. ID No. is required for both students and
    // faculty (the two roles that historically had a roll/employee number).
    if (!r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) errors.push("invalid email");
    if (!r.firstName) errors.push("missing firstName");
    if (!r.lastName) errors.push("missing lastName");
    if (!validRoles.includes(r.role)) errors.push("invalid role");
    if (!r.department) errors.push("missing department");
    if ((r.role === "student" || r.role === "faculty") && !r.idNo) {
      errors.push(`missing ID No. for ${r.role}`);
    }

    // Duplicate detection — within-file and against the live DB.
    if (r.email && (emailCount.get(r.email) || 0) > 1) {
      duplicateReasons.push("email appears more than once in this file");
    }
    if (r.idNo && (idNoCount.get(r.idNo) || 0) > 1) {
      duplicateReasons.push("ID No. appears more than once in this file");
    }
    if (existing) {
      if (r.email && existing.emails.has(r.email)) {
        duplicateReasons.push("email already exists in the system");
      }
      if (r.idNo && existing.idNos.has(r.idNo)) {
        duplicateReasons.push("ID No. already exists in the system");
      }
    }

    const isDuplicate = duplicateReasons.length > 0;
    const allReasons = [...errors, ...duplicateReasons];

    return {
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      role: r.role,
      department: r.department,
      idNo: r.idNo || undefined,
      program: r.program || undefined,
      valid: allReasons.length === 0,
      duplicate: isDuplicate,
      error: allReasons.length > 0 ? allReasons.join(", ") : undefined,
    };
  });
}

function ImportUsersDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bulkImport = useBulkImportUsers();
  // Pull the existing user roster once when the dialog opens so we can
  // detect "email/id already in the system" duplicates BEFORE submit. The
  // server enforces uniqueness too (and reports duplicates in the response),
  // but pre-flighting in the preview gives the admin a chance to dedupe.
  const { data: rosterPage } = useAdminUsers({ pageSize: 1000 });
  const existingIndex = useMemo(() => {
    const emails = new Set<string>();
    const idNos = new Set<string>();
    for (const u of rosterPage?.users ?? []) {
      if (u.email) emails.add(u.email.toLowerCase());
      // Collect every legacy alias too so a CSV using the old `studentid`
      // column still detects collisions against rows imported under the new
      // `idno` scheme (and vice versa).
      const idNo = u.idNo || u.studentId || u.employeeId;
      if (idNo) idNos.add(idNo);
    }
    return { emails, idNos };
  }, [rosterPage]);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // Per-row "send credential email on import" decision. Keyed by parsed-row
  // index. Defaults to true for every valid row when the file is parsed —
  // the admin unchecks rows they want to import without emailing. Unchecked
  // rows are still imported; the admin can resend invitations later from the
  // Users list via "Send Onboarding".
  const [issueFor, setIssueFor] = useState<Record<number, boolean>>({});

  const validRows = parsedRows.filter((r) => r.valid);
  const duplicateRows = parsedRows.filter((r) => r.duplicate);
  // "errorRows" now excludes duplicates so the two counters don't double-count
  // the same row (a duplicate row is invalid + duplicate; we show it under
  // Duplicates only).
  const errorRows = parsedRows.filter((r) => !r.valid && !r.duplicate);
  const issuingCount = parsedRows.reduce(
    (acc, _r, i) => acc + (issueFor[i] ? 1 : 0),
    0,
  );
  const allValidSelected =
    validRows.length > 0 &&
    parsedRows.every((r, i) => !r.valid || issueFor[i]);

  const handleFilesChange = useCallback((files: File[]) => {
    setParsedRows([]);
    setIssueFor({});
    setParseError("");
    setSuccessMsg("");

    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Pass the live roster index so the parser can flag rows whose email /
      // studentId / employeeId already exist on the system OR repeat within
      // the file. Those rows get `duplicate=true` and are coloured amber in
      // the preview table.
      const rows = parseCSV(text, existingIndex);
      if (rows.length === 0) {
        setParseError(
          "Could not parse the CSV. Ensure columns: email, name, role, department"
        );
      } else {
        setParsedRows(rows);
        // Default: every valid row gets the credential email on Import.
        const next: Record<number, boolean> = {};
        rows.forEach((r, i) => {
          if (r.valid) next[i] = true;
        });
        setIssueFor(next);
      }
    };
    reader.onerror = () => setParseError("Failed to read file.");
    reader.readAsText(file);
  }, [existingIndex]);

  const toggleRow = useCallback((idx: number) => {
    setIssueFor((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const toggleAll = useCallback(() => {
    setIssueFor((prev) => {
      const allChecked =
        validRows.length > 0 &&
        parsedRows.every((r, i) => !r.valid || prev[i]);
      const next: Record<number, boolean> = {};
      parsedRows.forEach((r, i) => {
        if (r.valid) next[i] = !allChecked;
      });
      return next;
    });
  }, [parsedRows, validRows.length]);

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) return;
    try {
      const payload = parsedRows
        .map((r, i) => ({ row: r, idx: i }))
        .filter(({ row }) => row.valid)
        .map(({ row, idx }) => ({
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          role: row.role as "student" | "faculty" | "admin" | "placement",
          department: row.department,
          // Unified ID No. — backend folds it into student_id for every role.
          idNo: row.idNo,
          program: row.program,
          sendInvitation: !!issueFor[idx],
        }));
      const invitedNow = payload.filter((p) => p.sendInvitation).length;
      await bulkImport.mutateAsync({ users: payload });
      setSuccessMsg(
        invitedNow > 0
          ? `Imported ${validRows.length} user${validRows.length > 1 ? "s" : ""}. Credential email${invitedNow > 1 ? "s" : ""} sent to ${invitedNow}.`
          : `Imported ${validRows.length} user${validRows.length > 1 ? "s" : ""}. No credentials sent — you can resend invitations from "Send Onboarding".`,
      );
      setParsedRows([]);
      setIssueFor({});
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
      }, 1800);
    } catch {
      // error shown via mutation state
    }
  }, [validRows.length, parsedRows, issueFor, bulkImport, onOpenChange]);

  const handleDownloadTemplate = useCallback(() => {
    const csv =
      "email,firstName,lastName,role,department,idNo,program\n" +
      "john@university.edu,John,Smith,student,Computer Science,STU-2026-001,BSc Computer Science\n" +
      "jane@university.edu,Jane,Doe,faculty,Computer Science,FAC-2026-001,\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setParsedRows([]);
          setIssueFor({});
          setParseError("");
          setSuccessMsg("");
          bulkImport.reset();
        }
        onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold">
                Import Users
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                Upload a CSV, review the preview, pick who gets a credential email,
                then click Import. Unticked rows are still imported — you can email
                them later from <span className="font-medium">Send Onboarding</span>.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {/* Template download */}
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Expected CSV format (idNo required for students and faculty, program optional). Legacy
                <span className="font-mono"> studentId </span> /
                <span className="font-mono"> employeeId </span> columns are still accepted.
              </p>
              <pre className="text-xs font-mono text-muted-foreground bg-background rounded p-2 overflow-x-auto">
{`email,firstName,lastName,role,department,idNo,program
john@university.edu,John,Smith,student,Computer Science,STU-2026-001,BSc Computer Science
jane@university.edu,Jane,Doe,faculty,Computer Science,FAC-2026-001,`}
              </pre>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
              >
                <Download className="h-3 w-3" />
                Download template CSV
              </button>
            </div>

            {/* File upload */}
            <FileUpload
              label="Upload CSV file"
              accept=".csv"
              maxSize={5}
              onFilesChange={handleFilesChange}
              error={parseError}
            />

            {/* Parse results */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Found <span className="font-semibold">{parsedRows.length}</span> row{parsedRows.length > 1 ? "s" : ""}.
                    </span>
                    <span className="font-medium text-success">
                      {validRows.length} valid
                    </span>
                    {duplicateRows.length > 0 && (
                      <span
                        className="font-medium text-warning"
                        title="Email or ID collides with another row in the file or an existing user — these rows are skipped on import"
                      >
                        {duplicateRows.length} duplicate{duplicateRows.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {errorRows.length > 0 && (
                      <span className="font-medium text-danger">
                        {errorRows.length} error{errorRows.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tick rows whose login credentials should be sent on Import.
                  </p>
                </div>

                {/* Preview table — checkbox per row, full list (scrollable) */}
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b border-border">
                          <th className="w-10 px-3 py-2 text-left">
                            <input
                              type="checkbox"
                              aria-label="Select all valid rows"
                              checked={allValidSelected}
                              onChange={toggleAll}
                              disabled={validRows.length === 0}
                              className="h-3.5 w-3.5 rounded border-border accent-portal-accent disabled:opacity-50"
                            />
                          </th>
                          <th className="px-2 py-2 text-left font-medium">Email</th>
                          <th className="px-2 py-2 text-left font-medium">Name</th>
                          <th className="px-2 py-2 text-left font-medium">Role</th>
                          <th className="px-2 py-2 text-left font-medium">Dept</th>
                          {/* ID No. column so the admin sees the IDs that
                              will be persisted before clicking Import. */}
                          <th className="px-2 py-2 text-left font-medium">ID No.</th>
                          <th className="px-2 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row, i) => (
                          <tr
                            key={i}
                            className={cn(
                              "border-b border-border last:border-0",
                              // Amber for duplicates (collision against file or
                              // existing DB), red for other validation errors,
                              // default otherwise. Distinct colours so the
                              // admin can spot duplicate batches at a glance.
                              row.duplicate && "bg-warning/10",
                              !row.valid && !row.duplicate && "bg-danger/5",
                            )}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                aria-label={
                                  row.valid
                                    ? `Issue credential for ${row.email}`
                                    : "Row has errors and cannot be imported"
                                }
                                checked={!!issueFor[i]}
                                onChange={() => toggleRow(i)}
                                disabled={!row.valid}
                                className="h-3.5 w-3.5 rounded border-border accent-portal-accent disabled:opacity-30"
                              />
                            </td>
                            <td className="max-w-[200px] truncate px-2 py-2">{row.email}</td>
                            <td className="max-w-[140px] truncate px-2 py-2">{row.firstName} {row.lastName}</td>
                            <td className="px-2 py-2">{row.role}</td>
                            <td className="max-w-[140px] truncate px-2 py-2">{row.department}</td>
                            <td className="max-w-[120px] truncate px-2 py-2 font-mono text-[11px]">
                              {row.idNo || <span className="text-muted-foreground/50">—</span>}
                            </td>
                            <td className="px-2 py-2">
                              {row.valid ? (
                                <span className="text-success">OK</span>
                              ) : row.duplicate ? (
                                <span className="font-medium text-warning" title={row.error}>
                                  Duplicate · skipped
                                </span>
                              ) : (
                                <span className="text-danger" title={row.error}>{row.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {bulkImport.isError && (
              <p className="text-xs text-danger">
                Failed to import users. Please check the file and try again.
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-success">{successMsg}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {parsedRows.length === 0
                ? "Upload a CSV to preview rows."
                : `Importing ${validRows.length} of ${parsedRows.length} · ${issuingCount} will receive credentials.`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={bulkImport.isPending || validRows.length === 0}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {bulkImport.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <Upload className="h-3.5 w-3.5" />
                Import {validRows.length > 0 ? `${validRows.length} user${validRows.length > 1 ? "s" : ""}` : "users"}
                {issuingCount > 0 && ` (${issuingCount} with credentials)`}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  // System status — drives the disable-with-tooltip state on every
  // create button (Create User, Import, Send Onboarding). Polled on a
  // 30s interval so a super-admin flipping the flag elsewhere shows up
  // here within a half-minute without a page refresh.
  const { blocked: createsBlocked, tooltip: createsBlockedTooltip } = useCreatesBlocked();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // (Status-toggle confirm state removed — toggle fires PATCH directly.)
  // Permanent-delete confirmation lives in its own slot so it can't collide
  // with the suspend/activate ConfirmDialog (different copy, different action).
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const deleteUserMutation = useDeleteUser();
  // In-place edit. The detail-route ([userId]/page.tsx) doesn't exist in this
  // project, so Edit opens a modal that writes via useUpdateUser().
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const updateUser = useUpdateUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onboardedFilter, setOnboardedFilter] = useState<"" | "true" | "false">("");
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [page, setPage] = useState(1);
  // Sort state, sent to the backend so sorting works across ALL pages
  // (TanStack Table's client-side sort only operates on the 20 rows
  // currently displayed — that's why the Last Login column appeared
  // broken: it sorted page 1, but the actually-recent logins lived on
  // pages 2+). Defaults match the backend's own default: created_at desc.
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isError, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    onboarded: onboardedFilter || undefined,
    page,
    pageSize: 20,
    sortBy,
    sortDir,
  });

  // One handler the column header click-targets can call: cycles direction
  // when the same column is clicked, switches column otherwise.
  const handleSort = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        // same column → flip direction
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      // different column → start descending (most recent / largest first)
      setSortDir("desc");
      return column;
    });
    setPage(1);
  }, []);

  const users = data?.users ?? [];

  // Export EVERY user in the tenant — not just the currently-displayed
  // page. Previously this exported the React Query slice (`users`) which
  // only contains the active pageSize=20 page, so admins were getting a
  // 20-row CSV regardless of how many tenants existed. Now we hit the
  // backend with pageSize=5000 (the same cap the offering picker uses)
  // and export the full result set. Honours the currently-applied
  // search/role/status filters so an admin can export e.g. "all inactive
  // faculty" by setting filters first, then clicking Export.
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("pageSize", "5000");
      params.set("page", "1");
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (onboardedFilter) params.set("onboarded", onboardedFilter);
      const res = await api.get<AdminUser[]>(
        `/api/admin/users?${params.toString()}`,
      );
      // Response shape is `{ data: AdminUser[], meta: {...} }`.
      const all = (res.data ?? []) as AdminUser[];
      if (!all.length) {
        toast.error("No users to export with the current filters.");
        return;
      }
      const headers = [
        "Name", "Email", "Role", "Department", "ID No.", "Status",
        "Onboarded", "Last Login", "Created",
      ];
      const rows = all.map((u) => [
        u.name,
        u.email,
        u.role,
        u.department,
        u.idNo || u.studentId || u.employeeId || "",
        u.status,
        u.welcomedAt ? "Yes" : "No",
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never",
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
      ]);
      // CSV escape: wrap each cell in quotes, double-up internal quotes.
      const escape = (v: unknown) =>
        `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [headers, ...rows]
        .map((r) => r.map(escape).join(","))
        .join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} user${all.length === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export failed");
    }
  }, [search, roleFilter, statusFilter, onboardedFilter]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRowClick = useCallback(
    (user: AdminUser) => {
      router.push(`/admin/users/${user.id}`);
    },
    [router]
  );

  // Inline toggle: flip status directly, no confirm dialog. Toggling OFF
  // sets status='inactive' which the backend treats as "locked out" —
  // login is rejected with 403 ACCOUNT_DEACTIVATED AND any live sessions
  // are revoked by the patch_user handler. Toggling ON reverses it.
  const handleToggleStatus = useCallback(async (user: AdminUser) => {
    const newStatus: AdminUser["status"] = user.status === "active" ? "inactive" : "active";
    try {
      await updateUser.mutateAsync({ id: user.id, status: newStatus });
      toast.success(
        newStatus === "inactive"
          ? `${user.name} deactivated — they can no longer sign in.`
          : `${user.name} reactivated — they can sign in again.`
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update user status");
    }
  }, [updateUser]);

  const sendOnboarding = useSendOnboardingEmails();

  const handleResendInvitation = useCallback(async (user: AdminUser) => {
    try {
      const res = await sendOnboarding.mutateAsync({ userIds: [user.id], forceReset: true });
      const r = res.data;
      if (r.sentCount > 0) toast.success(`Onboarding email sent to ${user.email}`);
      else toast.error(`Could not send onboarding email${r.failedCount > 0 ? ` (${r.failedCount} failed)` : ""}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to send onboarding email");
    }
  }, [sendOnboarding]);

  // "Revoke credentials" inactivates the account and clears welcomedAt so the
  // user can't sign in until the admin re-onboards them. Backend treats
  // status=inactive the same as a 403 ACCOUNT_DEACTIVATED on any future call.
  const handleRevoke = useCallback(async (user: AdminUser) => {
    if (!window.confirm(`Revoke credentials for ${user.name}? They will be signed out and locked until you re-send onboarding.`)) return;
    try {
      await updateUser.mutateAsync({ id: user.id, status: "inactive", welcomedAt: null });
      toast.success(`Credentials revoked for ${user.name}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to revoke credentials");
    }
  }, [updateUser]);

  // Hard delete handlers — open the confirmation, then on confirm fire the
  // DELETE /api/admin/users/{id} via useDeleteUser. The row is gone from
  // the DB once this succeeds; the cache invalidation drops it from the
  // table without a refetch flicker.
  const handleDelete = useCallback((user: AdminUser) => {
    setDeleteConfirm({ open: true, user });
  }, []);

  const executeDelete = useCallback(async () => {
    if (!deleteConfirm.user) return;
    try {
      await deleteUserMutation.mutateAsync(deleteConfirm.user.id);
      toast.success(`${deleteConfirm.user.name} deleted permanently`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete user");
    }
  }, [deleteConfirm.user, deleteUserMutation]);

  const columns = createUserColumns({
    onView: handleRowClick,
    onEdit: (user) => setEditUser(user),
    onToggleStatus: handleToggleStatus,
    onResendInvitation: handleResendInvitation,
    onRevoke: handleRevoke,
    onDelete: handleDelete,
    sortBy,
    sortDir,
    onSort: handleSort,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        title="Users"
        description="Manage users and access across the institution"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!users.length}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setImportOpen(true)}
              disabled={createsBlocked}
              title={createsBlocked ? createsBlockedTooltip : undefined}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={() => setOnboardOpen(true)}
              disabled={createsBlocked}
              title={createsBlocked ? createsBlockedTooltip : "Send login credentials to selected users"}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MailPlus className="h-4 w-4" />
              Send Onboarding
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              disabled={createsBlocked}
              title={createsBlocked ? createsBlockedTooltip : undefined}
              className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Create User
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search users..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={onboardedFilter}
          onChange={(e) => {
            setOnboardedFilter(e.target.value as "" | "true" | "false");
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
          title="Filter by whether the welcome email has been sent"
        >
          <option value="">All Onboarding</option>
          <option value="false">Not onboarded</option>
          <option value="true">Onboarded</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load users"
          message="Could not retrieve user data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            showSearch={false}
            showPagination={false}
            onRowClick={handleRowClick}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your search or filters, or create a new user."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} users)
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

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ImportUsersDialog open={importOpen} onOpenChange={setImportOpen} />
      <OnboardingDialog open={onboardOpen} onOpenChange={setOnboardOpen} />
      <EditUserDialog user={editUser} onClose={() => setEditUser(null)} />
      {/* Status confirm dialog removed — the active/inactive toggle in the
          Status column fires the PATCH directly with no confirm step,
          matching the user's "flip = lock immediately" request. */}

      {/* Permanent-delete confirmation — danger variant + email echoed
          back so the admin double-checks before wiping the row. */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(o) => setDeleteConfirm((p) => ({ ...p, open: o }))}
        title="Delete user permanently"
        description={
          deleteConfirm.user
            ? `Permanently delete "${deleteConfirm.user.name}" (${deleteConfirm.user.email})? This wipes the account from the database — sessions, ID No., onboarding history, all of it. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={executeDelete}
      />
    </div>
  );
}

/**
 * Bulk-onboarding dialog. Defaults the filter to "Not onboarded", lets the
 * admin tick/untick individual users (everyone is checked by default — they
 * exclude the ones they don't want), and POSTs the checked IDs to the
 * existing /api/admin/users/credential-emails endpoint, which generates a
 * temp password, emails it, and stamps welcomed_at.
 */
function OnboardingDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [scope, setScope] = useState<"" | "false" | "true">("false");
  const [search, setSearch] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAdminUsers({
    onboarded: scope || undefined,
    search: search || undefined,
    pageSize: 200,
  });
  const send = useSendOnboardingEmails();

  const allUsers = data?.users ?? [];
  // University admins are pre-onboarded by the super-admin (they get their
  // credentials at the platform level, not here), so they should NEVER show
  // up in this list — regardless of welcomedAt state. Same goes for any
  // super_admin row that might leak through.
  // The three roles a university admin actually onboards are: student,
  // faculty, placement (and research if the institution has it).
  const candidates = allUsers.filter(
    (u: AdminUser) => u.role !== "admin",
  );

  // Reset exclude set whenever the scope/search changes the candidate list.
  // (We re-key on candidate IDs so the user's existing un-checks stay sticky
  // for IDs that remain in the list, and only newly-removed IDs vanish.)
  const candidateIds = candidates.map((c) => c.id).join(",");
  React.useEffect(() => {
    setExcluded((prev) => new Set(Array.from(prev).filter((id) => candidateIds.includes(id))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateIds]);

  const checkedIds = candidates.filter((c) => !excluded.has(c.id)).map((c) => c.id);
  const allChecked = candidates.length > 0 && checkedIds.length === candidates.length;
  const noneChecked = checkedIds.length === 0;

  const toggleAll = () => {
    if (allChecked) {
      setExcluded(new Set(candidates.map((c) => c.id)));
    } else {
      setExcluded(new Set());
    }
  };
  const toggleOne = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onSubmit = async () => {
    if (noneChecked) return;
    try {
      const res = await send.mutateAsync({ userIds: checkedIds });
      const r = res.data;
      toast.success(
        `Sent ${r.sentCount}/${r.matchedCount} welcome emails`
        + (r.failedCount > 0 ? ` · ${r.failedCount} failed` : "")
        + (r.skippedCount > 0 ? ` · ${r.skippedCount} skipped` : ""),
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send onboarding emails");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg max-h-[85vh]">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold">Send onboarding emails</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                Each checked user will receive a fresh temporary password and a welcome
                email with the portal sign-in link. Unchecked users are skipped.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-3">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "" | "true" | "false")}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
            >
              <option value="false">Not onboarded</option>
              <option value="">All users</option>
              <option value="true">Already onboarded (re-send)</option>
            </select>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
            />
          </div>

          <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-2">
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
            >
              {allChecked ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              {allChecked ? "Clear all" : "Select all"}
            </button>
            <p className="text-xs text-muted-foreground">
              {checkedIds.length} of {candidates.length} will be emailed
              {excluded.size > 0 && ` · ${excluded.size} excluded`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No matching users.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {candidates.map((u: AdminUser) => {
                  const isChecked = !excluded.has(u.id);
                  return (
                    <li key={u.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(u.id)}
                        className="h-4 w-4 rounded border-border text-portal-accent focus:ring-portal-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email} · {u.role}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                          u.welcomedAt
                            ? "bg-success-50 text-success-700 ring-success-200 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/30"
                            : "bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/30",
                        )}
                      >
                        {u.welcomedAt ? "Onboarded" : "Pending"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-5 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={send.isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={send.isPending || noneChecked}
              className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {send.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Mail className="h-3.5 w-3.5" />
              Send {checkedIds.length > 0 ? checkedIds.length : ""}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * In-place edit modal. The detail-route variant ([userId]/page.tsx) doesn't
 * exist in this project, so the row's "Edit" action opens this modal instead
 * of navigating away. Edits the fields the admin commonly needs to change —
 * name, role, department, phone, and the role-specific identifiers.
 */
function EditUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const sendOnboarding = useSendOnboardingEmails();
  // Pull the active programmes — drives the Program dropdown and auto-fills
  // Department when a program is picked. Sourced from the same Programs &
  // Degrees page the admin manages, so any new program shows up here once
  // they hit "Create Program".
  const { data: programsData } = usePrograms({ status: "active" });
  const activePrograms = useMemo(() => programsData?.data ?? [], [programsData]);
  // Canonical dept list = distinct, case-folded departments observed on
  // active programmes. Backs the new Department dropdown so admins can
  // only assign users to departments that actually have programmes
  // (prevents future fragmentation: no more "CS" vs "Computer Science").
  const canonicalDepts = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of activePrograms) {
      const d = (p.department || "").trim();
      if (!d) continue;
      const k = d.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(d);
    }
    return out.sort((a, b) => a.localeCompare(b));
  }, [activePrograms]);
  const [form, setForm] = useState({
    name: "", email: "", role: "student" as PortalRole,
    status: "active" as AdminUser["status"],
    department: "", phone: "",
    // Unified ID No. — single field replaces studentId/employeeId.
    idNo: "", program: "", designation: "", specialization: "",
    // Current semester drives the picker's Year of Study filter via
    // `ceil(currentSemester / 2)`. Stored as a string so the <select>
    // round-trips cleanly. Empty string = "unset".
    currentSemester: "",
  });
  const [error, setError] = useState("");
  // When the admin saves with a changed email, we keep the drawer open and
  // ask whether they also want to send onboarding (since the user's old JWT
  // is now invalid and the new email is the one they must sign in with).
  // null = no prompt; "ask" = changed email, awaiting decision.
  const [emailPrompt, setEmailPrompt] = useState<null | "ask">(null);

  React.useEffect(() => {
    if (!user) return;
    // Snap the saved program string to a canonical entry in the active
    // programs list using a case-insensitive match. Without this snap,
    // a saved value like "btech cse" (lowercase, legacy data) would NOT
    // match the <option value="BTech CSE"> rendered by the dropdown — and
    // the field would show "— Select a program —" on open, making the
    // admin think the value was never saved. With the snap, the dropdown
    // pre-selects the canonical option and the underlying value silently
    // upgrades to the correct casing on save.
    const savedProgram = (user.program || "").trim();
    const canonicalProgram = savedProgram
      ? (programsData?.data ?? []).find(
          (p) => p.name.toLowerCase() === savedProgram.toLowerCase(),
        )?.name ?? savedProgram
      : "";
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      status: user.status,
      department: user.department || "",
      phone: user.phone || "",
      // Hydrate unified ID No. from whichever legacy field carries it.
      idNo: user.idNo || user.studentId || user.employeeId || "",
      program: canonicalProgram,
      designation: user.designation || "",
      specialization: user.specialization || "",
      currentSemester: user.currentSemester || "",
    });
    setError("");
    setEmailPrompt(null);
    updateUser.reset();
    sendOnboarding.reset();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Core save — does NOT send onboarding. Returns true on success so the
  // caller can decide whether to close, prompt for onboarding, or both.
  const saveCore = async (): Promise<boolean> => {
    if (!user) return false;
    if (!form.name.trim()) { setError("Name is required."); return false; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Email is invalid."); return false;
    }
    if (!form.department.trim()) { setError("Department is required."); return false; }
    if ((form.role === "student" || form.role === "faculty") && !form.idNo.trim()) {
      setError(`ID No. is required for ${form.role}s.`); return false;
    }
    try {
      // Only send email when it actually changed — saves a server-side
      // collision check on the unchanged-email re-save case.
      const emailChanged = form.email.trim().toLowerCase() !== (user.email || "").toLowerCase();
      const statusChanged = form.status !== user.status;
      await updateUser.mutateAsync({
        id: user.id,
        name: form.name.trim(),
        ...(emailChanged ? { email: form.email.trim() } : {}),
        role: form.role,
        ...(statusChanged ? { status: form.status } : {}),
        department: form.department.trim(),
        phone: form.phone.trim() || undefined,
        // Unified ID No. — sent for student/faculty; cleared for other roles.
        idNo: (form.role === "student" || form.role === "faculty")
          ? form.idNo.trim()
          : undefined,
        program: form.role === "student" ? form.program.trim() || undefined : undefined,
        designation: form.role === "faculty" ? form.designation.trim() || undefined : undefined,
        specialization: form.role === "faculty" ? form.specialization.trim() || undefined : undefined,
        // Year of Study drives currentSemester (year×2 - 1, mid-year). Sent
        // only for students. Empty string means "clear it" so the admin can
        // un-set a value they no longer trust.
        currentSemester: form.role === "student" ? (form.currentSemester || "") : undefined,
      });
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user.");
      return false;
    }
  };

  // Click handler for the primary Save button. If email changed, defer
  // closing and prompt for onboarding. Otherwise just save + close.
  const onSave = async () => {
    if (!user) return;
    const emailChanged = form.email.trim().toLowerCase() !== (user.email || "").toLowerCase();
    if (emailChanged) {
      // Don't write yet — ask the admin first.
      setEmailPrompt("ask");
      return;
    }
    const ok = await saveCore();
    if (ok) { toast.success(`${form.name} updated`); onClose(); }
  };

  // From the email-changed prompt: "Save only" — persist the changes but
  // don't dispatch onboarding. The user's old JWT is already invalid as soon
  // as the email column flips, so they're effectively signed out.
  const saveOnly = async () => {
    if (!user) return;
    const ok = await saveCore();
    if (!ok) return;
    toast.success(
      `${form.name} updated. The user is signed out — they'll need the new email to sign in.`,
    );
    onClose();
  };

  // From the email-changed prompt: "Save & send onboarding" — persist, then
  // re-issue a temp password and email the NEW address. This is the right
  // call when the email change was driven by the user (e.g. switched
  // institutions); they get a fresh credential to sign in with right away.
  // Profile data (name, role, department, IDs) is preserved — only the
  // email and password are touched.
  const saveAndOnboard = async () => {
    if (!user) return;
    const ok = await saveCore();
    if (!ok) return;
    try {
      const res = await sendOnboarding.mutateAsync({ userIds: [user.id], forceReset: true });
      const r = res.data;
      if (r.sentCount > 0) {
        toast.success(`${form.name} updated. Onboarding email sent to ${form.email.trim()}.`);
      } else {
        toast.error(
          `${form.name} updated, but onboarding email failed${r.failedCount > 0 ? ` (${r.failedCount})` : ""}.`,
        );
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Onboarding email failed to send.");
    }
    onClose();
  };

  if (!user) return null;
  // Side-panel pattern (admin asked for "side editing panel"). Same form,
  // moved into a right-edge SlideDrawer so it doesn't obscure the user list
  // and the Cancel/Save buttons live in a sticky footer.
  return (
    <SlideDrawer
      open={!!user}
      onClose={onClose}
      width="lg"
      title="Edit User"
      description={`Update ${user.email}. Every field below is editable — changing the email triggers a confirmation prompt.`}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={updateUser.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={updateUser.isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {updateUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      }
    >
      <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as PortalRole })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                >
                  {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Email is editable. Backend revalidates the address (Pydantic
                EmailStr) and rejects with EMAIL_TAKEN if another account
                already owns it. Changing the email does NOT auto-send a
                confirmation — the admin should follow up with "Re-send
                credentials" from the row 3-dots if needed. */}
            <div>
              <label className="mb-1 block text-xs font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@institution.edu"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Changing the email signs the user out everywhere; ask them to use the new address on next sign-in.
              </p>
            </div>

            {/* Status — editable from the drawer too. Setting "suspended" or
                "inactive" immediately revokes the user's sessions when the
                PATCH commits (backend revoke_all_login_sessions). */}
            <div>
              <label className="mb-1 block text-xs font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AdminUser["status"] })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Department was free-text; now a dropdown of canonical
                department names sourced from active programmes. Prevents
                future fragmentation like CS vs Computer Science vs BTech.
                Legacy values not in the catalog still render in the list
                (tagged "legacy") so an admin can save without losing the
                stored value if a programme was renamed. */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                >
                  <option value="">— Select a department —</option>
                  {form.department && !canonicalDepts.includes(form.department) && (
                    <option value={form.department}>{form.department} (legacy)</option>
                  )}
                  {canonicalDepts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="optional"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                />
              </div>
            </div>

            {form.role === "student" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">ID No.</label>
                    <input
                      value={form.idNo}
                      onChange={(e) => setForm({ ...form, idNo: e.target.value })}
                      placeholder="e.g. STU-2024-001"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                    />
                  </div>
                  {/* Program — dropdown sourced from active programmes on the
                      Programs & Degrees page. Picking a program rewrites the
                      Department field above to the program's own dept so the
                      two stay in sync. Free-text "Other…" is intentionally
                      omitted here — admins should land on a programme that
                      exists in the catalog. To enter a brand-new one, go
                      create it on Programs & Degrees first. */}
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Program <span className="text-muted-foreground/70">(picks Department)</span>
                    </label>
                    <select
                      value={form.program}
                      onChange={(e) => {
                        const programName = e.target.value;
                        const matched = activePrograms.find((p) => p.name === programName);
                        setForm((prev) => ({
                          ...prev,
                          program: programName,
                          // Auto-link the department whenever a program is
                          // chosen. If the admin then wants a different dept,
                          // they can still type into the Department field
                          // above — the link only fires on this select change.
                          department: matched?.department ?? prev.department,
                        }));
                      }}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                    >
                      <option value="">— Select a program —</option>
                      {/* Render whatever's saved on the user (even if it no
                          longer exists in the catalog) so legacy values stay
                          visible instead of silently disappearing on edit. */}
                      {form.program && !activePrograms.some((p) => p.name === form.program) && (
                        <option value={form.program}>{form.program} (legacy)</option>
                      )}
                      {activePrograms.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.code ? `${p.code} · ${p.name}` : p.name} — {p.department}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Year of Study — drives the OfferingDrawer's per-year
                    bucketing. Stored as `currentSemester` (year×2 - 1, picking
                    the odd "mid-year" semester) so legacy fields stay
                    consistent. UG/PG max years are derived from the picked
                    program when possible, falling back to 6. */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Year of Study</label>
                    {(() => {
                      const prog = activePrograms.find((p) => p.name === form.program);
                      const maxYears = prog?.duration ?? 6;
                      const cs = parseInt(form.currentSemester || "", 10);
                      const currentYear = Number.isFinite(cs) && cs >= 1 ? Math.ceil(cs / 2) : "";
                      return (
                        <select
                          value={String(currentYear)}
                          onChange={(e) => {
                            const y = e.target.value;
                            // Empty → clear; otherwise pick odd semester
                            // (year * 2 - 1) so an admin who chose "Year 2"
                            // gets semester 3 stored (the first half of Y2).
                            setForm({
                              ...form,
                              currentSemester: y ? String(parseInt(y, 10) * 2 - 1) : "",
                            });
                          }}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                        >
                          <option value="">— Not set —</option>
                          {Array.from({ length: maxYears }, (_, i) => (
                            <option key={i + 1} value={String(i + 1)}>Year {i + 1}</option>
                          ))}
                        </select>
                      );
                    })()}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Drives the per-year breakdown in the offering picker. Leave unset if you're not sure — the picker bucketizes those under &quot;Year unset&quot;.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {form.role === "faculty" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">ID No.</label>
                    <input
                      value={form.idNo}
                      onChange={(e) => setForm({ ...form, idNo: e.target.value })}
                      placeholder="e.g. FAC-2024-001"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Designation</label>
                    <select
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                    >
                      <option value="">—</option>
                      {DESIGNATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Specialization</label>
                  <input
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="e.g. Machine Learning"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            {/* Email-change confirmation prompt. We don't write to the DB
                until the admin picks one of the two paths — that way "Save
                only" and "Save & send onboarding" both go through the same
                validation. Profile data is preserved either way; only the
                email is touched in saveOnly, and the onboarding email is an
                extra step on top in saveAndOnboard. */}
            {emailPrompt === "ask" && user && (
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Email changing: <span className="font-mono">{user.email}</span> → <span className="font-mono">{form.email.trim()}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The user&apos;s existing sign-in is invalidated immediately. Their profile data
                    (role, department, IDs) stays the same — only the email changes. Send an
                    onboarding email so they can sign in with the new address?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveAndOnboard}
                    disabled={updateUser.isPending || sendOnboarding.isPending}
                    className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50"
                  >
                    {(updateUser.isPending || sendOnboarding.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Send className="h-3.5 w-3.5" />
                    Save & send onboarding
                  </button>
                  <button
                    type="button"
                    onClick={saveOnly}
                    disabled={updateUser.isPending || sendOnboarding.isPending}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Save only
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailPrompt(null)}
                    disabled={updateUser.isPending || sendOnboarding.isPending}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
    </SlideDrawer>
  );
}
