"use client";

import React, { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Hash,
  Layers3,
  Building2,
  User,
  Users,
  Calendar,
  BookText,
  AlertCircle,
  Mail,
  X,
  Archive,
  ArchiveRestore,
  UserCog,
  ClipboardList,
  Search,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useOfferingDetail,
  useUpdateOffering,
  useUnenrollStudent,
  useAdminUsers,
  useReplaceOfferingEnrollments,
  usePrograms,
} from "@/admin/lib/hooks/use-admin";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { AssignFacultyDialog, StudentEnrollmentPicker } from "../_components/drawers";
import { cn } from "@/admin/lib/utils/cn";
import type { AdminUser, CourseType } from "@/admin/lib/api/types/admin.types";

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  core: "Core",
  programme_elective: "Programme Elective",
  open_elective: "Open Elective",
};

function getCourseTypeVariant(
  type: CourseType,
): "info" | "warning" | "default" {
  return type === "core"
    ? "info"
    : type === "programme_elective"
      ? "warning"
      : "default";
}

function getStatusVariant(
  status: "draft" | "active" | "archived",
): "warning" | "success" | "muted" {
  return status === "draft"
    ? "warning"
    : status === "active"
      ? "success"
      : "muted";
}

type Tab = "overview" | "roster";

export default function OfferingDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { courseId } = use(params);

  const tab = (searchParams.get("tab") as Tab) ?? "overview";
  const setTab = useCallback(
    (next: Tab) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("tab", next);
      router.replace(`?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useOfferingDetail(courseId);
  // Was useUpdateCourse, which PATCHes /api/admin/courses/{id} (the catalog
  // row). Offerings live at /api/admin/course-offerings/{id} so Archive was
  // silently hitting the wrong row. useUpdateOffering is the correct hook.
  const updateOffering = useUpdateOffering();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);

  const isArchived = course?.status === "archived";
  const needsFaculty = course && !course.facultyId;

  const handleArchive = useCallback(async () => {
    if (!course) return;
    const next = isArchived ? "active" : "archived";
    try {
      await updateOffering.mutateAsync({ id: course.id, status: next });
      toast.success(
        next === "archived"
          ? `${course.catalogCode} archived. Existing students keep access to past materials.`
          : `${course.catalogCode} restored.`,
      );
    } catch {
      toast.error("Could not change offering status.");
    }
  }, [course, isArchived, updateOffering]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="Failed to load offering"
          message="Could not retrieve the offering."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-portal-accent">
              {course.catalogCode}
            </span>
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {course.regulationSnapshot}
            </span>
            <StatusBadge variant={getCourseTypeVariant(course.courseType)}>
              {COURSE_TYPE_LABEL[course.courseType]}
            </StatusBadge>
            <StatusBadge variant={getStatusVariant(course.status)} dot>
              {course.status}
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{course.catalogName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.sectionName} · {course.semesterName} ·{" "}
            {course.academicYearName}
          </p>
          {course.catalogId && (
            <Link
              href={`/admin/courses/catalog/${course.catalogId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
            >
              <BookText className="h-3 w-3" />
              View catalog entry
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isArchived && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit details
            </button>
          )}
          {!isArchived && (
            <button
              type="button"
              onClick={() => setRosterOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Users className="h-3.5 w-3.5" />
              Manage roster
            </button>
          )}
          {!isArchived && needsFaculty && (
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-portal-accent/40 bg-portal-accent-light px-3 py-2 text-sm font-medium text-portal-accent transition-colors hover:bg-portal-accent-light/80"
            >
              <UserCog className="h-3.5 w-3.5" />
              Assign faculty
            </button>
          )}
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              isArchived
                ? "border-success/30 text-success hover:bg-success-light"
                : "border-danger/30 text-danger hover:bg-danger-light",
            )}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-3.5 w-3.5" /> Restore
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5" /> Archive
              </>
            )}
          </button>
        </div>
      </div>

      {/* Draft warning */}
      {course.status === "draft" && !course.facultyId && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            This offering is in <strong>Draft</strong> — assign faculty to make
            it visible in the faculty and student portals.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <TabButton
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={ClipboardList}
          label="Overview"
        />
        <TabButton
          active={tab === "roster"}
          onClick={() => setTab("roster")}
          icon={Users}
          label="Roster"
          count={course.enrolledCount}
        />
      </div>

      {tab === "overview" ? (
        <OverviewTab course={course} />
      ) : (
        <RosterTab
          courseId={course.id}
          enrolledIds={course.enrolledStudentIds ?? []}
          isArchived={isArchived ?? false}
          courseCode={course.catalogCode}
        />
      )}

      <EditOfferingDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        offering={course}
      />
      <ManageRosterDialog
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        offering={course}
      />
      <AssignFacultyDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        offering={course}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? "Restore offering" : "Archive offering"}
        description={
          isArchived
            ? `Restore "${course.catalogCode}" for ${course.sectionName}? Faculty and students will see it again.`
            : `Archive "${course.catalogCode}" for ${course.sectionName}? Existing enrollments are preserved; new ones are blocked.`
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        variant={isArchived ? "default" : "danger"}
        onConfirm={handleArchive}
      />
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] tabular-nums",
            active
              ? "bg-portal-accent-light text-portal-accent"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Overview Tab ──────────────────────────────────────────────────────── */

