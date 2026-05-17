"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Loader2, AlertCircle, Users, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useCreateCatalog,
  useUpdateCatalog,
  useCourseCatalog,
  useCreateOffering,
  useAssignFaculty,
  useAcademicYears,
  useAdminUsers,
  usePrograms,
  useProgrammeAcademicYears,
} from "@/admin/lib/hooks/use-admin";
import {
  createCatalogSchema,
  type CreateCatalogFormData,
  type CreateCatalogFormInput,
  createOfferingSchema,
  type CreateOfferingFormData,
  type CreateOfferingFormInput,
} from "@/admin/lib/schemas/admin.schema";
import { SlideDrawer } from "@/admin/components/shared/feedback/slide-drawer";
import {
  FormField,
  FormSelect,
  FormTextarea,
} from "@/admin/components/shared/forms/form-field";
import { ApiError } from "@/admin/lib/api/client";
import type {
  CourseCatalog,
  CourseOffering,
  CourseType,
} from "@/admin/lib/api/types/admin.types";

// Surface the most specific message from a thrown API error: prefer the first
// field-level detail (e.g. "Course \"CS301\" already exists under R22") over
// the generic "Validation failed" envelope.
function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.details) {
    const firstFieldErrors = Object.values(err.details).find(
      (msgs) => Array.isArray(msgs) && msgs.length > 0,
    );
    if (firstFieldErrors && firstFieldErrors[0]) return firstFieldErrors[0];
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  core: "Core",
  programme_elective: "Programme Elective",
  open_elective: "Open Elective",
};

const COURSE_TYPE_OPTIONS = [
  { value: "core", label: "Core" },
  { value: "programme_elective", label: "Programme Elective" },
  { value: "open_elective", label: "Open Elective" },
];

// ─── Catalog Drawer ──────────────────────────────────────────────────────────

