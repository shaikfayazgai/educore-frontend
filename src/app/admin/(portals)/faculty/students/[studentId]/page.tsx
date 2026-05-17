"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserCheck,
  GraduationCap,
  Calendar,
  Plus,
  AlertTriangle,
  BookOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useFacultyStudentDetail } from "@/admin/lib/hooks/use-faculty";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatCard } from "@/admin/components/shared/misc/stat-card";
import { StatusBadge, getRiskVariant } from "@/admin/components/shared/feedback/status-badge";
import { RiskIndicator } from "@/admin/components/shared/misc/risk-indicator";
import { AreaTrend } from "@/admin/components/shared/charts/area-trend";
import { RadarChartDisplay } from "@/admin/components/shared/charts/radar-chart";
import { GaugeChart } from "@/admin/components/shared/charts/gauge-chart";
import { DataTable } from "@/admin/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { EmptyState } from "@/admin/components/shared/feedback/empty-state";
import { cn } from "@/admin/lib/utils/cn";
import { formatGpa, formatPercentage, formatDate, formatRelative } from "@/admin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { Intervention } from "@/admin/lib/api/types/faculty.types";

type TabId = "overview" | "performance" | "attendance" | "interventions";

const interventionStatusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  planned: "info",
  active: "default",
  completed: "success",
  abandoned: "muted",
};

const interventionTypeLabels: Record<string, string> = {
  academic_support: "Academic Support",
  counseling: "Counseling",
  mentoring: "Mentoring",
  schedule_adjustment: "Schedule Adjustment",
  financial_aid: "Financial Aid",
};

export default function FacultyStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const { data: student, isLoading, isError, refetch } = useFacultyStudentDetail(studentId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !student) return <ErrorState onRetry={() => refetch()} />;

  const gpaHistoryData = student.gpaHistory.map((h) => ({
    label: h.semester,
    value: h.gpa,
  }));

  const radarData = student.skills.map((s) => ({
    subject: s.name,
    value: s.score,
  }));

  const courseColumns: ColumnDef<(typeof student.coursePerformance)[0], unknown>[] = [
    {
      accessorKey: "courseCode",
      header: "Code",
      cell: ({ row }) => <span className="font-medium">{row.original.courseCode}</span>,
    },
    {
      accessorKey: "courseName",
      header: "Course",
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.grade}</span>
      ),
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
      accessorKey: "assignments",
      header: "Assignments",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 rounded-full bg-muted">
            <div
              className={cn(
                "h-2 rounded-full",
                row.original.assignments >= 80 ? "bg-success" : row.original.assignments >= 60 ? "bg-warning" : "bg-danger"
              )}
              style={{ width: `${row.original.assignments}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{formatPercentage(row.original.assignments, 0)}</span>
        </div>
      ),
    },
  ];

  const interventionColumns: ColumnDef<Intervention, unknown>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant="muted">
          {interventionTypeLabels[row.original.type] || row.original.type}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-[300px]">{row.original.description}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={interventionStatusVariant[row.original.status]} dot>
          {row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.startDate)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Link>

      {/* Student Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{student.name}</h1>
              <RiskIndicator level={student.riskLevel} size="md" />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>ID: {student.studentId}</span>
              <span>{student.program}</span>
              <span>Semester {student.semester}</span>
            </div>
            {student.courses && student.courses.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Student in: {student.courses.join(", ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">GPA</p>
            <p className="text-3xl font-bold text-portal-accent">{formatGpa(student.gpa)}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            {student.creditsCompleted}/{student.creditsRequired} credits
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Enrolled {student.enrollmentYear}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {student.courses.length} courses
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 font-medium",
              student.attendanceRate < 75 ? "text-danger" : student.attendanceRate < 85 ? "text-warning" : "text-success"
            )}
          >
            <Clock className="h-4 w-4" />
            {formatPercentage(student.attendanceRate, 0)} attendance
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {(["overview", "performance", "attendance", "interventions"] as const).map((tab) => (
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AreaTrend
              title="GPA History"
              data={gpaHistoryData}
              color="#2563eb"
              height={240}
            />
            <RadarChartDisplay title="Skills" data={radarData} height={280} />
          </div>

          {/* Risk Alerts */}
          {student.riskAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="text-sm font-semibold">Risk Alerts</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {student.riskAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border p-4",
                      alert.severity === "high"
                        ? "border-danger/30 bg-danger-light/30"
                        : alert.severity === "medium"
                        ? "border-warning/30 bg-warning-light/30"
                        : "border-border bg-card"
                    )}
                  >
                    <StatusBadge variant={getRiskVariant(alert.severity)} dot>
                      {alert.severity} - {alert.type}
                    </StatusBadge>
                    <p className="mt-2 text-sm">{alert.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(alert.date)}</p>
                    <Link
                      href={`/faculty/interventions/new?studentId=${studentId}`}
                      className="mt-2 inline-block text-xs text-portal-accent hover:underline"
                    >
                      Create Intervention
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "performance" && (
        <DataTable
          columns={courseColumns}
          data={student.coursePerformance}
          showSearch={false}
          showPagination={false}
          emptyTitle="No course performance data"
          emptyDescription="Course performance data will appear once available."
        />
      )}

      {activeTab === "attendance" && (
        <div className="space-y-6">
          <GaugeChart
            label="Attendance Rate"
            value={Math.round(student.attendanceRate)}
            size="lg"
          />
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Recent Attendance</h3>
            {student.attendanceHistory.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No attendance records available
              </p>
            ) : (
              <div className="space-y-2">
                {student.attendanceHistory.map((record, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{record.courseName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                    </div>
                    <StatusBadge
                      variant={
                        record.status === "present"
                          ? "success"
                          : record.status === "late"
                          ? "warning"
                          : "danger"
                      }
                      dot
                    >
                      {record.status}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "interventions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/faculty/interventions/new?studentId=${student.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Create Intervention
            </Link>
          </div>
          {student.interventions.length === 0 ? (
            <EmptyState
              title="No interventions"
              description="No interventions have been created for this student yet."
              action={{
                label: "Create Intervention",
                onClick: () => router.push(`/faculty/interventions/new?studentId=${studentId}`),
              }}
            />
          ) : (
            <DataTable
              columns={interventionColumns}
              data={student.interventions}
              showSearch={false}
              onRowClick={(row) => {
                window.location.href = `/faculty/interventions/${row.id}`;
              }}
              emptyTitle="No interventions"
            />
          )}
        </div>
      )}
    </div>
  );
}
