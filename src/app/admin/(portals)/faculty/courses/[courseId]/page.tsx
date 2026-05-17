"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  MapPin,
  CreditCard,
  Users,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Presentation,
  Link2,
  Trash2,
  Upload,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  useFacultyCourseDetail,
  useCourseModules,
  useCreateModule,
  useDeleteModule,
  useUploadMaterial,
  useFacultyAssignments,
  useCreateAssignment,
  useAssignmentSubmissions,
  useGradeSubmission,
  useCourseGradebook,
  useCourseAttendance,
  useCreateAttendanceSession,
  useUpdateAttendanceRecords,
} from "@/admin/lib/hooks/use-faculty";
import {
  createModuleSchema,
  createAssignmentSchema,
  gradeSubmissionSchema,
  createAttendanceSchema,
} from "@/admin/lib/schemas/faculty.schema";
import type {
  CreateModuleFormData,
  CreateAssignmentFormData,
  GradeSubmissionFormData,
  CreateAttendanceFormData,
} from "@/admin/lib/schemas/faculty.schema";
import type {
  FacultyAssignment,
  StudentSubmission,
  AttendanceSession,
  AttendanceRecord,
} from "@/admin/lib/api/types/faculty.types";
import { StatCard } from "@/admin/components/shared/misc/stat-card";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { RiskIndicator } from "@/admin/components/shared/misc/risk-indicator";
import { DonutBreakdown } from "@/admin/components/shared/charts/donut-breakdown";
import { AreaTrend } from "@/admin/components/shared/charts/area-trend";
import { BarComparison } from "@/admin/components/shared/charts/bar-comparison";
import { DataTable } from "@/admin/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { FileUpload } from "@/admin/components/shared/forms/file-upload";
import { cn } from "@/admin/lib/utils/cn";
import { formatPercentage, formatGpa } from "@/admin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";

type TabId = "overview" | "content" | "students" | "assignments" | "gradebook" | "attendance" | "engagement";

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  content: "Content",
  students: "Students",
  assignments: "Assignments",
  gradebook: "Gradebook",
  attendance: "Attendance",
  engagement: "Engagement",
};

const DONUT_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#8b5cf6", "#ec4899", "#06b6d4"];

