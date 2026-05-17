"use client";

import { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  CreditCard,
  Scale,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Presentation,
  Link2,
  Download,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeftIcon,
} from "lucide-react";
import {
  useCourseDetail,
  useStudentCourseModules,
  useStudentAssignmentDetail,
  useSubmitAssignment,
} from "@/student/lib/hooks/use-student";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { DonutBreakdown } from "@/student/components/shared/charts/donut-breakdown";
import { GaugeChart } from "@/student/components/shared/charts/gauge-chart";
import { DataTable } from "@/student/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { EmptyState } from "@/student/components/shared/feedback/empty-state";
import { FileUpload } from "@/student/components/shared/forms/file-upload";
import { cn } from "@/student/lib/utils/cn";
import { formatDate, formatPercentage } from "@/student/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { Assignment } from "@/student/lib/api/types/student.types";
import { StudentAssessmentsTab } from "./_components/student-assessments-tab";

type TabId = "overview" | "content" | "assignments" | "assessments" | "attendance";

const DONUT_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#8b5cf6", "#ec4899"];

function getAssignmentStatusVariant(status: Assignment["status"]) {
  const map: Record<Assignment["status"], "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    upcoming: "info",
    submitted: "default",
    graded: "success",
    late: "warning",
    missed: "danger",
  };
  return map[status] || "muted";
}

