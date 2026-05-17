"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  ArchiveRestore,
  Eye,
  Library,
  CalendarRange,
  AlertCircle,
  UserCog,
  Layers,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useCourseCatalog,
  useUpdateCatalog,
  useCourseOfferings,
  useDepartments,
  useAcademicYears,
  useUpdateCourse,
} from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { DataTable } from "@/admin/components/shared/data-table";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import {
  CatalogDrawer,
  OfferingDrawer,
  AssignFacultyDialog,
} from "./_components/drawers";
import { cn } from "@/admin/lib/utils/cn";
import type {
  CourseCatalog,
  CourseOffering,
  CourseType,
} from "@/admin/lib/api/types/admin.types";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const COURSE_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  ...COURSE_TYPE_OPTIONS,
];

const CATALOG_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const OFFERING_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

// ─── FilterSelect (chevron-decorated, label-less) ────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex h-10 appearance-none rounded-lg border border-input bg-background pl-3 pr-9 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

// ─── Variants ────────────────────────────────────────────────────────────────

function getCatalogStatusVariant(
  status: CourseCatalog["status"],
): "success" | "muted" {
  return status === "active" ? "success" : "muted";
}

function getOfferingStatusVariant(
  status: CourseOffering["status"],
): "warning" | "success" | "muted" {
  return status === "draft"
    ? "warning"
    : status === "active"
      ? "success"
      : "muted";
}

function getCourseTypeVariant(
  type: CourseType,
): "info" | "warning" | "default" {
  return type === "core"
    ? "info"
    : type === "programme_elective"
      ? "warning"
      : "default";
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

function CatalogRowActions({
  row,
  onView,
  onEdit,
  onAddOffering,
  onArchive,
}: {
  row: CourseCatalog;
  onView: () => void;
  onEdit: () => void;
  onAddOffering: () => void;
  onArchive: () => void;
}) {
  const isArchived = row.status === "archived";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Row actions"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          <DropdownMenu.Item
            onSelect={onView}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            View details
          </DropdownMenu.Item>
          {!isArchived && (
            <>
              <DropdownMenu.Item
                onSelect={onAddOffering}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
              >
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                Schedule offering
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onEdit}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit catalog
              </DropdownMenu.Item>
            </>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onArchive}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isArchived ? "text-success" : "text-danger",
            )}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" /> Restore
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" /> Archive
              </>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function OfferingRowActions({
  row,
  onView,
  onAssignFaculty,
  onArchive,
}: {
  row: CourseOffering;
  onView: () => void;
  onAssignFaculty: () => void;
  onArchive: () => void;
}) {
  const isArchived = row.status === "archived";
  const needsFaculty = !row.facultyId;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Row actions"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          {/* View / Edit — the detail page IS the editing surface. Renamed
              so the admin doesn't think Edit is missing on offerings (the
              user pushed back on "no edit option" — there's no inline-edit
              drawer for offerings yet; everything happens on the detail
              page: assign/change faculty, archive/restore, manage roster). */}
          <DropdownMenu.Item
            onSelect={onView}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" /> View / Edit
          </DropdownMenu.Item>
          {!isArchived && needsFaculty && (
            <DropdownMenu.Item
              onSelect={onAssignFaculty}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-portal-accent outline-none transition-colors hover:bg-muted focus:bg-muted"
            >
              <UserCog className="h-4 w-4" /> Assign faculty
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onArchive}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isArchived ? "text-success" : "text-danger",
            )}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" /> Restore
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" /> Archive
              </>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Catalog Tab ─────────────────────────────────────────────────────────────

