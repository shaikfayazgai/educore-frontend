"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  Loader2,
  X,
  ChevronRight,
  ChevronDown,
  Pencil,
  CalendarDays,
  Trash2,
  GraduationCap,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { ApiError } from "@/admin/lib/api/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import {
  useAcademicYears,
  useCreateAcademicYear,
  usePromoteAcademicYear,
  useUpdateNestedSemester,
  usePrograms,
  useProgrammeAcademicYears,
  useCreateProgrammeAcademicYears,
  useUpdateProgrammeAcademicYear,
  useDeleteProgrammeAcademicYear,
} from "@/admin/lib/hooks/use-admin";
import {
  createAcademicYearSchema,
  type CreateAcademicYearFormData,
} from "@/admin/lib/schemas/admin.schema";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { FormField } from "@/admin/components/shared/forms/form-field";
import { formatDate } from "@/admin/lib/utils/format";
import { cn } from "@/admin/lib/utils/cn";
import type { AcademicYear, Semester } from "@/admin/lib/api/types/admin.types";

/** Feature flag for the year-end promotion banner + button on each AY.
 *  Hidden for now per admin's request. Flip to `true` to re-enable the
 *  "Promote early / Promote now / Re-run promotion" affordance and its
 *  confirmation dialog without touching any other code. */
const SHOW_YEAR_END_PROMOTION = false;

function getStatusVariant(
  status: "upcoming" | "active" | "completed"
): "info" | "success" | "muted" {
  const map = {
    upcoming: "info" as const,
    active: "success" as const,
    completed: "muted" as const,
  };
  return map[status];
}

/* ── Create Academic Year Dialog ────────────────────────────────────────── */

function CreateAcademicYearDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createYear = useCreateAcademicYear();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearFormData>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "" },
  });

  const onSubmit = useCallback(
    async (data: CreateAcademicYearFormData) => {
      try {
        await createYear.mutateAsync(data);
        setSuccessMsg(
          `${data.name} created with two semesters (Fall + Spring). Adjust dates as needed.`
        );
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 1500);
      } catch {
        // shown via mutation state
      }
    },
    [createYear, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Create Academic Year
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Two semesters (Fall + Spring) will be auto-created. You can edit each semester&apos;s dates afterwards.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              label="Academic Year Name"
              placeholder="e.g. AY 2026-2027"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Start Date"
                type="date"
                error={errors.startDate?.message}
                required
                {...register("startDate")}
              />
              <FormField
                label="End Date"
                type="date"
                error={errors.endDate?.message}
                required
                {...register("endDate")}
              />
            </div>

            {createYear.isError && (
              <p className="text-xs text-danger">
                Failed to create academic year. Please check the details.
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-success">{successMsg}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createYear.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {createYear.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create Year
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Edit Semester Dialog ──────────────────────────────────────────────── */

function EditSemesterDialog({
  open,
  onOpenChange,
  semester,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semester: Semester | null;
}) {
  const updateSemester = useUpdateNestedSemester();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (semester && open) {
      setName(semester.name);
      setStartDate(semester.startDate);
      setEndDate(semester.endDate);
      setError("");
    }
  }, [semester, open]);

  const handleSave = useCallback(async () => {
    if (!semester) return;
    setError("");
    if (!name || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }
    try {
      await updateSemester.mutateAsync({
        id: semester.id,
        name,
        startDate,
        endDate,
      });
      toast.success(`${name} updated`);
      onOpenChange(false);
    } catch {
      setError("Failed to update semester");
    }
  }, [semester, name, startDate, endDate, updateSemester, onOpenChange]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setName("");
          setStartDate("");
          setEndDate("");
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Edit Semester
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Update semester details. Status is auto-derived from dates.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Semester Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="e.g. Fall 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateSemester.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {updateSemester.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Year Row ──────────────────────────────────────────────────────────── */

function YearRow({
  year,
  expanded,
  onToggle,
  onEditSemester,
}: {
  year: AcademicYear;
  expanded: boolean;
  onToggle: () => void;
  onEditSemester: (sem: Semester) => void;
}) {
  const totalCourses = year.semesters.reduce((sum, s) => sum + s.courseCount, 0);
  // Year-end promotion state — drives the banner inside the expanded body.
  // The lazy auto-run on list_academic_years already handles AYs whose
  // end_date passed (next page load fires it). This button lets the admin
  // trigger early or re-run.
  const promoteYear = usePromoteAcademicYear();
  const [promoteConfirm, setPromoteConfirm] = useState(false);
  const router = useRouter();
  const endDateInPast = useMemo(() => {
    if (!year.endDate) return false;
    return new Date(year.endDate) < new Date(new Date().toDateString());
  }, [year.endDate]);
  const isPromoted = !!year.promotedAt;

  const handlePromote = useCallback(async () => {
    try {
      const res = await promoteYear.mutateAsync(year.id);
      const r = res.data;
      toast.success(
        `${year.name}: ${r.promoted} student${r.promoted === 1 ? "" : "s"} promoted` +
          (r.graduated > 0
            ? `, ${r.graduated} graduated (capped at programme end)`
            : ""),
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not run promotion.");
    }
  }, [promoteYear, year.id, year.name]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Year header */}
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-[24px_2fr_1fr_1fr_120px] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-base font-semibold">{year.name}</p>
          <p className="text-xs text-muted-foreground">
            {year.semesters.length} semester{year.semesters.length !== 1 ? "s" : ""} · {totalCourses} course{totalCourses !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(year.startDate)} → {formatDate(year.endDate)}
        </p>
        <div />
        <div className="flex justify-end">
          <StatusBadge variant={getStatusVariant(year.status)} dot>
            {year.status}
          </StatusBadge>
        </div>
      </button>

      {/* Nested semesters */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-5 py-3">
          {SHOW_YEAR_END_PROMOTION && (
            // Year-end promotion banner. Three states:
            //   * Promoted → green "Promoted N · Graduated N on DATE" with re-run option
            //   * End date passed, not yet promoted → amber call-to-action
            //   * End date still in the future → idle, gives early-promote
            //     button + a warning copy on the confirm dialog
            <div className={cn(
              "mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-xs",
              isPromoted && "border-success/30 bg-success-light/40",
              !isPromoted && endDateInPast && "border-warning/40 bg-warning-light/40",
              !isPromoted && !endDateInPast && "border-border bg-background",
            )}>
              <div className="flex items-start gap-2">
                {isPromoted ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  {isPromoted ? (
                    <>
                      <p className="font-medium text-success">
                        Year-end promotion done · {year.promotedCount ?? 0} promoted
                        {(year.graduatedCount ?? 0) > 0 && ` · ${year.graduatedCount} graduated`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Ran on {year.promotedAt ? formatDate(year.promotedAt) : "—"}.
                        Students moved one year forward; programme-finishers were marked inactive.
                      </p>
                    </>
                  ) : endDateInPast ? (
                    <>
                      <p className="font-medium text-warning">Year-end promotion pending</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        End date passed — students mapped to this AY haven&apos;t been moved to the next year yet.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Year-end promotion</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Auto-fires the day after {formatDate(year.endDate)}. You can also run it early if needed.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoteConfirm(true)}
                disabled={promoteYear.isPending}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                  isPromoted
                    ? "border-border bg-background hover:bg-muted"
                    : endDateInPast
                      ? "border-warning/40 bg-warning text-warning-foreground hover:bg-warning/90"
                      : "border-border bg-background hover:bg-muted",
                )}
              >
                {promoteYear.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {isPromoted ? "Re-run promotion" : endDateInPast ? "Promote now" : "Promote early"}
              </button>
            </div>
          )}

          {year.semesters.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              No semesters under this academic year.
            </p>
          ) : (
            <div className="space-y-2">
              {year.semesters.map((sem) => (
                <div
                  key={sem.id}
                  className="grid grid-cols-[2fr_1fr_1fr_80px_60px] items-center gap-3 rounded-lg bg-background px-4 py-3 ring-1 ring-border/50"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{sem.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                  </p>
                  {/* Course count is now a button — clicking opens the
                      semester-level drill-down (all programmes' courses
                      in this semester). Disabled when count is 0 so the
                      hover state doesn't suggest there's anything to see. */}
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/semesters/courses?semester=${sem.id}`)}
                    disabled={sem.courseCount === 0}
                    title={sem.courseCount === 0 ? "No courses yet" : `View ${sem.courseCount} course${sem.courseCount === 1 ? "" : "s"}`}
                    className="flex w-fit cursor-pointer items-center rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                  >
                    <span className={cn(
                      "font-medium text-portal-accent",
                      sem.courseCount > 0 && "underline-offset-2 hover:underline",
                    )}>
                      {sem.courseCount}
                    </span>
                    <span className="ml-1 text-muted-foreground">courses</span>
                  </button>
                  <StatusBadge variant={getStatusVariant(sem.status)} dot>
                    {sem.status}
                  </StatusBadge>
                  <div className="flex justify-end">
                    <button
                      onClick={() => onEditSemester(sem)}
                      className={cn(
                        "rounded-lg p-1.5 transition-colors hover:bg-muted text-muted-foreground hover:text-foreground",
                        sem.status === "completed" && "opacity-50 pointer-events-none"
                      )}
                      title={sem.status === "completed" ? "Cannot edit completed semester" : "Edit semester"}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Programme × this AY mapping panel — multi-select programmes that
              run in this academic year. Each mapping can carry its own
              start/end dates so a programme can have a different calendar
              from the rest. */}
          <ProgrammeMappingPanel
            yearId={year.id}
            yearName={year.name}
            yearStartDate={year.startDate}
            yearEndDate={year.endDate}
            semesters={year.semesters}
          />
        </div>
      )}

      {SHOW_YEAR_END_PROMOTION && (
        // Year-end promotion confirmation. Copy adapts to the three states:
        //   re-run (already promoted), normal (end_date past), and early
        //   (end_date still future) — the third explicitly warns the admin.
        <ConfirmDialog
          open={promoteConfirm}
          onOpenChange={setPromoteConfirm}
          title={isPromoted ? "Re-run year-end promotion" : "Promote students to next year"}
          description={
            isPromoted
              ? `Re-run promotion for ${year.name}? Every eligible student will be bumped one year forward (sem+2) AGAIN. Use this only if the previous run was incorrect — there's no undo.`
              : !endDateInPast
                ? `${year.name} ends on ${formatDate(year.endDate)} — that's still in the future. Promote anyway? Every student mapped to this AY will move one year forward (sem+2); programme-finishers will be marked inactive.`
                : `Promote students for ${year.name}? Every student mapped to this AY moves one year forward (sem+2). Students whose programme has ended will be marked inactive. This cannot be undone in bulk.`
          }
          confirmLabel={isPromoted ? "Re-run promotion" : "Promote now"}
          variant={isPromoted ? "default" : "danger"}
          onConfirm={handlePromote}
        />
      )}
    </div>
  );
}

type SemBinding = "ay" | "custom";


/** Per-row UI for one programme×AY mapping.
 *
 * Layout: | Programme | Sem 1 dropdown | Sem 2 dropdown | Courses | Delete |
 *
 * Each Sem cell has its OWN dropdown with two options:
 *   - "Use AY semester dates" (default — inherits that AY semester's range)
 *   - "Use custom dates"
 *
 * When EITHER dropdown is set to custom, an inline row expands below the
 * row showing FOUR date inputs (Sem 1 Start/End, Sem 2 Start/End) plus
 * a Set Duration button. Set Duration commits the dates into the pending
 * buffer; the row turns amber and the sticky save bar at the bottom of
 * the page surfaces Save / Discard.
 *
 * Data note: the mapping row carries a single (start_date, end_date)
 * range. When the admin sets all four custom fields, we persist
 * start_date = Sem 1 Start and end_date = Sem 2 End. Sem 1 End and
 * Sem 2 Start are kept as ephemeral local state so the input mental
 * model stays per-semester — formally extending the schema to per-sem
 * mappings is a separate change.
 */
function MappingRow({
  mapping,
  semesters,
  yearStartDate,
  yearEndDate,
  isDirty,
  onLocalUpdate,
  onDelete,
}: {
  mapping: {
    id: string;
    programmeName: string;
    department: string;
    startDate: string | null;
    endDate: string | null;
    courseCount?: number;
  };
  semesters: Semester[];
  yearStartDate: string;
  yearEndDate: string;
  isDirty: boolean;
  onLocalUpdate: (patch: { startDate: string; endDate: string }) => void;
  onDelete: () => void;
}) {
  const sem1 = semesters[0];
  const sem2 = semesters[1];

  // Derive the current binding for each cell from the stored dates.
  // Sem 1 "custom" iff mapping.start_date diverges from sem1.startDate;
  // Sem 2 "custom" iff mapping.end_date diverges from sem2.endDate.
  const initialSem1: SemBinding =
    sem1 && (mapping.startDate || "") && (mapping.startDate || "") !== sem1.startDate ? "custom" : "ay";
  const initialSem2: SemBinding =
    sem2 && (mapping.endDate || "") && (mapping.endDate || "") !== sem2.endDate ? "custom" : "ay";

  const [sem1Binding, setSem1Binding] = useState<SemBinding>(initialSem1);
  const [sem2Binding, setSem2Binding] = useState<SemBinding>(initialSem2);
  useEffect(() => { setSem1Binding(initialSem1); }, [initialSem1]);
  useEffect(() => { setSem2Binding(initialSem2); }, [initialSem2]);

  // Local state for the four custom date inputs. Only Sem 1 Start and
  // Sem 2 End ultimately persist; the middle two help the admin reason
  // about each semester's span at a glance.
  const seedSem1Start = mapping.startDate || sem1?.startDate || "";
  const seedSem1End = sem1?.endDate || "";
  const seedSem2Start = sem2?.startDate || "";
  const seedSem2End = mapping.endDate || sem2?.endDate || "";
  const [s1Start, setS1Start] = useState(seedSem1Start);
  const [s1End, setS1End] = useState(seedSem1End);
  const [s2Start, setS2Start] = useState(seedSem2Start);
  const [s2End, setS2End] = useState(seedSem2End);
  useEffect(() => {
    setS1Start(mapping.startDate || sem1?.startDate || "");
    setS1End(sem1?.endDate || "");
    setS2Start(sem2?.startDate || "");
    setS2End(mapping.endDate || sem2?.endDate || "");
  }, [mapping.startDate, mapping.endDate, sem1?.startDate, sem1?.endDate, sem2?.startDate, sem2?.endDate]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3500);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  // Course drill-down → navigate to the dedicated overview page. Sharing
  // the page route across both modes (semester and programme×AY) gives
  // the admin browser-history navigation (Back button works naturally).
  const router = useRouter();

  // Editor visibility — closed by default so previously-saved custom rows
  // don't blow open on every render. Opens when the admin picks "Custom
  // dates…" from a dropdown, closes on a successful Set Duration, and
  // toggles when the pencil button is clicked.
  const [customEditorOpen, setCustomEditorOpen] = useState(false);
  const anyCustom = sem1Binding === "custom" || sem2Binding === "custom";
  const customExpanded = anyCustom && customEditorOpen;

  // Resolve the final (start, end) given current dropdown choices.
  // AY-mode cells inherit their semester's range; custom-mode cells use
  // the local input values.
  const resolveDates = (overrides?: {
    sem1?: SemBinding;
    sem2?: SemBinding;
    s1Start?: string; s2End?: string;
  }): { startDate: string; endDate: string } => {
    const b1 = overrides?.sem1 ?? sem1Binding;
    const b2 = overrides?.sem2 ?? sem2Binding;
    const startDate = b1 === "ay"
      ? (sem1?.startDate || "")
      : (overrides?.s1Start ?? s1Start);
    const endDate = b2 === "ay"
      ? (sem2?.endDate || "")
      : (overrides?.s2End ?? s2End);
    return { startDate, endDate };
  };

  // Set Duration is disabled while the resolved dates are identical to
  // the row's current values — pressing it would be a no-op.
  const resolvedForCheck = resolveDates();
  const setDurationDisabled =
    resolvedForCheck.startDate === (mapping.startDate || "") &&
    resolvedForCheck.endDate === (mapping.endDate || "");

  const onSemChange = (cell: 1 | 2, val: SemBinding) => {
    if (cell === 1) setSem1Binding(val);
    else setSem2Binding(val);
    if (val === "custom") {
      // Picking custom for the first time (or switching from AY) opens
      // the inline editor automatically.
      setCustomEditorOpen(true);
      return;
    }
    // val === "ay" — auto-commit and close the editor if neither cell is
    // custom any more.
    const otherBinding = cell === 1 ? sem2Binding : sem1Binding;
    if (otherBinding !== "custom") setCustomEditorOpen(false);
    const next = resolveDates(cell === 1 ? { sem1: val } : { sem2: val });
    onLocalUpdate(next);
  };

  // Inline error message for the 4-field editor. Replaces the old toast
  // pattern so feedback sits next to the input that caused the problem.
  // Cleared automatically when the admin types — typing implies they're
  // fixing it; nagging on every keystroke would be hostile.
  const [dateError, setDateError] = useState<string | null>(null);
  useEffect(() => {
    setDateError(null);
  }, [s1Start, s1End, s2Start, s2End, sem1Binding, sem2Binding]);

  /** Validation per the admin-friendly spec:
   *   - End ≥ start within each custom semester (rule 6)
   *   - All filled custom dates must fall within the AY range (rule 6)
   *   - The values we actually persist (Sem 1 Start when Sem 1 is custom,
   *     Sem 2 End when Sem 2 is custom) must be set — otherwise we'd
   *     try to PATCH NULL into the DB.
   *
   *   Explicitly NOT enforced:
   *   - Sem 1 End ≤ Sem 2 Start (admin may want overlap or gaps)
   *   - Any overlap / cross-row constraints
   *   - Max duration / "must be exactly one semester long" rules
   */
  const setDuration = () => {
    const inRange = (d: string) =>
      !d || (d >= yearStartDate && d <= yearEndDate);

    if (sem1Binding === "custom" && !s1Start) {
      setDateError("Sem 1 Start is required.");
      return;
    }
    if (sem2Binding === "custom" && !s2End) {
      setDateError("Sem 2 End is required.");
      return;
    }
    if (sem1Binding === "custom" && s1End && s1End < s1Start) {
      setDateError("Sem 1 end can't be before Sem 1 start.");
      return;
    }
    if (sem2Binding === "custom" && s2End && s2Start && s2End < s2Start) {
      setDateError("Sem 2 end can't be before Sem 2 start.");
      return;
    }
    const outside =
      (sem1Binding === "custom" && (!inRange(s1Start) || !inRange(s1End))) ||
      (sem2Binding === "custom" && (!inRange(s2Start) || !inRange(s2End)));
    if (outside) {
      setDateError(
        `Dates must fall between ${formatDate(yearStartDate)} and ${formatDate(yearEndDate)}.`,
      );
      return;
    }
    setDateError(null);
    onLocalUpdate(resolveDates());
    // Collapse the editor after a successful commit so the row goes
    // back to a one-line layout. Pencil button (or re-picking custom)
    // re-opens it.
    setCustomEditorOpen(false);
  };

  return (
    <div
      className={cn(
        "rounded-md bg-card px-3 py-2.5 ring-1 transition-colors",
        isDirty ? "ring-warning/50 bg-warning-light/30" : "ring-border/50 hover:bg-muted/20",
      )}
    >
      <div
        className="grid items-center gap-3"
        style={{ gridTemplateColumns: "2fr minmax(160px, 1.2fr) minmax(160px, 1.2fr) 110px 48px" }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{mapping.programmeName}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{mapping.department}</p>
        </div>
        <div className="flex items-center gap-1">
          <select
            value={sem1Binding}
            onChange={(e) => onSemChange(1, e.target.value as SemBinding)}
            disabled={!sem1}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-portal-accent disabled:opacity-50"
          >
            <option value="ay">{sem1 ? sem1.name : "Sem 1"}</option>
            <option value="custom">
              {s1Start && s1End
                ? `${formatDate(s1Start)} → ${formatDate(s1End)}`
                : "Set custom dates…"}
            </option>
          </select>
          {sem1Binding === "custom" && (
            <button
              type="button"
              onClick={() => setCustomEditorOpen((v) => !v)}
              title={customEditorOpen ? "Hide custom date editor" : "Edit Sem 1 custom dates"}
              className={cn(
                "shrink-0 rounded-md border p-1.5 transition-colors",
                customEditorOpen
                  ? "border-portal-accent bg-portal-accent-light text-portal-accent"
                  : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <select
            value={sem2Binding}
            onChange={(e) => onSemChange(2, e.target.value as SemBinding)}
            disabled={!sem2}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-portal-accent disabled:opacity-50"
          >
            <option value="ay">{sem2 ? sem2.name : "Sem 2"}</option>
            <option value="custom">
              {s2Start && s2End
                ? `${formatDate(s2Start)} → ${formatDate(s2End)}`
                : "Set custom dates…"}
            </option>
          </select>
          {sem2Binding === "custom" && (
            <button
              type="button"
              onClick={() => setCustomEditorOpen((v) => !v)}
              title={customEditorOpen ? "Hide custom date editor" : "Edit Sem 2 custom dates"}
              className={cn(
                "shrink-0 rounded-md border p-1.5 transition-colors",
                customEditorOpen
                  ? "border-portal-accent bg-portal-accent-light text-portal-accent"
                  : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push(`/admin/semesters/courses?mapping=${mapping.id}`)}
          title="View course details for this programme"
          className="flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
        >
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium underline-offset-2 hover:underline">
            {mapping.courseCount ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground">
            course{mapping.courseCount === 1 ? "" : "s"}
          </span>
        </button>
        <div className="flex items-center justify-end">
          {confirmDelete ? (
            <button
              type="button"
              onKeyDown={(e) => { if (e.key === "Escape") setConfirmDelete(false); }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1 rounded-md bg-danger px-2 py-1 text-[10px] font-semibold text-danger-foreground shadow-sm"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-danger/10 hover:text-danger"
              title="Unmap programme from this academic year"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* Inline custom-dates editor. Appears as soon as either Sem cell's
          dropdown is set to "Use custom dates". The four fields let the
          admin think per-semester even though only Sem 1 Start and Sem 2
          End ultimately persist (schema constraint). */}
      {customExpanded && (
        <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DateField
              label="Sem 1 Start"
              value={s1Start}
              disabled={sem1Binding !== "custom"}
              onChange={setS1Start}
            />
            <DateField
              label="Sem 1 End"
              value={s1End}
              disabled={sem1Binding !== "custom"}
              onChange={setS1End}
            />
            <DateField
              label="Sem 2 Start"
              value={s2Start}
              disabled={sem2Binding !== "custom"}
              onChange={setS2Start}
            />
            <DateField
              label="Sem 2 End"
              value={s2End}
              disabled={sem2Binding !== "custom"}
              onChange={setS2End}
            />
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <p className={cn(
              "mr-auto text-[10px]",
              dateError ? "text-danger font-medium" : "text-muted-foreground",
            )}>
              {dateError ?? "Disabled fields inherit the AY semester dates."}
            </p>
            <button
              type="button"
              onClick={setDuration}
              disabled={setDurationDisabled}
              title={setDurationDisabled ? "No changes to apply" : "Apply these dates"}
              className="flex items-center gap-1 rounded-md bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-3 w-3" />
              Set Duration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small labelled date input — same look across the row's custom editor
 *  and the Add-programmes custom row. */
function DateField({
  label, value, disabled, onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-portal-accent disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      />
    </label>
  );
}

/** Dropdown picker for the "Add programmes" section.
 *
 * Replaces the old native <select multiple> with a proper popover:
 *  - Trigger reads as "N selected" or a hint count
 *  - Panel shows checkbox rows with a search field at the top
 *  - "Select all" / "Clear" buttons for fast multi-selection across depts
 *
 * The width is forced via inline style to the trigger's width using
 * Radix's --radix-popover-trigger-width CSS var (so the dropdown lines
 * up under the button regardless of theme tokens).
 */
function ProgrammePicker({
  candidates,
  picker,
  onToggle,
  onSelectAll,
  onClear,
  open,
  onOpenChange,
}: {
  candidates: Array<{ id: string; name: string; department?: string | null }>;
  picker: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [filter, setFilter] = useState("");
  const checkedCount = Object.values(picker).filter(Boolean).length;
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.department ?? "").toLowerCase().includes(q),
    );
  }, [candidates, filter]);

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted/50"
        >
          <span className="truncate">
            {checkedCount === 0
              ? `Select from ${candidates.length} unmapped programme${candidates.length === 1 ? "" : "s"}`
              : `${checkedCount} programme${checkedCount === 1 ? "" : "s"} selected`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className="z-50 max-h-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {/* Sticky header: search + bulk actions */}
          <div className="border-b border-border bg-card p-2">
            <input
              type="text"
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search programmes…"
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-portal-accent"
            />
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {filtered.length} shown · {checkedCount} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="font-medium text-portal-accent hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="font-medium text-muted-foreground hover:underline"
                  disabled={checkedCount === 0}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No programmes match &ldquo;{filter}&rdquo;
              </p>
            ) : (
              filtered.map((p) => {
                const checked = !!picker[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onToggle(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                      checked && "bg-portal-accent-light/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-portal-accent bg-portal-accent text-portal-accent-foreground"
                          : "border-input bg-background",
                      )}
                    >
                      {checked && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{p.name}</span>
                      {p.department ? (
                        <span className="text-muted-foreground"> — {p.department}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

type Pending = { startDate: string; endDate: string };

function ProgrammeMappingPanel({
  yearId,
  yearName,
  yearStartDate,
  yearEndDate,
  semesters,
}: {
  yearId: string;
  yearName: string;
  yearStartDate: string;
  yearEndDate: string;
  semesters: Semester[];
}) {
  const { data: mappings, isLoading } = useProgrammeAcademicYears({ academicYearId: yearId });
  const { data: programsData } = usePrograms();
  const programs = useMemo(() => programsData?.data ?? [], [programsData]);
  const createMapping = useCreateProgrammeAcademicYears();
  const updateMapping = useUpdateProgrammeAcademicYear();
  const deleteMapping = useDeleteProgrammeAcademicYear();

  // Pending edits buffer — dropdown / Set Duration changes pile up here.
  // Save flushes via PATCH per row; Discard clears. The row turns amber
  // when it has a pending patch so the admin sees what's unsaved.
  const [pending, setPending] = useState<Record<string, Pending>>({});
  const dirtyCount = Object.keys(pending).length;
  const [saving, setSaving] = useState(false);

  // Warn before tab close if there are unsaved edits. Doesn't catch
  // in-app router navigation — that needs Next.js-specific handling,
  // which is out of scope for this panel.
  useEffect(() => {
    if (dirtyCount === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      // Modern API: preventDefault alone triggers the browser's
      // "unsaved changes" prompt. The legacy returnValue assignment
      // is deprecated but still required by some older Chromium
      // builds — only set it as a fallback for those.
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyCount]);

  // Merge server data with the pending buffer for display. Each row
  // reads as if the changes were already saved (optimistic local).
  const displayMappings = useMemo(() => {
    return (mappings ?? []).map((m) => {
      const p = pending[m.id];
      if (!p) return m;
      return { ...m, startDate: p.startDate || null, endDate: p.endDate || null };
    });
  }, [mappings, pending]);

  const onLocalUpdate = (id: string, patch: Pending) => {
    setPending((prev) => {
      const next = { ...prev };
      // If patch matches the server data, drop the pending entry — no-op.
      const server = (mappings ?? []).find((m) => m.id === id);
      if (server && (server.startDate || "") === patch.startDate && (server.endDate || "") === patch.endDate) {
        delete next[id];
      } else {
        next[id] = patch;
      }
      return next;
    });
  };

  const onSave = async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    const entries = Object.entries(pending);
    let ok = 0;
    let failed = 0;
    let firstErr: unknown = null;
    for (const [id, patch] of entries) {
      try {
        await updateMapping.mutateAsync({ id, startDate: patch.startDate, endDate: patch.endDate });
        ok += 1;
      } catch (e) {
        if (!firstErr) firstErr = e;
        // Surface to the devtools so the actual reason is one log away —
        // the toast can only show one short string, but bug reports
        // need the full ApiError to triage.
        console.error("[save mapping] id=", id, "patch=", patch, "error=", e);
        failed += 1;
      }
    }
    setSaving(false);
    if (failed === 0) {
      toast.success(`Saved ${ok} change${ok === 1 ? "" : "s"}`);
      setPending({});
    } else {
      const detail =
        firstErr instanceof ApiError
          ? firstErr.message
          : firstErr instanceof Error
            ? firstErr.message
            : "unknown error";
      toast.error(`${failed} of ${entries.length} failed: ${detail}`);
    }
  };

  const onDiscard = () => {
    if (dirtyCount === 0) return;
    setPending({});
    toast.message(`Discarded ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`);
  };

  /* ── Add programmes state ──────────────────────────────────────────── */

  const sem1 = semesters[0];
  const sem2 = semesters[1];
  const [picker, setPicker] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  // Single dropdown drives the add flow: "ay" or "custom". When custom,
  // four date inputs + Set Duration appear (same as the per-row editor).
  const [bulkBinding, setBulkBinding] = useState<SemBinding>("ay");
  const [bulkS1Start, setBulkS1Start] = useState("");
  const [bulkS1End, setBulkS1End] = useState("");
  const [bulkS2Start, setBulkS2Start] = useState("");
  const [bulkS2End, setBulkS2End] = useState("");
  // Once Set Duration is clicked, hold the chosen dates here so Map
  // can read them. Cleared after a successful Map.
  const [bulkAppliedStart, setBulkAppliedStart] = useState("");
  const [bulkAppliedEnd, setBulkAppliedEnd] = useState("");
  // Mirrors MappingRow's collapse-on-Set-Duration behaviour. Opens on
  // picking "Use custom dates", closes on a successful Set Duration,
  // re-opens via the pencil button next to the dropdown.
  const [bulkEditorOpen, setBulkEditorOpen] = useState(false);

  // Seed custom inputs with the AY's sem dates so the admin can tweak
  // rather than type from scratch.
  useEffect(() => {
    if (bulkBinding !== "custom") return;
    if (!bulkS1Start) setBulkS1Start(sem1?.startDate || "");
    if (!bulkS1End) setBulkS1End(sem1?.endDate || "");
    if (!bulkS2Start) setBulkS2Start(sem2?.startDate || "");
    if (!bulkS2End) setBulkS2End(sem2?.endDate || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkBinding]);

  const mappedProgrammeIds = useMemo(
    () => new Set((mappings ?? []).map((m) => m.programmeId)),
    [mappings],
  );
  const candidates = useMemo(
    () => programs.filter((p) => !mappedProgrammeIds.has(p.id)),
    [programs, mappedProgrammeIds],
  );

  const checkedIds = Object.keys(picker).filter((k) => picker[k]);

  const resolvedBulkDates = useMemo(() => {
    if (bulkBinding === "custom") {
      return { startDate: bulkAppliedStart || undefined, endDate: bulkAppliedEnd || undefined };
    }
    // AY mode → span both semesters' full range by default.
    if (sem1 && sem2) return { startDate: sem1.startDate, endDate: sem2.endDate };
    if (sem1) return { startDate: sem1.startDate, endDate: sem1.endDate };
    return { startDate: undefined, endDate: undefined };
  }, [bulkBinding, bulkAppliedStart, bulkAppliedEnd, sem1, sem2]);

  // Inline validation for the Add-programmes custom row. Same admin-friendly
  // ruleset as the per-row editor: required-for-persistence + end ≥ start
  // per sem + within-AY range, nothing else.
  const [bulkDateError, setBulkDateError] = useState<string | null>(null);
  useEffect(() => {
    setBulkDateError(null);
  }, [bulkS1Start, bulkS1End, bulkS2Start, bulkS2End, bulkBinding]);

  const bulkSetDuration = () => {
    const inRange = (d: string) =>
      !d || (d >= yearStartDate && d <= yearEndDate);
    if (!bulkS1Start) {
      setBulkDateError("Sem 1 Start is required.");
      return;
    }
    if (!bulkS2End) {
      setBulkDateError("Sem 2 End is required.");
      return;
    }
    if (bulkS1End && bulkS1End < bulkS1Start) {
      setBulkDateError("Sem 1 end can't be before Sem 1 start.");
      return;
    }
    if (bulkS2Start && bulkS2End < bulkS2Start) {
      setBulkDateError("Sem 2 end can't be before Sem 2 start.");
      return;
    }
    if (![bulkS1Start, bulkS1End, bulkS2Start, bulkS2End].every(inRange)) {
      setBulkDateError(
        `Dates must fall between ${formatDate(yearStartDate)} and ${formatDate(yearEndDate)}.`,
      );
      return;
    }
    setBulkDateError(null);
    setBulkAppliedStart(bulkS1Start);
    setBulkAppliedEnd(bulkS2End);
    setBulkEditorOpen(false);
    toast.success(`Duration set: ${formatDate(bulkS1Start)} → ${formatDate(bulkS2End)}`);
  };

  const customNotApplied =
    bulkBinding === "custom" && (!bulkAppliedStart || !bulkAppliedEnd);

  const onMap = useCallback(async () => {
    if (checkedIds.length === 0) return;
    try {
      const res = await createMapping.mutateAsync({
        academicYearId: yearId,
        programmeIds: checkedIds,
        startDate: resolvedBulkDates.startDate,
        endDate: resolvedBulkDates.endDate,
      });
      const r = res.data;
      toast.success(`Mapped ${r.inserted} programme${r.inserted === 1 ? "" : "s"} to ${yearName}${r.updated > 0 ? ` (${r.updated} updated)` : ""}`);
      setPicker({});
      setPickerOpen(false);
      setBulkS1Start("");
      setBulkS1End("");
      setBulkS2Start("");
      setBulkS2End("");
      setBulkAppliedStart("");
      setBulkAppliedEnd("");
      setBulkBinding("ay");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to map programmes");
    }
  }, [checkedIds, createMapping, yearId, yearName, resolvedBulkDates]);

  const toggleProgramme = (id: string) =>
    setPicker((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-background/50 p-4">
      <div>
        <p className="text-sm font-semibold">Programmes running in this academic year</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          For each programme, pick how its Sem 1 and Sem 2 dates are set. The default uses the AY semester dates; choose &ldquo;Use custom dates&rdquo; for any programme that runs on its own calendar.
        </p>
      </div>

      {/* Existing mappings */}
      {isLoading ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      ) : (displayMappings && displayMappings.length > 0) ? (
        <div className="mt-3 space-y-2">
          <div
            className="grid gap-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "2fr minmax(160px, 1.2fr) minmax(160px, 1.2fr) 110px 48px" }}
          >
            <span>Programme</span>
            <span>{sem1?.name ?? "Sem 1"}</span>
            <span>{sem2?.name ?? "Sem 2"}</span>
            <span>Courses</span>
            <span />
          </div>
          {displayMappings.map((m) => (
            <MappingRow
              key={m.id}
              mapping={m}
              semesters={semesters}
              yearStartDate={yearStartDate}
              yearEndDate={yearEndDate}
              isDirty={!!pending[m.id]}
              onLocalUpdate={(patch) => onLocalUpdate(m.id, patch)}
              onDelete={() => {
                setPending((prev) => {
                  const next = { ...prev };
                  delete next[m.id];
                  return next;
                });
                deleteMapping.mutate(m.id);
              }}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground italic">No programmes mapped yet.</p>
      )}

      {/* Add programmes — single dropdown ("Use AY dates" / "Use custom
          dates"). Custom reveals four date fields + Set Duration. */}
      {candidates.length > 0 ? (
        <div className="mt-4 space-y-3 rounded-md border border-border/40 bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Add programmes
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Programmes
              </label>
              <ProgrammePicker
                candidates={candidates}
                picker={picker}
                onToggle={toggleProgramme}
                onSelectAll={() => {
                  const next: Record<string, boolean> = {};
                  for (const c of candidates) next[c.id] = true;
                  setPicker(next);
                }}
                onClear={() => setPicker({})}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {checkedIds.length} of {candidates.length} selected
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Semester mapping
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={bulkBinding}
                  onChange={(e) => {
                    const v = e.target.value as SemBinding;
                    setBulkBinding(v);
                    if (v === "custom") {
                      setBulkEditorOpen(true);
                    } else {
                      setBulkEditorOpen(false);
                      setBulkAppliedStart("");
                      setBulkAppliedEnd("");
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-portal-accent"
                >
                  <option value="ay">
                    {sem1 && sem2
                      ? `${yearName} (${formatDate(sem1.startDate)} → ${formatDate(sem2.endDate)})`
                      : sem1
                        ? `${yearName} (${formatDate(sem1.startDate)} → ${formatDate(sem1.endDate)})`
                        : yearName}
                  </option>
                  <option value="custom">
                    {bulkAppliedStart && bulkAppliedEnd
                      ? `${formatDate(bulkAppliedStart)} → ${formatDate(bulkAppliedEnd)}`
                      : bulkS1Start && bulkS2End
                        ? `${formatDate(bulkS1Start)} → ${formatDate(bulkS2End)}`
                        : "Set custom dates…"}
                  </option>
                </select>
                {bulkBinding === "custom" && (
                  <button
                    type="button"
                    onClick={() => setBulkEditorOpen((v) => !v)}
                    title={bulkEditorOpen ? "Hide custom date editor" : "Edit custom dates"}
                    className={cn(
                      "shrink-0 rounded-md border p-1.5 transition-colors",
                      bulkEditorOpen
                        ? "border-portal-accent bg-portal-accent-light text-portal-accent"
                        : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
              {bulkBinding === "custom" && !bulkAppliedStart && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Fill the four dates below, then Set Duration.
                </p>
              )}
            </div>
          </div>
          {bulkBinding === "custom" && bulkEditorOpen && (
            <div className="rounded-md border border-border bg-card p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DateField label="Sem 1 Start" value={bulkS1Start} onChange={setBulkS1Start} />
                <DateField label="Sem 1 End" value={bulkS1End} onChange={setBulkS1End} />
                <DateField label="Sem 2 Start" value={bulkS2Start} onChange={setBulkS2Start} />
                <DateField label="Sem 2 End" value={bulkS2End} onChange={setBulkS2End} />
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                {bulkDateError ? (
                  <p className="mr-auto text-[10px] font-medium text-danger">
                    {bulkDateError}
                  </p>
                ) : bulkAppliedStart && bulkAppliedEnd ? (
                  <p className="mr-auto text-[10px] text-portal-accent">
                    Will apply {formatDate(bulkAppliedStart)} → {formatDate(bulkAppliedEnd)}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={bulkSetDuration}
                  disabled={
                    !!bulkAppliedStart &&
                    !!bulkAppliedEnd &&
                    bulkAppliedStart === bulkS1Start &&
                    bulkAppliedEnd === bulkS2End
                  }
                  title={
                    bulkAppliedStart === bulkS1Start && bulkAppliedEnd === bulkS2End
                      ? "No changes to apply"
                      : "Apply these dates"
                  }
                  className="flex items-center gap-1 rounded-md bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Set Duration
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onMap}
            disabled={checkedIds.length === 0 || createMapping.isPending || customNotApplied}
            title={customNotApplied ? "Click Set Duration to apply your custom dates first" : ""}
            className="flex items-center gap-2 rounded-md bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {createMapping.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Map {checkedIds.length > 0 ? `${checkedIds.length} programme${checkedIds.length > 1 ? "s" : ""}` : "selected"} to {yearName}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground italic">
          All programmes are already mapped to this year.
        </p>
      )}

      {/* Sticky save bar. Pinned to the viewport bottom so it's always
          visible while editing, regardless of how long the AY list grows.
          Renders here (inside the panel) so the dirty state is local; if
          two AY panels are open and both dirty, the most recently rendered
          bar wins via natural z-order — acceptable for this workflow. */}
      {dirtyCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-6 py-3">
            <p className="text-sm font-medium">
              {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"} in {yearName}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDiscard}
                disabled={saving}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function AdminAcademicCalendarPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<{ open: boolean; semester: Semester | null }>({
    open: false,
    semester: null,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: years, isLoading, isError, refetch } = useAcademicYears();

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Default-expand the active year on first load
  useEffect(() => {
    if (years && years.length > 0) {
      setExpanded((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const active = years.find((y) => y.status === "active");
        return active ? { [active.id]: true } : prev;
      });
    }
  }, [years]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calendar}
        title="Academic Calendar"
        description="Manage academic years and their semesters"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Academic Year
          </button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : isError ? (
        <ErrorState
          title="Failed to load academic calendar"
          message="Could not retrieve academic years. Please try again."
          onRetry={() => refetch()}
        />
      ) : !years || years.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No academic years yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first academic year to start scheduling semesters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((year) => (
            <YearRow
              key={year.id}
              year={year}
              expanded={!!expanded[year.id]}
              onToggle={() => handleToggle(year.id)}
              onEditSemester={(sem) => setEditSemester({ open: true, semester: sem })}
            />
          ))}
        </div>
      )}

      <CreateAcademicYearDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditSemesterDialog
        open={editSemester.open}
        onOpenChange={(o) => setEditSemester((p) => ({ ...p, open: o }))}
        semester={editSemester.semester}
      />
    </div>
  );
}