function OverviewTab({
  course,
}: {
  course: NonNullable<ReturnType<typeof useOfferingDetail>["data"]>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={Hash}
          label="Credits"
          value={`${course.creditsSnapshot} credit${course.creditsSnapshot !== 1 ? "s" : ""}`}
        />
        <InfoCard
          icon={Layers3}
          label="Weekly L:T:P"
          value={`${course.lectureHours} : ${course.tutorialHours} : ${course.practicalHours}`}
        />
        <InfoCard
          icon={GraduationCap}
          label="Specialization"
          value={course.department}
        />
        <InfoCard
          icon={User}
          label="Faculty"
          value={course.facultyName ?? "Unassigned"}
        />
        <InfoCard
          icon={Building2}
          label="Programme"
          value={course.programmeName}
          hint={`Year ${course.studyYear}`}
        />
        <InfoCard
          icon={Calendar}
          label="Term"
          value={course.semesterName}
          hint={course.academicYearName}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Users className="h-4 w-4" /> Enrollment
        </div>
        <p className="mt-3 text-sm">
          <span className="text-3xl font-semibold text-foreground">
            {course.enrolledCount}
          </span>
          <span className="ml-2 text-muted-foreground">
            student{course.enrolledCount === 1 ? "" : "s"} enrolled
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open enrolment — anyone can join.
        </p>
      </div>
    </div>
  );
}

/* ── Roster Tab ────────────────────────────────────────────────────────── */