function CatalogTab({
  onAddOfferingFor,
}: {
  onAddOfferingFor: (catalogId: string) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState<{
    open: boolean;
    editing: CourseCatalog | null;
  }>({ open: false, editing: null });
  const [archiveConfirm, setArchiveConfirm] = useState<{
    open: boolean;
    row: CourseCatalog | null;
  }>({ open: false, row: null });

  const { data, isLoading, isError, refetch } = useCourseCatalog({
    search: search || undefined,
    departmentId: deptFilter || undefined,
    courseType: typeFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });
  const { data: departments } = useDepartments();
  const updateCatalog = useUpdateCatalog();

  const departmentOptions = useMemo(
    () => (departments ?? []).map((d) => ({ value: d.id, label: d.name })),
    [departments],
  );
  const departmentFilterOptions = useMemo(
    () => [{ value: "", label: "All Specializations" }, ...departmentOptions],
    [departmentOptions],
  );

  const handleArchive = useCallback(async () => {
    if (!archiveConfirm.row) return;
    const row = archiveConfirm.row;
    const next = row.status === "archived" ? "active" : "archived";
    try {
      await updateCatalog.mutateAsync({ id: row.id, status: next });
      toast.success(
        next === "archived"
          ? `${row.code} archived. Existing offerings remain.`
          : `${row.code} restored.`,
      );
    } catch {
      toast.error("Could not change catalog status.");
    }
  }, [archiveConfirm.row, updateCatalog]);

  const columns: ColumnDef<CourseCatalog>[] = useMemo(
    () => [
      {
        id: "course",
        header: "Course",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="min-w-0 max-w-72">
              <p className="truncate font-medium">
                <span className="font-mono text-xs text-portal-accent">
                  {c.code}
                </span>{" "}
                <span className="text-foreground">{c.name}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {c.owningDepartmentName ?? "Cross-cutting"}
              </p>
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <StatusBadge variant={getCourseTypeVariant(row.original.courseType)}>
            {COURSE_TYPE_LABEL[row.original.courseType]}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "regulation",
        header: "Regulation",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue())}</span>
        ),
      },
      {
        id: "creditsLtp",
        header: "Credits · L:T:P",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <span className="text-sm tabular-nums">
              {c.credits} cr
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {c.lectureHours}:{c.tutorialHours}:{c.practicalHours}
              </span>
            </span>
          );
        },
      },
      {
        id: "offeringCount",
        header: "Offerings",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.offeringCount}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as CourseCatalog["status"];
          return (
            <StatusBadge variant={getCatalogStatusVariant(status)} dot>
              {status}
            </StatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        meta: { cellClassName: "w-12" },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <CatalogRowActions
              row={row.original}
              onView={() =>
                router.push(`/admin/courses/catalog/${row.original.id}`)
              }
              onEdit={() => setDrawer({ open: true, editing: row.original })}
              onAddOffering={() => onAddOfferingFor(row.original.id)}
              onArchive={() =>
                setArchiveConfirm({ open: true, row: row.original })
              }
            />
          </div>
        ),
      },
    ],
    [onAddOfferingFor, router],
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by code, name, description..."
          className="w-full sm:max-w-xs"
        />
        <FilterSelect
          value={deptFilter}
          onChange={(v) => {
            setDeptFilter(v);
            setPage(1);
          }}
          options={departmentFilterOptions}
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          options={COURSE_TYPE_FILTER_OPTIONS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={CATALOG_STATUS_OPTIONS}
        />
        <div className="ml-auto">
          <button
            onClick={() => setDrawer({ open: true, editing: null })}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Add Catalog Course
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load catalog"
          message="Could not retrieve the course catalog."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.catalog ?? []}
            showSearch={false}
            showPagination={false}
            emptyTitle="No catalog courses yet"
            emptyDescription="Add your first course to start building the catalog."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} page={page} onPageChange={setPage} />
          )}
        </>
      )}

      <CatalogDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, editing: null })}
        editing={drawer.editing}
        departmentOptions={departmentOptions}
      />
      <ConfirmDialog
        open={archiveConfirm.open}
        onOpenChange={(o) => setArchiveConfirm((p) => ({ ...p, open: o }))}
        title={
          archiveConfirm.row?.status === "archived"
            ? "Restore catalog course"
            : "Archive catalog course"
        }
        description={
          archiveConfirm.row?.status === "archived"
            ? `Restore "${archiveConfirm.row?.code}"? It will become available for new offerings again.`
            : `Archive "${archiveConfirm.row?.code} — ${archiveConfirm.row?.name}"? Existing offerings remain — only future scheduling is blocked. (${archiveConfirm.row?.offeringCount ?? 0} active offering${archiveConfirm.row?.offeringCount === 1 ? "" : "s"})`
        }
        confirmLabel={
          archiveConfirm.row?.status === "archived" ? "Restore" : "Archive"
        }
        variant={
          archiveConfirm.row?.status === "archived" ? "default" : "danger"
        }
        onConfirm={handleArchive}
      />
    </div>
  );
}

// ─── Offerings Tab ───────────────────────────────────────────────────────────