const MATERIAL_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  slides: Presentation,
  link: Link2,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function FacultyCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: course, isLoading, isError, refetch } = useFacultyCourseDetail(courseId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // === Content tab state ===
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [uploadingModuleId, setUploadingModuleId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // === Assignments tab state ===
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [rubricEntries, setRubricEntries] = useState<{ criterion: string; description: string; maxPoints: number }[]>([
    { criterion: "", description: "", maxPoints: 0 },
  ]);

  // === Attendance tab state ===
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editedRecords, setEditedRecords] = useState<Record<string, Record<string, "present" | "absent" | "late">>>({});

  // === LMS Hooks ===
  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId);
  const createModuleMutation = useCreateModule();
  const deleteModuleMutation = useDeleteModule();
  const uploadMaterialMutation = useUploadMaterial();
  const { data: facultyAssignments, isLoading: assignmentsLoading } = useFacultyAssignments(courseId);
  const createAssignmentMutation = useCreateAssignment();
  const gradeSubmissionMutation = useGradeSubmission();
  const { data: gradebook, isLoading: gradebookLoading } = useCourseGradebook(courseId);
  const { data: attendanceSessions, isLoading: attendanceLoading } = useCourseAttendance(courseId);
  const createSessionMutation = useCreateAttendanceSession();
  const updateRecordsMutation = useUpdateAttendanceRecords();

  // === Forms ===
  const moduleForm = useForm<CreateModuleFormData>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: { title: "", description: "" },
  });

  const assignmentForm = useForm<CreateAssignmentFormData>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: { title: "", description: "", type: "assignment", dueDate: "", maxScore: 100, weight: 10 },
  });

  const gradeForm = useForm<GradeSubmissionFormData>({
    resolver: zodResolver(gradeSubmissionSchema),
    defaultValues: { score: 0, feedback: "" },
  });

  const attendanceForm = useForm<CreateAttendanceFormData>({
    resolver: zodResolver(createAttendanceSchema),
    defaultValues: { date: "", topic: "" },
  });

  // === Handlers ===
  const toggleModule = useCallback((id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreateModule = useCallback(
    async (data: CreateModuleFormData) => {
      await createModuleMutation.mutateAsync({ courseId, ...data });
      moduleForm.reset();
      setShowCreateModule(false);
    },
    [courseId, createModuleMutation, moduleForm]
  );

  const handleDeleteModule = useCallback(
    async (moduleId: string) => {
      await deleteModuleMutation.mutateAsync({ courseId, moduleId });
      setDeleteConfirmId(null);
    },
    [courseId, deleteModuleMutation]
  );

  const handleUploadMaterial = useCallback(
    async (moduleId: string, files: File[]) => {
      if (files.length === 0) return;
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let type: "pdf" | "video" | "slides" | "link" = "pdf";
      if (["mp4", "mov", "avi", "webm"].includes(ext)) type = "video";
      else if (["pptx", "ppt", "key"].includes(ext)) type = "slides";
      else if (ext === "url" || ext === "html") type = "link";

      await uploadMaterialMutation.mutateAsync({
        courseId,
        moduleId,
        title: file.name,
        type,
        fileName: file.name,
      });
      setUploadingModuleId(null);
    },
    [courseId, uploadMaterialMutation]
  );

  const handleCreateAssignment = useCallback(
    async (data: CreateAssignmentFormData) => {
      await createAssignmentMutation.mutateAsync({
        courseId,
        ...data,
        rubric: rubricEntries.filter((r) => r.criterion.trim() !== ""),
      });
      assignmentForm.reset();
      setRubricEntries([{ criterion: "", description: "", maxPoints: 0 }]);
      setShowCreateAssignment(false);
    },
    [courseId, createAssignmentMutation, assignmentForm, rubricEntries]
  );

  const handleGradeSubmission = useCallback(
    async (submissionId: string, data: GradeSubmissionFormData) => {
      await gradeSubmissionMutation.mutateAsync({ courseId, submissionId, ...data });
      gradeForm.reset();
      setGradingSubmissionId(null);
    },
    [courseId, gradeSubmissionMutation, gradeForm]
  );

  const handleCreateSession = useCallback(
    async (data: CreateAttendanceFormData) => {
      await createSessionMutation.mutateAsync({ courseId, ...data });
      attendanceForm.reset();
      setShowCreateSession(false);
    },
    [courseId, createSessionMutation, attendanceForm]
  );

  const handleSaveAttendance = useCallback(
    async (sessionId: string) => {
      const sessionEdits = editedRecords[sessionId];
      if (!sessionEdits) return;
      const records = Object.entries(sessionEdits).map(([studentId, status]) => ({ studentId, status }));
      await updateRecordsMutation.mutateAsync({ courseId, sessionId, records });
      setEditedRecords((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    },
    [courseId, editedRecords, updateRecordsMutation]
  );

  const updateAttendanceRecord = useCallback(
    (sessionId: string, studentId: string, status: "present" | "absent" | "late") => {
      setEditedRecords((prev) => ({
        ...prev,
        [sessionId]: { ...(prev[sessionId] || {}), [studentId]: status },
      }));
    },
    []
  );

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !course) return <ErrorState onRetry={() => refetch()} />;

  const gradeDonutData = (course.gradeDistribution ?? []).map((g, i) => ({
    name: g.grade,
    value: g.count,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const attendanceTrendData = (course.attendanceTrend ?? []).map((t) => ({
    label: t.week,
    value: t.rate,
  }));

  const studentColumns: ColumnDef<(typeof course.students)[0], unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "gpa",
      header: "GPA",
      cell: ({ row }) => <span className="font-semibold">{formatGpa(row.original.gpa)}</span>,
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ row }) => <span className="font-semibold">{row.original.grade}</span>,
    },
    {
      accessorKey: "attendance",
      header: "Attendance",
      cell: ({ row }) => (
        <span
          className={cn(
            "font-medium",
            row.original.attendance < 75 ? "text-danger" : row.original.attendance < 85 ? "text-warning" : "text-success"
          )}
        >
          {formatPercentage(row.original.attendance, 0)}
        </span>
      ),
    },
    {
      accessorKey: "riskLevel",
      header: "Risk Level",
      cell: ({ row }) => <RiskIndicator level={row.original.riskLevel} />,
    },
  ];

  const engagementData = course.engagementMetrics.map((m) => ({
    label: m.metric,
    actual: m.value,
    benchmark: m.benchmark,
  }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      {/* Course header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="default">{course.code}</StatusBadge>
              <StatusBadge variant="muted">{course.semester}</StatusBadge>
            </div>
            <h1 className="mt-2 text-xl font-semibold">{course.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Students</p>
            <p className="text-3xl font-bold text-portal-accent">{course.totalStudents}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {course.schedule}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {course.room}
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            {course.credits} credits
          </span>
          {course.studentsAtRisk > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-danger">
              <AlertTriangle className="h-4 w-4" />
              {course.studentsAtRisk} students at risk
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1">
        {(["overview", "content", "students", "assignments", "gradebook", "attendance", "engagement"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Overview
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="At-Risk Students"
              value={course.studentsAtRisk}
              icon={AlertTriangle}
              className={course.studentsAtRisk > 0 ? "border-danger/20" : ""}
            />
            <StatCard
              label="Average Grade"
              value={course.averageGrade.toFixed(1)}
              icon={BarChart3}
            />
            <StatCard
              label="Attendance Rate"
              value={formatPercentage(course.attendanceRate, 0)}
              icon={Users}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <DonutBreakdown
                title="Grade Distribution"
                data={gradeDonutData}
                centerValue={course.totalStudents}
                centerLabel="Students"
              />
              <p className="text-xs text-muted-foreground px-1">
                Based on {course.totalStudents} students, current semester grades.
              </p>
            </div>
            <AreaTrend
              title="Attendance Trend"
              data={attendanceTrendData}
              color="#059669"
              height={240}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Content (LMS Modules)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "content" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Course Modules</h2>
            <button
              onClick={() => setShowCreateModule(!showCreateModule)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90"
            >
              <Plus className="h-4 w-4" />
              Create Module
            </button>
          </div>

          {/* Create Module Form */}
          {showCreateModule && (
            <div className="rounded-xl border border-portal-accent/30 bg-card p-5">
              <h3 className="mb-4 font-medium">New Module</h3>
              <form onSubmit={moduleForm.handleSubmit(handleCreateModule)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Title</label>
                  <input
                    {...moduleForm.register("title")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    placeholder="e.g., Module 6: Special Topics"
                  />
                  {moduleForm.formState.errors.title && (
                    <p className="mt-1 text-xs text-danger">{moduleForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea
                    {...moduleForm.register("description")}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    placeholder="Describe what this module covers..."
                  />
                  {moduleForm.formState.errors.description && (
                    <p className="mt-1 text-xs text-danger">{moduleForm.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createModuleMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90 disabled:opacity-50"
                  >
                    {createModuleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Module
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateModule(false); moduleForm.reset(); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modules List */}
          {modulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !modules || modules.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No modules yet. Create your first module to start organizing course content.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Module Header */}
                  <div
                    className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted/50"
                    onClick={() => toggleModule(mod.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedModules.has(mod.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-medium">{mod.title}</h3>
                        <p className="text-xs text-muted-foreground">{(mod.materials ?? []).length} material{(mod.materials ?? []).length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setUploadingModuleId(uploadingModuleId === mod.id ? null : mod.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </button>
                      {deleteConfirmId === mod.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            disabled={deleteModuleMutation.isPending}
                            className="rounded-md bg-danger px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
                          >
                            {deleteModuleMutation.isPending ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(mod.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload Material Form */}
                  {uploadingModuleId === mod.id && (
                    <div className="border-t border-border px-5 py-4">
                      <FileUpload
                        label="Upload Material"
                        accept=".pdf,.mp4,.mov,.pptx,.ppt,.zip,.py,.ipynb"
                        onFilesChange={(files) => handleUploadMaterial(mod.id, files)}
                      />
                    </div>
                  )}

                  {/* Expanded Materials */}
                  {expandedModules.has(mod.id) && (
                    <div className="border-t border-border">
                      <p className="px-5 py-3 text-xs text-muted-foreground">{mod.description}</p>
                      {(mod.materials ?? []).length === 0 ? (
                        <p className="px-5 pb-4 text-sm text-muted-foreground">No materials uploaded yet.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {(mod.materials ?? []).map((mat) => {
                            const Icon = MATERIAL_ICONS[mat.type] || FileText;
                            return (
                              <div key={mat.id} className="flex items-center gap-3 px-5 py-3">
                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{mat.title}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <StatusBadge variant="muted">{mat.type.toUpperCase()}</StatusBadge>
                                    {mat.fileSize && <span>{formatFileSize(mat.fileSize)}</span>}
                                    {mat.duration && <span>{formatDuration(mat.duration)}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Students
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "students" && (
        <DataTable
          columns={studentColumns}
          data={course.students}
          searchKey="name"
          searchPlaceholder="Search students..."
          onRowClick={(row) => router.push(`/faculty/students/${row.id}`)}
          emptyTitle="No students enrolled"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Assignments (LMS - Upgraded)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assignments</h2>
            <button
              onClick={() => setShowCreateAssignment(!showCreateAssignment)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90"
            >
              <Plus className="h-4 w-4" />
              Create Assignment
            </button>
          </div>

          {/* Create Assignment Form */}
          {showCreateAssignment && (
            <div className="rounded-xl border border-portal-accent/30 bg-card p-5">
              <h3 className="mb-4 font-medium">New Assignment</h3>
              <form onSubmit={assignmentForm.handleSubmit(handleCreateAssignment)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Title</label>
                    <input
                      {...assignmentForm.register("title")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                      placeholder="e.g., Homework 5: Optimization"
                    />
                    {assignmentForm.formState.errors.title && (
                      <p className="mt-1 text-xs text-danger">{assignmentForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <select
                      {...assignmentForm.register("type")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea
                    {...assignmentForm.register("description")}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    placeholder="Describe the assignment requirements..."
                  />
                  {assignmentForm.formState.errors.description && (
                    <p className="mt-1 text-xs text-danger">{assignmentForm.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Due Date</label>
                    <input
                      type="date"
                      {...assignmentForm.register("dueDate")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    />
                    {assignmentForm.formState.errors.dueDate && (
                      <p className="mt-1 text-xs text-danger">{assignmentForm.formState.errors.dueDate.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Max Score</label>
                    <input
                      type="number"
                      {...assignmentForm.register("maxScore", { valueAsNumber: true })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    />
                    {assignmentForm.formState.errors.maxScore && (
                      <p className="mt-1 text-xs text-danger">{assignmentForm.formState.errors.maxScore.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Weight (%)</label>
                    <input
                      type="number"
                      {...assignmentForm.register("weight", { valueAsNumber: true })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    />
                    {assignmentForm.formState.errors.weight && (
                      <p className="mt-1 text-xs text-danger">{assignmentForm.formState.errors.weight.message}</p>
                    )}
                  </div>
                </div>

                {/* Rubric Entries */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Rubric Criteria</label>
                  <div className="space-y-2">
                    {rubricEntries.map((entry, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input
                          className="col-span-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Criterion"
                          value={entry.criterion}
                          onChange={(e) => {
                            const updated = [...rubricEntries];
                            updated[idx] = { ...updated[idx], criterion: e.target.value };
                            setRubricEntries(updated);
                          }}
                        />
                        <input
                          className="col-span-6 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Description"
                          value={entry.description}
                          onChange={(e) => {
                            const updated = [...rubricEntries];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setRubricEntries(updated);
                          }}
                        />
                        <input
                          type="number"
                          className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Points"
                          value={entry.maxPoints || ""}
                          onChange={(e) => {
                            const updated = [...rubricEntries];
                            updated[idx] = { ...updated[idx], maxPoints: Number(e.target.value) || 0 };
                            setRubricEntries(updated);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setRubricEntries(rubricEntries.filter((_, i) => i !== idx))}
                          className="col-span-1 flex items-center justify-center rounded-lg text-muted-foreground hover:text-danger"
                          disabled={rubricEntries.length <= 1}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRubricEntries([...rubricEntries, { criterion: "", description: "", maxPoints: 0 }])}
                    className="mt-2 text-xs font-medium text-portal-accent hover:underline"
                  >
                    + Add Criterion
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createAssignmentMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90 disabled:opacity-50"
                  >
                    {createAssignmentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateAssignment(false); assignmentForm.reset(); setRubricEntries([{ criterion: "", description: "", maxPoints: 0 }]); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assignments List */}
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !facultyAssignments || facultyAssignments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No assignments yet. Create your first assignment to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Assignment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Weight</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyAssignments.map((assignment) => (
                      <AssignmentRow
                        key={assignment.id}
                        assignment={assignment}
                        courseId={courseId}
                        isExpanded={expandedAssignmentId === assignment.id}
                        onToggle={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}
                        gradingSubmissionId={gradingSubmissionId}
                        setGradingSubmissionId={setGradingSubmissionId}
                        gradeForm={gradeForm}
                        onGrade={handleGradeSubmission}
                        gradeIsPending={gradeSubmissionMutation.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Gradebook
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "gradebook" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Gradebook</h2>
          {gradebookLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !gradebook || gradebook.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No gradebook data available yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Student
                      </th>
                      {gradebook[0]?.assignments.map((a) => (
                        <th key={a.assignmentId} className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <div className="max-w-[120px] truncate" title={a.title}>{a.title}</div>
                          <div className="mt-0.5 font-normal normal-case text-muted-foreground/60">{a.weight}%</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.map((entry) => (
                      <tr key={entry.studentId} className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50">
                        <td className="sticky left-0 z-10 bg-card px-4 py-3 text-sm font-medium">
                          {entry.studentName}
                        </td>
                        {entry.assignments.map((a) => {
                          const pct = a.score !== null ? (a.score / a.maxScore) * 100 : null;
                          return (
                            <td key={a.assignmentId} className="px-3 py-3 text-center text-sm">
                              {a.score !== null ? (
                                <span
                                  className={cn(
                                    "font-semibold",
                                    pct !== null && pct >= 80 ? "text-success" : pct !== null && pct >= 60 ? "text-warning" : "text-danger"
                                  )}
                                >
                                  {a.score}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                              <span className="text-xs text-muted-foreground">/{a.maxScore}</span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              entry.weightedAverage >= 80 ? "text-success" : entry.weightedAverage >= 60 ? "text-warning" : "text-danger"
                            )}
                          >
                            {entry.weightedAverage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Attendance
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Attendance</h2>
            <button
              onClick={() => setShowCreateSession(!showCreateSession)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
          </div>

          {/* Create Session Form */}
          {showCreateSession && (
            <div className="rounded-xl border border-portal-accent/30 bg-card p-5">
              <h3 className="mb-4 font-medium">New Attendance Session</h3>
              <form onSubmit={attendanceForm.handleSubmit(handleCreateSession)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Date</label>
                    <input
                      type="date"
                      {...attendanceForm.register("date")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    />
                    {attendanceForm.formState.errors.date && (
                      <p className="mt-1 text-xs text-danger">{attendanceForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Topic</label>
                    <input
                      {...attendanceForm.register("topic")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                      placeholder="e.g., Lecture: Dynamic Programming"
                    />
                    {attendanceForm.formState.errors.topic && (
                      <p className="mt-1 text-xs text-danger">{attendanceForm.formState.errors.topic.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createSessionMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90 disabled:opacity-50"
                  >
                    {createSessionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateSession(false); attendanceForm.reset(); }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sessions List */}
          {attendanceLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !attendanceSessions || attendanceSessions.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No attendance sessions recorded. Create your first session to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceSessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const hasEdits = !!(editedRecords[session.id] && Object.keys(editedRecords[session.id]).length > 0);

                return (
                  <div key={session.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Session Header */}
                    <div
                      className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted/50"
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <h3 className="font-medium">{session.topic}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
                          {session.presentCount} present
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger">
                          {session.absentCount} absent
                        </span>
                        {session.lateCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 font-medium text-warning">
                            {session.lateCount} late
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Roster */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        <div className="divide-y divide-border">
                          {session.records.map((record) => {
                            const currentStatus = editedRecords[session.id]?.[record.studentId] ?? record.status;
                            return (
                              <div key={record.studentId} className="flex items-center justify-between px-5 py-2.5">
                                <span className="text-sm font-medium">{record.studentName}</span>
                                <div className="flex gap-1">
                                  {(["present", "absent", "late"] as const).map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => updateAttendanceRecord(session.id, record.studentId, st)}
                                      className={cn(
                                        "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                                        currentStatus === st
                                          ? st === "present"
                                            ? "bg-success text-white"
                                            : st === "absent"
                                              ? "bg-danger text-white"
                                              : "bg-warning text-white"
                                          : "border border-border text-muted-foreground hover:bg-muted"
                                      )}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Save Button */}
                        <div className="flex justify-end border-t border-border px-5 py-3">
                          <button
                            onClick={() => handleSaveAttendance(session.id)}
                            disabled={!hasEdits || updateRecordsMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-portal-accent/90 disabled:opacity-50"
                          >
                            {updateRecordsMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: Engagement
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "engagement" && (
        <div className="space-y-2">
          <BarComparison
            title="Engagement Metrics vs Benchmarks"
            data={engagementData}
            bars={[
              { dataKey: "actual", label: "Actual", color: "#2563eb" },
              { dataKey: "benchmark", label: "Benchmark", color: "#9ca3af" },
            ]}
            height={350}
          />
          <p className="text-xs text-muted-foreground px-1">
            Benchmark: Department average across all sections of this course.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Assignment Row Sub-Component (inline, not extracted to separate file)
// ═══════════════════════════════════════════════════════════════════════════════

function AssignmentRow({
  assignment,
  courseId,
  isExpanded,
  onToggle,
  gradingSubmissionId,
  setGradingSubmissionId,
  gradeForm,
  onGrade,
  gradeIsPending,
}: {
  assignment: FacultyAssignment;
  courseId: string;
  isExpanded: boolean;
  onToggle: () => void;
  gradingSubmissionId: string | null;
  setGradingSubmissionId: (id: string | null) => void;
  gradeForm: ReturnType<typeof useForm<GradeSubmissionFormData>>;
  onGrade: (submissionId: string, data: GradeSubmissionFormData) => Promise<void>;
  gradeIsPending: boolean;
}) {
  const { data: submissions, isLoading: subsLoading } = useAssignmentSubmissions(
    courseId,
    isExpanded ? assignment.id : ""
  );

  const statusVariant = assignment.status === "published" ? "success" : assignment.status === "closed" ? "muted" : "warning";
  const typeVariant = assignment.type === "exam" ? "danger" : assignment.type === "project" ? "default" : assignment.type === "quiz" ? "warning" : "muted";

  return (
    <>
      <tr
        className="border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-sm font-medium">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {assignment.title}
          </div>
        </td>
        <td className="px-4 py-3">
          <StatusBadge variant={typeVariant}>{assignment.type}</StatusBadge>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </td>
        <td className="px-4 py-3 text-sm font-semibold">{assignment.weight}%</td>
        <td className="px-4 py-3">
          <StatusBadge variant={statusVariant}>{assignment.status}</StatusBadge>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {assignment.gradedCount}/{assignment.submissionCount}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-muted/30 px-0">
            <div className="px-6 py-4">
              <p className="mb-3 text-sm text-muted-foreground">{assignment.description}</p>
              {(assignment.rubric ?? []).length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Rubric</h4>
                  <div className="space-y-1">
                    {(assignment.rubric ?? []).map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{r.criterion}</span>
                          <span className="ml-2 text-muted-foreground">{r.description}</span>
                        </div>
                        <span className="font-semibold text-portal-accent">{r.maxPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Student Submissions</h4>
              {subsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !submissions || submissions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium">{sub.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {sub.fileName} -- {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge
                            variant={sub.status === "graded" ? "success" : sub.status === "late" ? "warning" : "muted"}
                          >
                            {sub.status}
                          </StatusBadge>
                          {sub.status === "graded" && sub.score !== undefined ? (
                            <span className={cn(
                              "text-sm font-bold",
                              (sub.score / assignment.maxScore) * 100 >= 80 ? "text-success"
                                : (sub.score / assignment.maxScore) * 100 >= 60 ? "text-warning"
                                  : "text-danger"
                            )}>
                              {sub.score}/{assignment.maxScore}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGradingSubmissionId(gradingSubmissionId === sub.id ? null : sub.id);
                                gradeForm.reset({ score: 0, feedback: "" });
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-portal-accent px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-portal-accent/90"
                            >
                              Grade
                            </button>
                          )}
                        </div>
                      </div>
                      {sub.status === "graded" && sub.feedback && (
                        <p className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{sub.feedback}</p>
                      )}
                      {/* Grade Form */}
                      {gradingSubmissionId === sub.id && (
                        <div className="mt-3 rounded-lg border border-portal-accent/20 bg-muted/50 p-3">
                          <form
                            onSubmit={gradeForm.handleSubmit((data) => onGrade(sub.id, data))}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium">Score (max {assignment.maxScore})</label>
                                <input
                                  type="number"
                                  {...gradeForm.register("score", { valueAsNumber: true })}
                                  max={assignment.maxScore}
                                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                                />
                                {gradeForm.formState.errors.score && (
                                  <p className="mt-0.5 text-xs text-danger">{gradeForm.formState.errors.score.message}</p>
                                )}
                              </div>
                              <div className="col-span-3">
                                <label className="mb-1 block text-xs font-medium">Feedback</label>
                                <textarea
                                  {...gradeForm.register("feedback")}
                                  rows={2}
                                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                                  placeholder="Provide feedback for the student..."
                                />
                                {gradeForm.formState.errors.feedback && (
                                  <p className="mt-0.5 text-xs text-danger">{gradeForm.formState.errors.feedback.message}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={gradeIsPending}
                                className="inline-flex items-center gap-1 rounded-md bg-portal-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                              >
                                {gradeIsPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                Submit Grade
                              </button>
                              <button
                                type="button"
                                onClick={() => setGradingSubmissionId(null)}
                                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
