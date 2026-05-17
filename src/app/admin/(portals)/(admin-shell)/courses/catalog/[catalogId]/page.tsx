"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Hash,
  Layers3,
  Building2,
  CalendarRange,
  BookText,
  AlertCircle,
  Pencil,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCatalogDetail,
  useCourseOfferings,
  useUpdateCatalog,
  useDepartments,
} from "@/admin/lib/hooks/use-admin";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { CatalogDrawer } from "../../_components/drawers";
import { cn } from "@/admin/lib/utils/cn";
import type { CourseType } from "@/admin/lib/api/types/admin.types";

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

function getOfferingStatusVariant(
  status: "draft" | "active" | "archived",
): "warning" | "success" | "muted" {
  return status === "draft"
    ? "warning"
    : status === "active"
      ? "success"
      : "muted";
}

export default function CatalogDetailPage({
  params,
}: {
  params: Promise<{ catalogId: string }>;
}) {
  const router = useRouter();
  const { catalogId } = use(params);
  const {
    data: catalog,
    isLoading,
    isError,
    refetch,
  } = useCatalogDetail(catalogId);

  const { data: departments } = useDepartments();
  const departmentOptions = useMemo(
    () => (departments ?? []).map((d) => ({ value: d.id, label: d.name })),
    [departments],
  );

  // Pull every offering that references this catalog so admins can see
  // exactly where (and when) the course has been scheduled.
  const { data: offeringsData, isLoading: offeringsLoading } =
    useCourseOfferings({
      catalogId,
      pageSize: 100,
    });
  const offerings = offeringsData?.offerings ?? [];

  const draftOfferings = useMemo(
    () => offerings.filter((o) => o.status === "draft"),
    [offerings],
  );

  const updateCatalog = useUpdateCatalog();
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const isArchived = catalog?.status === "archived";

  const handleArchive = useCallback(async () => {
    if (!catalog) return;
    const next = isArchived ? "active" : "archived";
    try {
      await updateCatalog.mutateAsync({ id: catalog.id, status: next });
      toast.success(
        next === "archived"
          ? `${catalog.code} archived. Existing offerings remain.`
          : `${catalog.code} restored.`,
      );
    } catch {
      toast.error("Could not change catalog status.");
    }
  }, [catalog, isArchived, updateCatalog]);

  const goSchedule = useCallback(() => {
    if (!catalog) return;
    router.push(`/admin/courses?tab=offerings&preselect=${catalog.id}`);
  }, [catalog, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="grid gap-4 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !catalog) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="Failed to load catalog course"
          message="Could not retrieve the catalog entry."
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
              {catalog.code}
            </span>
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {catalog.regulation}
            </span>
            <StatusBadge variant={getCourseTypeVariant(catalog.courseType)}>
              {COURSE_TYPE_LABEL[catalog.courseType]}
            </StatusBadge>
            <StatusBadge
              variant={isArchived ? "muted" : "success"}
              dot
            >
              {catalog.status}
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{catalog.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {catalog.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isArchived && (
            <>
              <button
                type="button"
                onClick={goSchedule}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Schedule offering
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-3 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit catalog
              </button>
            </>
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={Hash}
          label="Credits"
          value={`${catalog.credits} credit${catalog.credits !== 1 ? "s" : ""}`}
        />
        <InfoCard
          icon={Layers3}
          label="Weekly L:T:P"
          value={`${catalog.lectureHours} : ${catalog.tutorialHours} : ${catalog.practicalHours}`}
          hint="Lecture · Tutorial · Practical hours per week"
        />
        <InfoCard
          icon={Building2}
          label="Owning Specialization"
          value={catalog.owningDepartmentName ?? "Cross-cutting"}
        />
        <InfoCard
          icon={CalendarRange}
          label="Active Offerings"
          value={`${offerings.length} scheduled`}
        />
      </div>

      {/* Syllabus */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <BookText className="h-4 w-4" />
          Syllabus (Master)
        </div>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {catalog.syllabus}
        </pre>
        <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Edits to the syllabus apply to <strong>future offerings only</strong>.
          Past offerings keep the snapshot they were created with — important
          for transcript fidelity.
        </p>
      </div>

      {/* Scheduled offerings */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold">Scheduled Offerings</h2>
            <p className="text-xs text-muted-foreground">
              Where and when this course is being taught.
            </p>
          </div>
          {!isArchived && (
            <button
              type="button"
              onClick={goSchedule}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              Schedule another
            </button>
          )}
        </div>

        {draftOfferings.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border bg-warning-light/40 px-5 py-3 text-xs text-warning">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {draftOfferings.length} of these offering
              {draftOfferings.length === 1 ? "" : "s"}
              {draftOfferings.length === 1 ? " is" : " are"} in{" "}
              <strong>Draft</strong> — faculty hasn&apos;t been assigned yet.
            </span>
          </div>
        )}

        {offeringsLoading ? (
          <div className="p-5">
            <CardSkeleton />
          </div>
        ) : offerings.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <CalendarRange className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">
              No offerings scheduled yet
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              This catalog course hasn&apos;t been scheduled. Use{" "}
              <button
                type="button"
                onClick={goSchedule}
                className="font-medium text-portal-accent underline-offset-4 hover:underline"
              >
                Schedule offering
              </button>{" "}
              to add it to a section.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Section
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Programme · Year
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Term
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Faculty
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enrolled
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    onClick={() => router.push(`/admin/courses/${o.id}`)}
                  >
                    <td className="px-5 py-3 text-sm font-medium">
                      {o.sectionName || "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {o.programmeName} · Year {o.studyYear}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {o.semesterName}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {o.academicYearName}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {o.facultyName ? (
                        o.facultyName
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <AlertCircle className="h-3 w-3" /> Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums">
                      {o.enrolledCount}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        variant={getOfferingStatusVariant(o.status)}
                        dot
                      >
                        {o.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CatalogDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editing={catalog}
        departmentOptions={departmentOptions}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? "Restore catalog course" : "Archive catalog course"}
        description={
          isArchived
            ? `Restore "${catalog.code}"? It will become available for new offerings again.`
            : `Archive "${catalog.code} — ${catalog.name}"? Existing offerings remain — only future scheduling is blocked. (${offerings.length} active offering${offerings.length === 1 ? "" : "s"})`
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        variant={isArchived ? "default" : "danger"}
        onConfirm={handleArchive}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/courses"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Courses
    </Link>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof GraduationCap;
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