function OfferingsTab({
  preselectedCatalogId,
  clearPreselect,
}: {
  preselectedCatalogId?: string;
  clearPreselect: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignFaculty, setAssignFaculty] = useState<{
    open: boolean;
    offering: CourseOffering | null;
  }>({ open: false, offering: null });
  const [archiveConfirm, setArchiveConfirm] = useState<{
    open: boolean;
    row: CourseOffering | null;
  }>({ open: false, row: null });

  // Open the create-offering drawer automatically if a catalog row triggered
  // the navigation (Schedule offering from a catalog row or detail page).
  useEffect(() => {
    if (preselectedCatalogId) setDrawerOpen(true);
  }, [preselectedCatalogId]);

  const { data, isLoading, isError, refetch } = useCourseOfferings({
    search: search || undefined,
    academicYearId: academicYearFilter || undefined,
    semesterId: semesterFilter || undefined,
    courseType: typeFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });
  const { data: academicYears } = useAcademicYears();
  const updateCourse = useUpdateCourse();

  const academicYearOptions = useMemo(() => {
    const list = academicYears ?? [];
    return [
      { value: "", label: "All Academic Years" },
      ...list.map((y) => ({ value: y.id, label: y.name })),
    ];
  }, [academicYears]);

  const semesterOptions = useMemo(() => {
    const ay = academicYears?.find((y) => y.id === academicYearFilter);
    return [
      { value: "", label: ay ? "All Semesters" : "All Semesters (pick year)" },
      ...(ay?.semesters ?? []).map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [academicYears, academicYearFilter]);

  const handleArchive = useCallback(async () => {
    if (!archiveConfirm.row) return;
    const row = archiveConfirm.row;
    const next = row.status === "archived" ? "active" : "archived";
    try {
      await updateCourse.mutateAsync({ id: row.id, status: next });
      toast.success(
        next === "archived"
          ? `Offering archived. Existing students keep access to past materials.`
          : `Offering restored.`,
      );
    } catch {
      toast.error("Could not change offering status.");
    }
  }, [archiveConfirm.row, updateCourse]);

  // Surface the count of draft offerings so the page header can warn admins
  // that some offerings need faculty before they're actually being taught.
  const draftCount = useMemo(
    () => (data?.offerings ?? []).filter((o) => o.status === "draft").length,
    [data?.offerings],
  );

  const columns: ColumnDef<CourseOffering>[] = useMemo(
    () => [
      {
        id: "course",
        header: "Course",
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium">
                <span className="font-mono text-xs text-portal-accent">
                  {o.catalogCode}
                </span>{" "}
                <span>{o.catalogName}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono">{o.regulationSnapshot}</span> ·{" "}
                {COURSE_TYPE_LABEL[o.courseType]} · {o.creditsSnapshot}cr
              </p>
            </div>
          );
        },
      },
      {
        id: "section",
        header: "Section",
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {o.sectionName || (
                  <span className="italic text-muted-foreground">—</span>
                )}
              </p>
              <p className="mt-0.5 max-w-45 truncate text-xs text-muted-foreground">
                {o.programmeName} · Year {o.studyYear}
              </p>
            </div>
          );
        },
      },
      {
        id: "term",
        header: "Term",
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="min-w-0">
              <p className="text-sm">{o.semesterName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {o.academicYearName}
              </p>
            </div>
          );
        },
      },
      {
        id: "faculty",
        header: "Faculty",
        cell: ({ row }) => {
          const o = row.original;
          if (!o.facultyId) {
            return (
              <div className="flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                <span className="font-medium text-warning">Unassigned</span>
              </div>
            );
          }
          return <span className="text-sm">{o.facultyName}</span>;
        },
      },
      {
        id: "enrollment",
        header: "Enrolled",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.enrolledCount}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as CourseOffering["status"];
          return (
            <StatusBadge variant={getOfferingStatusVariant(status)} dot>
              {status}
            </StatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        meta: { cellClassName: "w-12" },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <OfferingRowActions
              row={row.original}
              onView={() => router.push(`/admin/courses/${row.original.id}`)}
              onAssignFaculty={() =>
                setAssignFaculty({ open: true, offering: row.original })
              }
              onArchive={() =>
                setArchiveConfirm({ open: true, row: row.original })
              }
            />
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by course, section, faculty..."
          className="w-full sm:max-w-xs"
        />
        <FilterSelect
          value={academicYearFilter}
          onChange={(v) => {
            setAcademicYearFilter(v);
            setSemesterFilter("");
            setPage(1);
          }}
          options={academicYearOptions}
        />
        <FilterSelect
          value={semesterFilter}
          onChange={(v) => {
            setSemesterFilter(v);
            setPage(1);
          }}
          disabled={!academicYearFilter}
          options={semesterOptions}
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          options={COURSE_TYPE_FILTER_OPTIONS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={OFFERING_STATUS_OPTIONS}
        />
        <div className="ml-auto">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Schedule Offering
          </button>
        </div>
      </div>

      {/* Draft warning chip */}
      {draftCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            {draftCount} offering{draftCount === 1 ? "" : "s"}{" "}
            {draftCount === 1 ? "is" : "are"} in
            <strong className="mx-1">Draft</strong>— assign faculty to activate
            them so the faculty and student portals can render the schedule.
          </span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load offerings"
          message="Could not retrieve the offerings list."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.offerings ?? []}
            showSearch={false}
            showPagination={false}
            emptyTitle="No offerings scheduled"
            emptyDescription="Schedule a course offering to start a new term."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} page={page} onPageChange={setPage} />
          )}
        </>
      )}

      <OfferingDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          clearPreselect();
        }}
        preselectedCatalogId={preselectedCatalogId}
      />
      <AssignFacultyDialog
        open={assignFaculty.open}
        onClose={() => setAssignFaculty({ open: false, offering: null })}
        offering={assignFaculty.offering}
      />
      <ConfirmDialog
        open={archiveConfirm.open}
        onOpenChange={(o) => setArchiveConfirm((p) => ({ ...p, open: o }))}
        title={
          archiveConfirm.row?.status === "archived"
            ? "Restore offering"
            : "Archive offering"
        }
        description={
          archiveConfirm.row?.status === "archived"
            ? `Restore "${archiveConfirm.row?.catalogCode}" for ${archiveConfirm.row?.sectionName}? Faculty and students will see it again.`
            : `Archive "${archiveConfirm.row?.catalogCode}" for ${archiveConfirm.row?.sectionName}? Existing enrollments are preserved; new ones are blocked.`
        }
        confirmLabel={
          archiveConfirm.row?.status === "archived" ? "Restore" : "Archive"
        }
        variant={
          archiveConfirm.row?.status === "archived" ? "default" : "danger"
        }
        onConfirm={handleArchive}
      />
    </div>
  );
}