export function CatalogDrawer({
  open,
  onClose,
  editing,
  departmentOptions,
}: {
  open: boolean;
  onClose: () => void;
  editing: CourseCatalog | null;
  departmentOptions: { value: string; label: string }[];
}) {
  const createCatalog = useCreateCatalog();
  const updateCatalog = useUpdateCatalog();
  const isEditing = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCatalogFormInput, unknown, CreateCatalogFormData>({
    resolver: zodResolver(createCatalogSchema),
    defaultValues: editing
      ? {
          code: editing.code,
          name: editing.name,
          description: editing.description,
          syllabus: editing.syllabus,
          regulation: editing.regulation,
          credits: editing.credits,
          courseType: editing.courseType,
          owningDepartmentId: editing.owningDepartmentId,
          lectureHours: editing.lectureHours,
          tutorialHours: editing.tutorialHours,
          practicalHours: editing.practicalHours,
        }
      : {
          code: "",
          name: "",
          description: "",
          syllabus: "",
          regulation: "R22",
          credits: 3,
          courseType: "core",
          owningDepartmentId: null,
          lectureHours: 3,
          tutorialHours: 0,
          practicalHours: 0,
        },
  });

  // Reset the form when the drawer opens with a different editing target
  // so stale values from a previous Edit click don't leak over.
  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            description: editing.description,
            syllabus: editing.syllabus,
            regulation: editing.regulation,
            credits: editing.credits,
            courseType: editing.courseType,
            owningDepartmentId: editing.owningDepartmentId,
            lectureHours: editing.lectureHours,
            tutorialHours: editing.tutorialHours,
            practicalHours: editing.practicalHours,
          }
        : {
            code: "",
            name: "",
            description: "",
            syllabus: "",
            regulation: "R22",
            credits: 3,
            courseType: "core",
            owningDepartmentId: null,
            lectureHours: 3,
            tutorialHours: 0,
            practicalHours: 0,
          },
    );
  }, [open, editing, reset]);

  const onSubmit = useCallback(
    async (data: CreateCatalogFormData) => {
      try {
        if (isEditing && editing) {
          await updateCatalog.mutateAsync({
            id: editing.id,
            ...data,
            owningDepartmentName: data.owningDepartmentId
              ? (departmentOptions.find((d) => d.value === data.owningDepartmentId)
                  ?.label ?? null)
              : null,
          });
          toast.success(
            `${data.code} updated. Future offerings will use the new syllabus.`,
          );
        } else {
          await createCatalog.mutateAsync(data);
          toast.success(`${data.code} added to catalog.`);
        }
        onClose();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not save the catalog course."));
      }
    },
    [
      isEditing,
      editing,
      createCatalog,
      updateCatalog,
      departmentOptions,
      onClose,
    ],
  );

  const isPending = createCatalog.isPending || updateCatalog.isPending;

  const departmentSelectOptions = useMemo(
    () => [
      { value: "", label: "No owning specialization (cross-cutting)" },
      ...departmentOptions,
    ],
    [departmentOptions],
  );

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title={isEditing ? `Edit ${editing?.code}` : "Add Catalog Course"}
      description={
        isEditing
          ? "Edits don't affect past offerings — they keep their snapshot."
          : "Define the course design once. Schedule it later via Section Offerings."
      }
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="catalog-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Add to Catalog"}
          </button>
        </div>
      }
    >
      <form
        id="catalog-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Identity</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Course Code"
              placeholder="e.g. CS301"
              hint="Uppercase letters, digits, hyphens"
              error={errors.code?.message}
              required
              {...register("code")}
            />
            <FormField
              label="Regulation"
              placeholder="e.g. R22"
              hint="Curriculum version this course belongs to"
              error={errors.regulation?.message}
              required
              {...register("regulation")}
            />
            <FormField
              label="Credits"
              type="number"
              min={1}
              max={12}
              placeholder="3"
              error={errors.credits?.message}
              required
              {...register("credits")}
            />
          </div>
          <FormField
            label="Course Name"
            placeholder="e.g. Data Structures & Algorithms"
            error={errors.name?.message}
            required
            {...register("name")}
          />
          <FormTextarea
            label="Short Description"
            placeholder="One or two sentences describing what students learn."
            error={errors.description?.message}
            required
            {...register("description")}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Classification
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Course Type"
              options={COURSE_TYPE_OPTIONS}
              error={errors.courseType?.message}
              hint="Core auto-rosters whole sections; electives need student opt-in"
              required
              {...register("courseType")}
            />
            <FormSelect
              label="Owning Specialization"
              options={departmentSelectOptions}
              error={errors.owningDepartmentId?.message}
              hint="Optional — leave blank for cross-cutting courses"
              {...register("owningDepartmentId", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Weekly hours (L:T:P)
          </h3>
          <p className="-mt-2 text-xs text-muted-foreground">
            How many hours per week of lecture, tutorial, and practical/lab.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Lecture (L)"
              type="number"
              min={0}
              max={10}
              error={errors.lectureHours?.message}
              {...register("lectureHours")}
            />
            <FormField
              label="Tutorial (T)"
              type="number"
              min={0}
              max={10}
              error={errors.tutorialHours?.message}
              {...register("tutorialHours")}
            />
            <FormField
              label="Practical (P)"
              type="number"
              min={0}
              max={10}
              error={errors.practicalHours?.message}
              {...register("practicalHours")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Syllabus</h3>
          <FormTextarea
            label="Syllabus / Module Breakdown"
            placeholder={`Module 1: ...\nModule 2: ...\nModule 3: ...`}
            rows={8}
            error={errors.syllabus?.message}
            hint="At least 20 characters. List the modules and topics covered."
            required
            {...register("syllabus")}
          />
        </section>
      </form>
    </SlideDrawer>
  );
}

// ─── Offering Drawer (Schedule Offering) ─────────────────────────────────────

export function OfferingDrawer({
  open,
  onClose,
  preselectedCatalogId,
}: {
  open: boolean;
  onClose: () => void;
  preselectedCatalogId?: string;
}) {
  const createOffering = useCreateOffering();
  const { data: catalogData } = useCourseCatalog({
    status: "active",
    pageSize: 200,
  });
  const { data: academicYears } = useAcademicYears();
  const { data: programsData } = usePrograms({ status: "active" });
  const { data: facultyData } = useAdminUsers({
    role: "faculty",
    status: "active",
    pageSize: 200,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateOfferingFormInput, unknown, CreateOfferingFormData>({
    resolver: zodResolver(createOfferingSchema),
    defaultValues: {
      catalogId: preselectedCatalogId ?? "",
      academicYearId: "",
      semesterId: "",
      studyYear: 1 as 1,
      sectionId: "",
      facultyId: null,
      maxCapacity: 9999,
      studentIds: [] as string[],
    },
  });

  // Re-seed the form when the drawer opens — keeps the preselect honoured.
  useEffect(() => {
    if (!open) return;
    reset({
      catalogId: preselectedCatalogId ?? "",
      academicYearId: "",
      semesterId: "",
      studyYear: 1 as 1,
      sectionId: "",
      facultyId: null,
      maxCapacity: 9999,
      studentIds: [] as string[],
    });
  }, [open, preselectedCatalogId, reset]);

  // Native <select> can't display a value that has no matching <option> yet.
  // When the drawer is opened with a preselected catalog, the catalog list
  // may still be loading — so the form value gets set but the DOM select
  // falls back to the placeholder. Re-sync the value once the option exists.
  const watchedCatalogId = watch("catalogId");
  const watchedAcademicYearId = watch("academicYearId");
  const watchedFacultyId = watch("facultyId");

  useEffect(() => {
    if (!open || !preselectedCatalogId) return;
    const present = catalogData?.catalog.some(
      (c) => c.id === preselectedCatalogId,
    );
    if (present && watchedCatalogId !== preselectedCatalogId) {
      setValue("catalogId", preselectedCatalogId);
    }
  }, [open, preselectedCatalogId, catalogData, watchedCatalogId, setValue]);

  // The semester options collapse to whatever is nested under the chosen
  // academic year, so admins can't mix terms across years.
  const selectedAcademicYear = useMemo(
    () => academicYears?.find((y) => y.id === watchedAcademicYearId),
    [academicYears, watchedAcademicYearId],
  );

  const selectedCatalog = useMemo(
    () => catalogData?.catalog.find((c) => c.id === watchedCatalogId),
    [catalogData, watchedCatalogId],
  );

  // Section concept removed. Admins now filter all students by year + branch
  // + programme and pick exactly who gets enrolled via a checkbox grid. We
  // pull every student in the tenant in one shot (backend caps at 5000) and
  // filter client-side — fast enough for normal university scales, and
  // avoids server round-trips on every filter change. Previously requested
  // pageSize=500 but the backend silently capped at 200, hiding any student
  // created after the first 200 (e.g. newly-imported users on page 2+).
  const { data: studentsPage } = useAdminUsers({ role: "student", pageSize: 5000 });
  const allStudents = useMemo(() => studentsPage?.users ?? [], [studentsPage]);

  const catalogOptions = useMemo(() => {
    const list = catalogData?.catalog ?? [];
    return [
      { value: "", label: "Pick a course from the catalog..." },
      ...list.map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.name} · ${COURSE_TYPE_LABEL[c.courseType]} · ${c.credits}cr`,
      })),
    ];
  }, [catalogData]);

  const academicYearOptions = useMemo(() => {
    const list = academicYears ?? [];
    return [
      { value: "", label: "Select an academic year..." },
      ...list.map((y) => ({ value: y.id, label: y.name })),
    ];
  }, [academicYears]);

  const semesterOptions = useMemo(() => {
    const sems = selectedAcademicYear?.semesters ?? [];
    return [
      { value: "", label: "Select a semester..." },
      ...sems.map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [selectedAcademicYear]);

  const facultyOptions = useMemo(() => {
    const list = facultyData?.users ?? [];
    return [
      {
        value: "",
        label: "Leave unassigned for now (offering will be Draft)",
      },
      ...list.map((f) => ({
        value: f.id,
        label: `${f.name} · ${f.department}`,
      })),
    ];
  }, [facultyData]);

  const watchedStudentIds = watch("studentIds") || [];

  const onSubmit = useCallback(
    async (data: CreateOfferingFormData) => {
      try {
        const payload = {
          ...data,
          facultyId: data.facultyId || null,
        };
        const result = await createOffering.mutateAsync(payload);
        toast.success(
          payload.facultyId
            ? `Offering created and ${selectedCatalog?.code} is now scheduled.`
            : `Draft offering saved. Assign faculty to activate it.`,
        );
        if (programsData) {
          // Programs hook is invalidated indirectly; nothing to do here.
        }
        onClose();
        return result;
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not create the offering."));
      }
    },
    [createOffering, selectedCatalog, onClose, programsData],
  );

  const isPending = createOffering.isPending;

  // Enrollment policy: no auto-enroll for any course type. The admin always
  // assigns students explicitly from the offering's detail page via the
  // class-picker (with per-student exclude). Core vs elective only differs
  // in whether students can opt themselves in afterwards.
  const enrollmentHint = useMemo(() => {
    if (!selectedCatalog) return null;
    if (selectedCatalog.courseType === "core") {
      return "Core course — pick a class on the offering detail page to enrol students. No auto-enrollment.";
    }
    return "Elective — students must opt in from their portal once the offering is active. You can also enrol specific students from the offering's detail page.";
  }, [selectedCatalog]);

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title="Schedule a Course Offering"
      description="Pick a catalog course, target a section, and assign faculty."
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="offering-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {watchedFacultyId ? "Create & Activate" : "Save as Draft"}
          </button>
        </div>
      }
    >
      <form
        id="offering-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">1. Course</h3>
          <FormSelect
            label="Catalog Course"
            options={catalogOptions}
            error={errors.catalogId?.message}
            required
            {...register("catalogId")}
          />
          {selectedCatalog && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <Datum
                  label="Type"
                  value={COURSE_TYPE_LABEL[selectedCatalog.courseType]}
                />
                <Datum label="Regulation" value={selectedCatalog.regulation} />
                <Datum
                  label="Credits"
                  value={`${selectedCatalog.credits} credits`}
                />
                <Datum
                  label="L:T:P"
                  value={`${selectedCatalog.lectureHours}:${selectedCatalog.tutorialHours}:${selectedCatalog.practicalHours}`}
                />
                <Datum
                  label="Owning Specialization"
                  value={
                    selectedCatalog.owningDepartmentName ?? "Cross-cutting"
                  }
                />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">2. When</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Academic Year"
              options={academicYearOptions}
              error={errors.academicYearId?.message}
              required
              {...register("academicYearId")}
            />
            <FormSelect
              label="Semester"
              options={semesterOptions}
              disabled={!watchedAcademicYearId}
              error={errors.semesterId?.message}
              hint={
                !watchedAcademicYearId ? "Pick an academic year first" : undefined
              }
              required
              {...register("semesterId")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            3. Enroll Students
          </h3>
          {/* Replaces the old section dropdown. Admin filters by programme +
              year + branch (any/all optional), the table below auto-narrows,
              every matching student starts CHECKED, and the admin unticks
              the ones to exclude. Counter chips show running totals. */}
          <StudentEnrollmentPicker
            allStudents={allStudents}
            programmes={programsData?.data ?? []}
            academicYearId={watchedAcademicYearId}
            value={watchedStudentIds}
            onChange={(ids) => setValue("studentIds", ids, { shouldValidate: true })}
          />
          {errors.studentIds && (
            <p className="text-xs text-danger">{errors.studentIds.message as string}</p>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">4. Faculty</h3>
          <FormSelect
            label="Assigned Faculty"
            options={facultyOptions}
            error={errors.facultyId?.message}
            hint="Without a faculty, the offering is saved as Draft and won't appear in faculty/student portals."
            {...register("facultyId", {
              setValueAs: (v) => (v === "" ? null : v),
            })}
          />
        </section>

        {enrollmentHint && (
          <div className="rounded-lg border border-portal-accent/30 bg-portal-accent-light/40 p-3 text-xs text-portal-accent">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{enrollmentHint}</span>
            </div>
          </div>
        )}
      </form>
    </SlideDrawer>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

// ─── Student Enrollment Picker ──────────────────────────────────────────────
// Used by the OfferingDrawer. Filters all students in the tenant by any
// combination of programme + study year + branch (each optional, all multi),
// renders the survivors as a scrollable checkbox grid where every match
// starts ticked, and emits the resulting `studentIds[]` to the parent form.
// "All ticked by default, uncheck to exclude" mirrors what the admin asked
// for. Counter chips at the top track Selected / Excluded so they can sanity
// check how many will be enrolled before submit.

interface PickerStudent {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  program?: string;
  department: string;
  // Free-form "year of study" — we don't have a real column for this, so we
  // infer from currentSemester (1-2 = Year 1, 3-4 = Year 2 etc) when present.
  yearOfStudy?: number;
}

interface PickerProgramme {
  id: string;
  name: string;
  department: string;
  /** UG / PG / Diploma / PhD — drives the new Degree Level cascade and
   *  scopes which programmes appear under "Branch / Programme" so a BTech
   *  filter doesn't surface MTech rows (and vice versa). Optional because
   *  legacy programmes seeded before degreeType was tracked don't have it. */
  degreeType?: string;
}

function inferStudyYear(currentSemester: string | undefined): number | undefined {
  if (!currentSemester) return undefined;
  const n = parseInt(currentSemester, 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.ceil(n / 2);
}

/**
 * Reusable checkbox-style multi-select. Renders as a click-to-open dropdown
 * (so it doesn't eat vertical space when collapsed), with a checkbox per
 * option inside the panel. The trigger button shows the count of selected
 * items + the first 2-3 labels so the admin can see their picks at a
 * glance without opening the dropdown again. Matches the pattern the user
 * asked for: "same way as the import dialog has checkboxes".
 *
 * Generic over the option's identifier shape (T extends string).
 */
function CheckboxMultiSelect<T extends string>({
  label,
  placeholder,
  options,
  value,
  onChange,
  emptyMessage,
  searchable = true,
}: {
  label: string;
  placeholder: string;
  options: { value: T; label: string; hint?: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  emptyMessage?: string;
  /** Hide the in-panel search input for short option lists (e.g. Year of
   *  Study where there are only 6-7 options). Defaults to true since most
   *  callers have long lists where typeahead matters. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-outside to close — basic dropdown UX.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Reset the in-panel search whenever the dropdown closes so the next
  // open starts fresh.
  useEffect(() => { if (!open) setSearch(""); }, [open]);

  const toggle = (v: T) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  // Search-filtered options drive the panel body. The select-all toggle
  // operates on the FILTERED set (so admin can search "btech" and tick
  // them all in one click).
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, search]);

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((o) => value.includes(o.value));
  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const drop = new Set(filteredOptions.map((o) => o.value));
      onChange(value.filter((v) => !drop.has(v)));
    } else {
      const merged = new Set<T>(value);
      filteredOptions.forEach((o) => merged.add(o.value));
      onChange(Array.from(merged));
    }
  };

  // Trigger label — shows the first 2 picks then "+N more" once it gets long.
  const triggerLabel = useMemo(() => {
    if (value.length === 0) return placeholder;
    const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
  }, [value, options, placeholder]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium">
        {label}
        {value.length > 0 && (
          <span className="ml-1 rounded-full bg-portal-accent-light px-1.5 py-0.5 text-[10px] font-semibold text-portal-accent">
            {value.length}
          </span>
        )}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={triggerLabel}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-portal-accent"
      >
        <span className={`truncate ${value.length === 0 ? "text-muted-foreground" : ""}`}>
          {triggerLabel}
        </span>
        <span className="ml-1 shrink-0 text-muted-foreground">▾</span>
      </button>

      {open && (
        // Wider auto-fit panel: stays at least the trigger's width but
        // grows up to 24rem so long programme names like
        // "BSc Biotech — Civil Engineering" don't ellipsize early.
        <div className="absolute left-0 z-30 mt-1 w-full min-w-full max-w-[26rem] overflow-hidden rounded-md border border-border bg-card shadow-lg"
             style={{ width: "max(100%, 22rem)" }}>
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs italic text-muted-foreground">
              {emptyMessage || "No options"}
            </p>
          ) : (
            <>
              {/* Search box — only when there's something to search through
                  AND the caller didn't opt out. Auto-focuses so the admin
                  can start typing the moment the panel opens. */}
              {searchable && options.length > 4 && (
                <div className="sticky top-0 z-10 border-b border-border bg-card px-3 py-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${label.toLowerCase()}…`}
                      className="flex h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-portal-accent"
                    />
                  </div>
                </div>
              )}
              {/* Select-all / Clear bar — operates on the search-filtered
                  set so the admin can tick "all BTech" in one shot. The
                  counter spells out the relationship explicitly so it isn't
                  read as "loaded / total" or some other ambiguity. */}
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    className="h-3.5 w-3.5 accent-portal-accent"
                  />
                  {allFilteredSelected
                    ? (search ? "Clear filtered" : "Clear all")
                    : (search ? "Select filtered" : "Select all")}
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Selected: {value.length} of {options.length}
                </span>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-[11px] italic text-muted-foreground">
                    No matches for &ldquo;{search}&rdquo;
                  </li>
                ) : (
                  filteredOptions.map((opt) => {
                    const checked = value.includes(opt.value);
                    return (
                      <li key={String(opt.value)}>
                        <label
                          className="flex cursor-pointer items-start gap-2.5 px-3 py-2 text-xs hover:bg-muted/50"
                          title={opt.hint ? `${opt.label} — ${opt.hint}` : opt.label}
                        >
                          {/* Bigger click target (16px vs 14px) for touch. */}
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(opt.value)}
                            className="mt-0.5 h-4 w-4 accent-portal-accent"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block break-words font-medium">{opt.label}</span>
                            {opt.hint && (
                              <span className="block break-words text-[10px] text-muted-foreground">
                                {opt.hint}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Sentinel value used in the Department dropdown to represent "students with
// no department assigned yet". Picked deliberately ugly so it can never
// collide with a real department name.
const UNASSIGNED_DEPT = "__unassigned__";

export function StudentEnrollmentPicker({
  allStudents,
  programmes,
  academicYearId,
  value,
  onChange,
}: {
  allStudents: { id: string; name: string; email: string; studentId?: string; program?: string; department: string; currentSemester?: string }[];
  programmes: PickerProgramme[];
  // The AY is now sourced from the parent OfferingDrawer (section "2. When")
  // so we don't ask the admin to pick it twice. Empty string = none picked yet.
  academicYearId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  // Cascading filter state. Chain is now 3 axes (AY comes from the parent):
  //   Department(s) → Branch/Programme(s) → Year of Study
  // Picking the AY upstream narrows the depts shown here to ONLY those
  // linked to that AY via the programme_academic_years mapping.
  //
  // Cascade collapsed to ONE programme axis at the admin's request — the
  // earlier (Degree → Department → Branch) cascade was over-faceted: same
  // programme name appeared in multiple rows, Department vs Branch vs
  // Programme blurred academic concepts, and duplicate programme names
  // surfaced as confusing twins. Now the admin picks programmes directly
  // by full name (BTech CSE, MTech CSE, …); the department is rendered as
  // a secondary label so legitimately distinct same-name programmes (e.g.
  // BSc Biotech under Biotechnology vs Civil Engineering) stay
  // distinguishable without making it a separate axis.
  const [filterBranches, setFilterBranches] = useState<string[]>([]);
  const [filterYears, setFilterYears] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Look up programme×AY mappings for the AY chosen in the parent form.
  const ayMappings = useProgrammeAcademicYears(
    academicYearId ? { academicYearId } : undefined,
  );

  // Set of programme IDs linked to the chosen AY. When no AY is picked the
  // filter is open (any programme allowed). Important edge case: when an
  // AY IS picked but the mapping table has 0 rows for it, we ALSO return
  // null — i.e. fall back to "show every programme" instead of trapping the
  // admin with an empty dept dropdown.
  const ayLinkedProgrammeIds = useMemo(() => {
    if (!academicYearId) return null; // no AY chosen upstream yet
    if (!ayMappings.data) return null;
    const ids = new Set<string>();
    for (const m of ayMappings.data) {
      if (m.academicYearId === academicYearId) ids.add(m.programmeId);
    }
    if (ids.size === 0) return null;
    return ids;
  }, [academicYearId, ayMappings.data]);

  const normalized: PickerStudent[] = useMemo(
    () => allStudents.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentId: s.studentId,
      program: s.program,
      department: s.department,
      yearOfStudy: inferStudyYear(s.currentSemester),
    })),
    [allStudents],
  );

  // Programmes available to pick — filtered to those linked to the chosen
  // AY when one is set. No degree-level / department sub-filters anymore;
  // the admin picks programme names directly (BTech CSE, MTech CSE, …).
  const ayFilteredProgrammes = useMemo(() => {
    if (!ayLinkedProgrammeIds) return programmes;
    return programmes.filter((p) => ayLinkedProgrammeIds.has(p.id));
  }, [programmes, ayLinkedProgrammeIds]);

  // The Programme dropdown is the single primary axis now. Case-fold dedup
  // collapses programmes whose `(name, department)` differ only in casing
  // to one entry. Legitimately distinct same-name programmes (`BSc Biotech`
  // under two different depts) keep both rows — the dept label below the
  // name disambiguates them.
  const branchOptions = useMemo(() => {
    const seen = new Set<string>();
    return ayFilteredProgrammes.filter((p) => {
      const k = `${(p.name || "").toLowerCase()}::${(p.department || "").toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [ayFilteredProgrammes]);

  // Prune programme picks if the AY filter shrinks the available list
  // (e.g. admin switched AY upstream and some of the previously ticked
  // programmes are no longer mapped to the new AY).
  useEffect(() => {
    const validIds = new Set(branchOptions.map((b) => b.id));
    setFilterBranches((prev) => prev.filter((id) => validIds.has(id)));
  }, [branchOptions]);

  const matchingStudents = useMemo(() => {
    return normalized.filter((s) => {
      if (filterBranches.length > 0) {
        // Strict match on the programme NAME (case-insensitive, trimmed).
        // Earlier the dept fallback meant BTech CSE students appeared under
        // MTech CSE too (shared dept = Computer Science). With this strict
        // match, a student's program must literally equal a ticked
        // programme's name. Admins set the program via Users → Edit.
        // Department-only fallback is preserved ONLY when the student's
        // program field is empty — those genuinely unassigned students
        // still surface so they aren't unreachable.
        const branchIds = new Set(filterBranches);
        const sProg = (s.program || "").trim().toLowerCase();
        const programmeMatches = Array.from(branchIds).some((pid) => {
          const p = programmes.find((q) => q.id === pid);
          if (!p) return false;
          if (sProg) {
            return sProg === p.name.toLowerCase();
          }
          if (s.department && p.department) {
            return s.department.toLowerCase() === p.department.toLowerCase();
          }
          return false;
        });
        if (!programmeMatches) return false;
      }
      if (filterYears.length > 0) {
        // Sentinel `0` = "Year unset" — matches students whose
        // currentSemester is null and therefore have no yearOfStudy. Without
        // this option, ticking Year 1–6 still hides every student the admin
        // hasn't assigned a semester to yet (the cause of "293 of 400+
        // missing" in the picker). With it, they can tick "Year unset" to
        // include them or leave it off to exclude them.
        if (!s.yearOfStudy) {
          if (!filterYears.includes(0)) return false;
        } else if (!filterYears.includes(s.yearOfStudy)) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${s.name} ${s.email} ${s.studentId || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [normalized, programmes, filterBranches, filterYears, search]);

  const matchingIds = useMemo(() => matchingStudents.map((s) => s.id), [matchingStudents]);
  const matchingIdsKey = matchingIds.join(",");

  // Manually-excluded students survive filter-change so toggling filters
  // doesn't quietly re-include people the admin had ticked off.
  const [manuallyExcluded, setManuallyExcluded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // After matchingIds settles, recompute selection: every match minus
    // any manual exclusion. Driven by `studentsLoaded` so the form value
    // doesn't churn before the admin has clicked "View students".
    if (!studentsLoaded) return;
    const next = matchingIds.filter((id) => !manuallyExcluded.has(id));
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingIdsKey, manuallyExcluded, studentsLoaded]);

  const selectedCount = value.length;
  const excludedCount = matchingIds.length - selectedCount;

  const toggle = (id: string) => {
    setManuallyExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCount === matchingIds.length) setManuallyExcluded(new Set(matchingIds));
    else setManuallyExcluded(new Set());
  };

  const clearFilters = () => {
    setFilterBranches([]);
    setFilterYears([]);
    setSearch("");
    setStudentsLoaded(false);
    onChange([]);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      {/* Cascade row: 3 checkbox-style multi-selects. The AY is inherited
          from section "2. When" upstream, so we don't ask the admin twice.
          Picking an AY upstream narrows the Department dropdown here to
          ONLY departments whose programmes are mapped to that AY (via the
          programme-AY mapping table). Same goes for Branch — only AY-linked
          programmes show up. */}
      {!academicYearId && (
        <div className="rounded-md border border-warning/30 bg-warning-light/40 px-3 py-2 text-[11px] text-warning">
          Pick an Academic Year in section 2 above first — the Programme dropdown
          scopes to that AY's offerings.
        </div>
      )}
      {/* Single Programme axis — admin picks full programme names directly
          (BTech CSE, MTech CSE, MBA, …). The dept appears as a secondary
          label on each row so legitimately distinct same-name programmes
          (e.g. BSc Biotech under Biotechnology vs Civil Engineering) stay
          distinguishable without making Department a separate filter. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CheckboxMultiSelect
          label="Programme(s)"
          placeholder={
            branchOptions.length === 0
              ? academicYearId
                ? "No programmes mapped to this AY yet"
                : "Pick an Academic Year first"
              : "Select one or more programmes…"
          }
          options={branchOptions.map((b) => ({
            value: b.id,
            label: b.name,
            hint: b.department || undefined,
          }))}
          value={filterBranches}
          onChange={setFilterBranches}
          emptyMessage={
            academicYearId
              ? "No programmes are mapped to this AY. Map them on Programs & Degrees."
              : "Pick an Academic Year first"
          }
        />
        {/* Year of Study — 1 to 6 plus a `0` sentinel labelled "Year unset"
            that catches students whose currentSemester column is NULL (i.e.
            the admin hasn't picked a Year of Study on their profile yet). */}
        <CheckboxMultiSelect<string>
          label="Year of Study"
          placeholder="All years"
          options={[
            ...[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` })),
            { value: "0", label: "Year unset" },
          ]}
          value={filterYears.map(String)}
          onChange={(next) => setFilterYears(next.map((v) => parseInt(v, 10)))}
          searchable={false}
        />
      </div>

      {/* Load-trigger row — students render only after View Students is hit */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStudentsLoaded(true)}
          className="flex items-center gap-2 rounded-md bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground hover:bg-portal-accent-hover"
        >
          <Users className="h-3.5 w-3.5" />
          {studentsLoaded ? "Refresh student list" : "View students"}
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear all filters
        </button>
        {studentsLoaded && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-portal-accent-light px-2 py-0.5 text-xs font-semibold text-portal-accent ml-auto">
              {matchingIds.length} match{matchingIds.length === 1 ? "" : "es"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">
              {selectedCount} selected
            </span>
            {excludedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning">
                {excludedCount} excluded
              </span>
            )}
          </>
        )}
      </div>

      {/* Selection summary chips removed — the admin can already see which
          options are ticked by re-opening the relevant dropdown. The colored
          chip strip was duplicating that info and crowding the drawer. */}

      {/* Student grid + search + select-all — only shown once "View students"
          has been clicked. Keeps the drawer light when first opened. */}
      {studentsLoaded && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or roll number…"
                className="flex h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={toggleAll}
              disabled={matchingIds.length === 0}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {selectedCount === matchingIds.length ? "Exclude all" : "Include all"}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border border-border bg-card">
            {matchingIds.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                {allStudents.length === 0
                  ? "No students in this institution yet — create some on the Users page first."
                  : "No students match these filters. Try widening Department / Branch / Year."}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {/* Header row */}
                <li className="sticky top-0 z-10 grid grid-cols-[24px_1fr_120px_80px_80px] items-center gap-2 bg-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                  <span>&nbsp;</span>
                  <span>Name</span>
                  <span>Roll No.</span>
                  <span>Year</span>
                  <span>Dept</span>
                </li>
                {matchingStudents.map((s) => {
                  const isExcluded = manuallyExcluded.has(s.id);
                  return (
                    <li
                      key={s.id}
                      className="grid grid-cols-[24px_1fr_120px_80px_80px] items-center gap-2 px-3 py-2 text-xs hover:bg-muted/30"
                    >
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => toggle(s.id)}
                        className="h-3.5 w-3.5 accent-portal-accent"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{s.email}</p>
                      </div>
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {s.studentId || "—"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.yearOfStudy ? `Year ${s.yearOfStudy}` : "—"}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">{s.department || "—"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {!studentsLoaded && (
        <p className="text-xs text-muted-foreground italic">
          Pick a department + branch + year (any/all), then click <strong>View students</strong> to load the list.
        </p>
      )}
    </div>
  );
}


// ─── Assign Faculty Drawer ──────────────────────────────────────────────────

export function AssignFacultyDialog({
  open,
  onClose,
  offering,
}: {
  open: boolean;
  onClose: () => void;
  offering: CourseOffering | null;
}) {
  const assignFaculty = useAssignFaculty();
  const { data: facultyData } = useAdminUsers({
    role: "faculty",
    status: "active",
    pageSize: 200,
  });
  const [facultyId, setFacultyId] = useState("");

  useEffect(() => {
    if (open) setFacultyId("");
  }, [open]);

  const facultyOptions = useMemo(() => {
    const list = facultyData?.users ?? [];
    return [
      { value: "", label: "Select a faculty member..." },
      ...list.map((f) => ({
        value: f.id,
        label: `${f.name} · ${f.department}`,
      })),
    ];
  }, [facultyData]);

  const handleAssign = useCallback(async () => {
    if (!offering || !facultyId) return;
    try {
      await assignFaculty.mutateAsync({
        offeringId: offering.id,
        facultyId,
      });
      toast.success(
        `Faculty assigned. ${offering.catalogCode} is now active for ${offering.sectionName}.`,
      );
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not assign faculty."));
    }
  }, [offering, facultyId, assignFaculty, onClose]);

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="md"
      title="Assign Faculty"
      description={
        offering
          ? `${offering.catalogCode} · ${offering.sectionName} · ${offering.semesterName}`
          : ""
      }
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={assignFaculty.isPending || !facultyId}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {assignFaculty.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Assign Faculty
          </button>
        </div>
      }
    >
      <FormSelect
        label="Faculty"
        options={facultyOptions}
        value={facultyId}
        onChange={(e) => setFacultyId(e.target.value)}
        required
      />
    </SlideDrawer>
  );
}