function RosterTab({
  courseId,
  enrolledIds,
  isArchived,
  courseCode,
}: {
  courseId: string;
  enrolledIds: string[];
  isArchived: boolean;
  courseCode: string;
}) {
  const unenrollStudent = useUnenrollStudent();
  const { data: studentsData, isLoading } = useAdminUsers({
    role: "student",
    pageSize: 500,
  });
  const allStudents = studentsData?.users ?? [];

  const enrolled: AdminUser[] = useMemo(
    () => allStudents.filter((s) => enrolledIds.includes(s.id)),
    [allStudents, enrolledIds],
  );

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return enrolled;
    const q = search.toLowerCase();
    return enrolled.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentId ?? "").toLowerCase().includes(q),
    );
  }, [enrolled, search]);

  const [unenrollConfirm, setUnenrollConfirm] = useState<{
    open: boolean;
    student: AdminUser | null;
  }>({ open: false, student: null });

  const handleUnenroll = useCallback(async () => {
    if (!unenrollConfirm.student) return;
    try {
      await unenrollStudent.mutateAsync({
        courseId,
        studentId: unenrollConfirm.student.id,
      });
      toast.success(
        `${unenrollConfirm.student.name} unenrolled from ${courseCode}`,
      );
    } catch {
      toast.error("Failed to unenroll student");
    }
  }, [courseId, courseCode, unenrollConfirm.student, unenrollStudent]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {enrolled.length} enrolled{search ? ` · ${filtered.length} match` : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-5">
            <CardSkeleton />
          </div>
        ) : enrolled.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No students enrolled</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {isArchived
                ? "This offering is archived; no student records were retained on it."
                : "Students will appear here once enrolled."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No students match &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Student
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Department
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-portal-accent-light text-xs font-semibold text-portal-accent">
                          {s.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {s.name}
                          </p>
                          {s.studentId && (
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {s.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {s.department}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isArchived && (
                        <button
                          type="button"
                          onClick={() =>
                            setUnenrollConfirm({ open: true, student: s })
                          }
                          className="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
                        >
                          <X className="mr-1 inline h-3 w-3" />
                          Unenroll
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={unenrollConfirm.open}
        onOpenChange={(o) => setUnenrollConfirm((p) => ({ ...p, open: o }))}
        title="Unenroll Student"
        description={
          unenrollConfirm.student
            ? `Remove ${unenrollConfirm.student.name} from ${courseCode}? Their grade history (if any) is preserved.`
            : ""
        }
        confirmLabel="Unenroll"
        variant="danger"
        onConfirm={handleUnenroll}
      />
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

/* ── Manage Roster dialog ─────────────────────────────────────────────────
 * Reuses the same `StudentEnrollmentPicker` that the Schedule Offering
 * drawer uses, pre-filled with the current roster. On save, sends the
 * full selected set to `PUT /course-offerings/{id}/enrollments` which
 * does the diff on the server (inserts new, marks departing students
 * dropped — preserving their history rather than hard-deleting).
 *
 * Why a full dialog rather than inlining into "Edit details":
 *   - Roster management is a high-touch UI (search, filters, scrollable
 *     student grid). Sharing the dialog with the small "branch/year/cap"
 *     form would force everything into one cramped surface.
 *   - The semantics differ: Edit details is a partial PATCH that touches
 *     a few simple columns. Roster replacement is a destructive "replace
 *     the set" operation that benefits from its own affordance + confirm.
 */
function ManageRosterDialog({
  open,
  onClose,
  offering,
}: {
  open: boolean;
  onClose: () => void;
  offering: NonNullable<ReturnType<typeof useOfferingDetail>["data"]>;
}) {
  const replaceEnrollments = useReplaceOfferingEnrollments();
  const { data: studentsPage } = useAdminUsers({ role: "student", pageSize: 5000 });
  const { data: programsData } = usePrograms({ status: "active" });
  const allStudents = useMemo(() => studentsPage?.users ?? [], [studentsPage]);
  const programmes = useMemo(
    () => (programsData?.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      department: p.department,
      degreeType: p.degreeType,
    })),
    [programsData],
  );

  // Picker value mirrors the current roster on open; admin edits in-place
  // and submits the new full set. Resets when the dialog is re-opened so
  // an aborted edit doesn't leak into the next session.
  const [picked, setPicked] = useState<string[]>(offering.enrolledStudentIds ?? []);
  React.useEffect(() => {
    if (open) setPicked(offering.enrolledStudentIds ?? []);
  }, [open, offering.id, offering.enrolledStudentIds]);

  const handleSave = async () => {
    try {
      const res = await replaceEnrollments.mutateAsync({
        id: offering.id,
        studentIds: picked,
      });
      const r = res.data;
      toast.success(
        `Roster updated · ${r.enrolled} enrolled` +
          (r.added > 0 ? ` (+${r.added})` : "") +
          (r.dropped > 0 ? ` (-${r.dropped})` : ""),
      );
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update roster.");
    }
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mt-[6vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[88vh]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Manage roster</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {offering.catalogCode} — {offering.catalogName} · {offering.enrolledCount} currently enrolled
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <StudentEnrollmentPicker
            allStudents={allStudents}
            programmes={programmes}
            academicYearId={offering.academicYearId}
            value={picked}
            onChange={setPicked}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={replaceEnrollments.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={replaceEnrollments.isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {replaceEnrollments.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save roster ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/courses?tab=offerings"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Courses
    </Link>
  );
}

/* ── Edit Offering dialog ─────────────────────────────────────────────────
 * Editable subset for an offering — branch, year of study, section, and
 * max capacity. Catalog-level attributes (code, name, credits, regulation,
 * L:T:P) belong on the catalog row, NOT here. Term/AY can't be edited
 * either — moving an offering between semesters would orphan its
 * enrollments, so the right path is "archive + create new".
 *
 * Faculty assignment has its own dedicated dialog (AssignFacultyDialog)
 * because it has special UX (filter by department, search, etc.). Keeping
 * that flow separate from the simple field edits.
 */
function EditOfferingDialog({
  open,
  onClose,
  offering,
}: {
  open: boolean;
  onClose: () => void;
  offering: NonNullable<ReturnType<typeof useOfferingDetail>["data"]>;
}) {
  const updateOffering = useUpdateOffering();
  const [form, setForm] = useState({
    branch: offering.branch || "",
    section: offering.section || "",
    yearOfStudy: offering.studyYear || 1,
    maxCapacity: offering.maxCapacity || 60,
  });
  const [error, setError] = useState("");

  // Re-seed when the offering changes or the dialog re-opens — same trick
  // as the program-edit dialog (useForm's defaults are mount-only).
  React.useEffect(() => {
    if (!open) return;
    setForm({
      branch: offering.branch || "",
      section: offering.section || "",
      yearOfStudy: offering.studyYear || 1,
      maxCapacity: offering.maxCapacity || 60,
    });
    setError("");
    updateOffering.reset();
  }, [open, offering.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSave = async () => {
    const year = Number(form.yearOfStudy);
    if (!Number.isFinite(year) || year < 1 || year > 6) {
      setError("Year of study must be between 1 and 6.");
      return;
    }
    const cap = Number(form.maxCapacity);
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Max capacity must be at least 1.");
      return;
    }
    try {
      await updateOffering.mutateAsync({
        id: offering.id,
        branch: form.branch.trim() || undefined,
        section: form.section.trim() || undefined,
        yearOfStudy: year,
        maxCapacity: cap,
      });
      toast.success(`${offering.catalogCode} updated.`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update offering.");
    }
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mt-[8vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[85vh]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Edit offering</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {offering.catalogCode} — {offering.catalogName}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Branch</label>
              <input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                placeholder="e.g. CSE"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Section</label>
              <input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="e.g. A"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Year of Study</label>
              <select
                value={form.yearOfStudy}
                onChange={(e) => setForm({ ...form, yearOfStudy: parseInt(e.target.value, 10) })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
              >
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Max Capacity</label>
              <input
                type="number"
                min={1}
                value={form.maxCapacity}
                onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value, 10) || 0 })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <p className="text-[11px] text-muted-foreground">
            Catalog attributes (code, name, credits) live on the catalog row — change them via Course Catalog &rarr; Edit. Term / AY are immutable here.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={updateOffering.isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={updateOffering.isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {updateOffering.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