function getAssignmentColumns(courseId: string): ColumnDef<Assignment, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant="muted">{row.original.type}</StatusBadge>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.dueDate)}</span>
      ),
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => {
        const a = row.original;
        if (a.score === undefined) return <span className="text-muted-foreground">-</span>;
        const pct = (a.score / a.maxScore) * 100;
        return (
          <span className={cn("font-semibold", pct >= 80 ? "text-success" : pct >= 60 ? "text-warning" : "text-danger")}>
            {a.score}/{a.maxScore}
          </span>
        );
      },
    },
    {
      accessorKey: "weight",
      header: "Weight",
      cell: ({ row }) => <span>{formatPercentage(row.original.weight, 0)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={getAssignmentStatusVariant(row.original.status)} dot>
          {row.original.status}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (row.original.status !== "graded") return null;
        return (
          <Link
            href={`/student/appeals/new?courseId=${courseId}&assessmentId=${row.original.id}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
          >
            <Scale className="h-3 w-3" />
            Appeal
          </Link>
        );
      },
    },
  ];
}

// ─── Content Tab ─────────────────────────────────────────────────────────────

function ContentTab({ courseId }: { courseId: string }) {
  const { data: modules, isLoading, isError } = useStudentCourseModules(courseId);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => {}} />;
  if (!modules || modules.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No course content available yet."
        description="Your instructor has not published any course materials for this section."
      />
    );
  }

  const materialIcon = (type: "pdf" | "video" | "slides" | "link") => {
    switch (type) {
      case "pdf": return <FileText className="h-4 w-4 text-danger" />;
      case "video": return <Video className="h-4 w-4 text-portal-accent" />;
      case "slides": return <Presentation className="h-4 w-4 text-warning" />;
      case "link": return <Link2 className="h-4 w-4 text-info" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim();
  };

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const isExpanded = expandedIds.has(mod.id);
        return (
          <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => toggle(mod.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            >
              {isExpanded
                ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              }
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{mod.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{mod.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {(mod.materials ?? []).length} {(mod.materials ?? []).length === 1 ? "item" : "items"}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-border bg-muted/30 px-4 py-3">
                <p className="mb-3 text-xs text-muted-foreground">{mod.description}</p>
                <div className="space-y-2">
                  {(mod.materials ?? []).map((mat) => (
                    <div
                      key={mat.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                    >
                      {materialIcon(mat.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {mat.type === "pdf" && mat.fileSize && formatFileSize(mat.fileSize)}
                          {mat.type === "video" && mat.duration && formatDuration(mat.duration)}
                          {mat.type === "slides" && mat.fileSize && formatFileSize(mat.fileSize)}
                          {mat.type === "link" && "External resource"}
                        </p>
                      </div>
                      {mat.type === "pdf" && (
                        <div className="flex items-center gap-1">
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                          <a
                            href={mat.url}
                            download
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </div>
                      )}
                      {mat.type === "video" && (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
                        >
                          <Video className="h-3 w-3" />
                          Watch
                        </a>
                      )}
                      {mat.type === "slides" && (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      )}
                      {mat.type === "link" && (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Assignments Tab ─────────────────────────────────────────────────────────

function AssignmentDetailPanel({
  courseId,
  assignmentId,
  onBack,
  uploadFiles,
  setUploadFiles,
}: {
  courseId: string;
  assignmentId: string;
  onBack: () => void;
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
}) {
  const { data: detail, isLoading, isError } = useStudentAssignmentDetail(courseId, assignmentId);
  const submitMutation = useSubmitAssignment();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (uploadFiles.length === 0) return;
    setUploadError(null);
    try {
      setUploadProgress(0);
      const file = uploadFiles[0];
      const { uploadFileToBlob } = await import("@/lib/blob-upload");
      const result = await uploadFileToBlob(file, {
        folder: `submissions/${courseId}/${assignmentId}`,
        onProgress: (p) => setUploadProgress(p),
      });
      setUploadProgress(1);
      await submitMutation.mutateAsync({
        courseId,
        assignmentId,
        fileUrl: result.url,
        fileName: result.fileName,
      });
      setUploadFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
    } finally {
      setUploadProgress(null);
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !detail) return <ErrorState onRetry={() => {}} />;

  const scorePercent = detail.submission?.score !== undefined && detail.maxScore > 0
    ? (detail.submission.score / detail.maxScore) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to assignment list
      </button>

      {/* Assignment header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{detail.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge variant="muted">{detail.type}</StatusBadge>
              <StatusBadge variant={getAssignmentStatusVariant(detail.status)} dot>
                {detail.status}
              </StatusBadge>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">{formatDate(detail.dueDate)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Max Score</p>
            <p className="text-sm font-semibold">{detail.maxScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="text-sm font-semibold">{formatPercentage(detail.weight, 0)}</p>
          </div>
          {detail.score !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Your Score</p>
              <p className={cn(
                "text-sm font-semibold",
                detail.score / detail.maxScore >= 0.8 ? "text-success" :
                detail.score / detail.maxScore >= 0.6 ? "text-warning" : "text-danger"
              )}>
                {detail.score}/{detail.maxScore}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
          <p className="text-sm">{detail.description}</p>
        </div>

        {detail.instructions && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Instructions</p>
            <p className="text-sm">{detail.instructions}</p>
          </div>
        )}
      </div>

      {/* Rubric */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold">Grading Rubric</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Criterion</th>
                <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Description</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Max Points</th>
              </tr>
            </thead>
            <tbody>
              {(detail.rubric ?? []).map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{r.criterion}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{r.description}</td>
                  <td className="py-2.5 text-right font-semibold">{r.maxPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission area */}
      {!detail.submission && detail.status !== "graded" && detail.status !== "missed" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Submit Your Work</h3>
          <FileUpload
            label="Upload assignment file"
            accept=".pdf,.doc,.docx,.zip,.py,.java,.cpp,.txt"
            maxSize={10}
            onFilesChange={setUploadFiles}
          />
          <button
            onClick={handleSubmit}
            disabled={
              uploadFiles.length === 0 ||
              submitMutation.isPending ||
              uploadProgress !== null
            }
            className={cn(
              "mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              uploadFiles.length > 0 && !submitMutation.isPending && uploadProgress === null
                ? "bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent-hover"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Upload className="h-4 w-4" />
            {uploadProgress !== null
              ? `Uploading… ${Math.round(uploadProgress * 100)}%`
              : submitMutation.isPending
                ? "Submitting..."
                : "Submit Assignment"}
          </button>
          {uploadProgress !== null && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-portal-accent transition-all"
                style={{ width: `${Math.round(uploadProgress * 100)}%` }}
              />
            </div>
          )}
          {submitMutation.isSuccess && uploadProgress === null && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Assignment submitted successfully!
            </p>
          )}
          {uploadError && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              {uploadError}
            </p>
          )}
          {submitMutation.isError && !uploadError && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              Failed to submit. Please try again.
            </p>
          )}
        </div>
      )}

      {/* Submission details */}
      {detail.submission && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Your Submission</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{detail.submission.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {formatDate(detail.submission.submittedAt)}
                </p>
              </div>
              <StatusBadge
                variant={
                  detail.submission.status === "graded" ? "success" :
                  detail.submission.status === "late" ? "warning" : "default"
                }
                dot
              >
                {detail.submission.status}
              </StatusBadge>
            </div>

            {detail.submission.score !== undefined && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Score</p>
                  <p className={cn(
                    "text-lg font-bold",
                    scorePercent !== null && scorePercent >= 80 ? "text-success" :
                    scorePercent !== null && scorePercent >= 60 ? "text-warning" : "text-danger"
                  )}>
                    {detail.submission.score}/{detail.maxScore}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({scorePercent !== null ? Math.round(scorePercent) : 0}%)
                    </span>
                  </p>
                </div>
                {detail.submission.feedback && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Instructor Feedback</p>
                    <p className="text-sm">{detail.submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appeal button for graded */}
          {detail.status === "graded" && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href={`/student/appeals/new?courseId=${courseId}&assessmentId=${detail.id}`}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-portal-accent hover:bg-portal-accent-light transition-colors"
              >
                <Scale className="h-3.5 w-3.5" />
                Appeal this grade
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentsTab({
  courseId,
  assignments,
  assignmentColumns,
  selectedAssignment,
  setSelectedAssignment,
  uploadFiles,
  setUploadFiles,
}: {
  courseId: string;
  assignments: Assignment[];
  assignmentColumns: ColumnDef<Assignment, unknown>[];
  selectedAssignment: string | null;
  setSelectedAssignment: (id: string | null) => void;
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
}) {
  if (selectedAssignment) {
    return (
      <AssignmentDetailPanel
        courseId={courseId}
        assignmentId={selectedAssignment}
        onBack={() => {
          setSelectedAssignment(null);
          setUploadFiles([]);
        }}
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
      />
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">Click any assignment to view details and submit your work.</p>
      <DataTable
        columns={assignmentColumns}
        data={assignments}
        searchKey="title"
        searchPlaceholder="Search assignments..."
        emptyTitle="No assignments yet"
        emptyDescription="Assignments will appear here once they are created."
        onRowClick={(row) => setSelectedAssignment(row.id)}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { data: course, isLoading, isError, refetch } = useCourseDetail(courseId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const assignmentColumns = useMemo(() => getAssignmentColumns(courseId), [courseId]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !course) return <ErrorState onRetry={() => refetch()} />;

  const assignmentWeights = course.assignments.reduce<Record<string, number>>((acc, a) => {
    const key = a.type.charAt(0).toUpperCase() + a.type.slice(1);
    acc[key] = (acc[key] || 0) + a.weight;
    return acc;
  }, {});

  const donutData = Object.entries(assignmentWeights).map(([name, value], i) => ({
    name,
    value,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const gradedAssignments = course.assignments.filter((a) => a.score !== undefined);
  const totalWeightedScore =
    gradedAssignments.length > 0
      ? gradedAssignments.reduce((sum, a) => sum + (a.score! / a.maxScore) * a.weight, 0)
      : 0;
  const totalWeight = gradedAssignments.reduce((sum, a) => sum + a.weight, 0);
  const currentGradePercent = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/student/academics"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Academics
      </Link>

      {/* Course header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="default">{course.code}</StatusBadge>
              <StatusBadge
                variant={
                  course.status === "active" ? "success" : course.status === "completed" ? "info" : "muted"
                }
                dot
              >
                {course.status}
              </StatusBadge>
            </div>
            <h1 className="mt-2 text-xl font-semibold">{course.name}</h1>
          </div>
          {course.grade && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current Grade</p>
              <p className="text-3xl font-bold text-portal-accent">{course.grade}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" /> {course.instructor}
          </span>
          {course.schedule && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {course.schedule}
            </span>
          )}
          {course.room && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {course.room}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> {course.credits} credits
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(["overview", "content", "assignments", "assessments", "attendance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DonutBreakdown
              title="Assignment Weight Breakdown"
              data={donutData}
              centerValue={`${currentGradePercent}%`}
              centerLabel="Current"
            />
            <GaugeChart
              label="Attendance Rate"
              value={course.attendance}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Final grade is determined by your instructor and may include adjustments not reflected here.
          </p>
        </div>
      )}

      {activeTab === "content" && (
        <ContentTab courseId={courseId} />
      )}

      {activeTab === "assignments" && (
        <AssignmentsTab
          courseId={courseId}
          assignments={course.assignments}
          assignmentColumns={assignmentColumns}
          selectedAssignment={selectedAssignment}
          setSelectedAssignment={setSelectedAssignment}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
        />
      )}

      {activeTab === "assessments" && <StudentAssessmentsTab courseId={courseId} />}

      {activeTab === "attendance" && (
        <div className="space-y-6">
          <GaugeChart label="Attendance Rate" value={course.attendance} size="lg" />
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Attendance Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-success">
                  {course.attendancePresent ?? Math.round((course.attendance / 100) * (course.attendanceTotal ?? 0))}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-danger">
                  {(course.attendanceTotal ?? 0) - (course.attendancePresent ?? Math.round((course.attendance / 100) * (course.attendanceTotal ?? 0)))}
                </p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{course.attendanceTotal ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            If you believe your attendance record is incorrect, contact your instructor or the
            Registrar&apos;s Office.
          </p>
        </div>
      )}
    </div>
  );
}