// ─── Pagination Footer ──────────────────────────────────────────────────────

function Pagination({
  meta,
  page,
  onPageChange,
}: {
  meta: { page: number; totalPages: number; total: number };
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPages} ({meta.total} rows)
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
          disabled={page >= meta.totalPages}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Page Shell ──────────────────────────────────────────────────────────────

type Tab = "catalog" | "offerings";

export default function AdminCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const preselectParam = searchParams.get("preselect") ?? undefined;

  // The catalog detail page links here with `?tab=offerings&preselect=<id>`
  // when the user clicks "Schedule offering". Honor the URL on first paint
  // and then strip the params so a refresh doesn't re-trigger the drawer.
  const initialTab: Tab =
    tabParam === "offerings" || preselectParam ? "offerings" : "catalog";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [preselectedCatalogId, setPreselectedCatalogId] = useState<
    string | undefined
  >(preselectParam);

  // Wipe the search params after we've consumed them so the URL is clean.
  useEffect(() => {
    if (tabParam || preselectParam) {
      router.replace("/admin/courses");
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddOfferingFor = useCallback((catalogId: string) => {
    setPreselectedCatalogId(catalogId);
    setTab("offerings");
  }, []);

  const clearPreselect = useCallback(() => {
    setPreselectedCatalogId(undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Courses"
        description="Define courses once in the catalog. Schedule them across sections and terms as offerings."
      />

      {/* Tab bar */}
      <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <TabButton
          active={tab === "catalog"}
          onClick={() => setTab("catalog")}
          icon={Library}
          label="Course Catalog"
          hint="Master list"
        />
        <TabButton
          active={tab === "offerings"}
          onClick={() => setTab("offerings")}
          icon={Layers}
          label="Section Offerings"
          hint="Scheduled instances"
        />
      </div>

      {tab === "catalog" ? (
        <CatalogTab onAddOfferingFor={handleAddOfferingFor} />
      ) : (
        <OfferingsTab
          preselectedCatalogId={preselectedCatalogId}
          clearPreselect={clearPreselect}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Library;
  label: string;
  hint: string;
}) {
  return (
    <button
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
      <span
        className={cn(
          "text-[10px] font-normal",
          active ? "text-muted-foreground" : "text-muted-foreground/70",
        )}
      >
        {hint}
      </span>
    </button>
  );
}
