"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  MapPin,
  CreditCard,
  Users,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useFacultyCourseDetail } from "@/superadmin/lib/hooks/use-faculty";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { RiskIndicator } from "@/superadmin/components/shared/misc/risk-indicator";
import { DonutBreakdown } from "@/superadmin/components/shared/charts/donut-breakdown";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatPercentage, formatGpa } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";

type TabId = "overview" | "students" | "assignments" | "engagement";

const DONUT_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function FacultyCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: course, isLoading, isError, refetch } = useFacultyCourseDetail(courseId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

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
          <a
            href={`https://canvas.university.edu/courses/${courseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-portal-accent hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Open in LMS
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(["overview", "students", "assignments", "engagement"] as const).map((tab) => (
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

      {/* Tab Content */}
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

      {activeTab === "assignments" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Assignment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Avg Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {course.assignmentCompletion.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No assignments yet
                    </td>
                  </tr>
                ) : (
                  course.assignmentCompletion.map((assignment, i) => {
                    const completionRate = (assignment.submitted / assignment.total) * 100;
                    return (
                      <tr
                        key={i}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">{assignment.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {assignment.submitted}/{assignment.total}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {assignment.averageScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-2 rounded-full",
                                  completionRate >= 80 ? "bg-success" : completionRate >= 60 ? "bg-warning" : "bg-danger"
                                )}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatPercentage(completionRate, 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
