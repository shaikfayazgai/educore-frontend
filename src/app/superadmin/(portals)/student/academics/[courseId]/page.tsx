"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Calendar,
  CreditCard,
  ExternalLink,
  Scale,
} from "lucide-react";
import { useCourseDetail } from "@/superadmin/lib/hooks/use-student";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DonutBreakdown } from "@/superadmin/components/shared/charts/donut-breakdown";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatDate, formatPercentage } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { Assignment } from "@/superadmin/lib/api/types/student.types";

type TabId = "overview" | "assignments" | "attendance";

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

export default function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { data: course, isLoading, isError, refetch } = useCourseDetail(courseId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
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
          {course.lmsUrl && (
            <a
              href={course.lmsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-portal-accent hover:underline"
            >
              <ExternalLink className="h-4 w-4" /> Open in LMS
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(["overview", "assignments", "attendance"] as const).map((tab) => (
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

      {activeTab === "assignments" && (
        <DataTable
          columns={assignmentColumns}
          data={course.assignments}
          searchKey="title"
          searchPlaceholder="Search assignments..."
          emptyTitle="No assignments yet"
          emptyDescription="Assignments will appear here once they are created."
        />
      )}

      {activeTab === "attendance" && (
        <div className="space-y-6">
          <GaugeChart label="Attendance Rate" value={course.attendance} size="lg" />
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Attendance Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-success">
                  {Math.round((course.attendance / 100) * 30)}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-danger">
                  {30 - Math.round((course.attendance / 100) * 30)}
                </p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">30</p>
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
