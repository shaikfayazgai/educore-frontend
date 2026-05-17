"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Calendar,
} from "lucide-react";
import {
  useAdminDashboard,
  useComplianceDeviations,
  useSemesters,
  useAdminCourses,
} from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatCard } from "@/admin/components/shared/misc/stat-card";
import { AreaTrend } from "@/admin/components/shared/charts/area-trend";
import { DonutBreakdown } from "@/admin/components/shared/charts/donut-breakdown";
import {
  StatusBadge,
  getComplianceVariant,
  getRiskVariant,
} from "@/admin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import {
  formatNumber,
  formatPercentage,
  formatRelative,
} from "@/admin/lib/utils/format";

const DEPT_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#be185d",
  "#65a30d",
];

export default function AdminDashboardPage() {
  const { data, dataUpdatedAt, isLoading, isError, refetch } = useAdminDashboard();
  const { data: deviations } = useComplianceDeviations({ status: "unresolved" });
  const { data: semesters } = useSemesters();
  const { data: coursesData } = useAdminCourses({ status: "active", pageSize: 1 });

  const activeSemester = semesters?.find((s) => s.status === "active");
  const activeCourseCount = coursesData?.meta?.total ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Institutional health overview"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Institutional health overview"
        />
        <ErrorState
          title="Failed to load dashboard"
          message="Could not retrieve institutional data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const enrollmentTrendData = data.enrollmentTrend.map((item) => ({
    label: item.month,
    value: item.count,
  }));

  const departmentDonutData = data.enrollment.byDepartment.map((dept, i) => ({
    name: dept.name,
    value: dept.count,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const recentDeviations = deviations?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Institutional health overview"
      />

      {/* Stat Cards — Retention Rate card intentionally omitted (was a
          Phase-2 zero-stub, misleading until term-over-term retention has
          a real data source). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Enrollment"
          value={formatNumber(data.enrollment.total)}
          change={{ value: data.enrollment.trend, label: "vs last year" }}
          icon={Users}
        />
        <StatCard
          label="Graduation Rate"
          value={formatPercentage(data.graduation.rate)}
          change={{ value: data.graduation.trend, label: "vs last year" }}
          icon={GraduationCap}
        />
        <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
              <ShieldCheck className="h-4 w-4 text-portal-accent" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight">
              {data.compliance.score}
            </p>
            <StatusBadge variant={getComplianceVariant(data.compliance.status)} dot>
              {data.compliance.status === "compliant"
                ? "Compliant"
                : data.compliance.status === "at_risk"
                  ? "At Risk"
                  : "Non-Compliant"}
            </StatusBadge>
          </div>
          <p className="mt-1 text-xs font-medium">
            {data.compliance.score >= 90 ? (
              <span className="text-success">(Meets standards)</span>
            ) : data.compliance.score >= 75 ? (
              <span className="text-yellow-500">(Needs attention)</span>
            ) : (
              <span className="text-danger">(Critical)</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.compliance.deviations} active deviation{data.compliance.deviations !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Last updated:{" "}
        {dataUpdatedAt
          ? formatRelative(new Date(dataUpdatedAt).toISOString())
          : "—"}
      </p>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AreaTrend
          title="Enrollment Trend (12 Months)"
          data={enrollmentTrendData}
          color="#2563eb"
        />
        <DonutBreakdown
          title="Enrollment by Specialization"
          data={departmentDonutData}
          centerLabel="Total"
          centerValue={data.enrollment.total}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Faculty-Student Ratio
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            1:{data.facultyStudentRatio}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Active Courses
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {activeCourseCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeSemester ? activeSemester.name : "Current semester"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Current Semester
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {activeSemester?.name ?? "N/A"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeSemester ? `${activeSemester.courseCount} courses` : "No active semester"}
          </p>
        </div>
      </div>

      {/* Recent Compliance Deviations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Recent Compliance Deviations</h2>
          <Link
            href="/admin/compliance"
            className="flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentDeviations.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No active deviations found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentDeviations.map((dev) => (
              <Link
                key={dev.id}
                href="/admin/compliance"
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{dev.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dev.category} &middot; Detected {formatRelative(dev.detectedAt)}
                  </p>
                </div>
                <StatusBadge variant={getRiskVariant(dev.severity)}>
                  {dev.severity}
                </StatusBadge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
