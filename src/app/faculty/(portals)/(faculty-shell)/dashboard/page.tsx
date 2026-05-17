"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useFacultyDashboard } from "@/faculty/lib/hooks/use-faculty";
import { StatCard } from "@/faculty/components/shared/misc/stat-card";
import { PageHeader } from "@/faculty/components/shared/misc/page-header";
import { StatusBadge } from "@/faculty/components/shared/feedback/status-badge";
import { AreaTrend } from "@/faculty/components/shared/charts/area-trend";
import { DashboardSkeleton } from "@/faculty/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/faculty/components/shared/feedback/error-state";

export default function FacultyDashboardPage() {
  const { data, isLoading, isError, refetch } = useFacultyDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const weeklyTrendData = data.weeklyTrend.map((w) => ({
    label: w.day,
    value: w.atRisk,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Overview of your students and courses"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="At-Risk Students"
          value={data.atRiskStudentCount}
          icon={AlertTriangle}
          className="border-danger/20"
        />
        <StatCard
          label="Total Students"
          value={data.totalStudents}
          icon={Users}
        />
      </div>

      {/* Upcoming Classes */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Upcoming Classes</h2>
        </div>
        {data.upcomingClasses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No upcoming classes
          </p>
        ) : (
          <div className="space-y-3">
            {data.upcomingClasses.map((cls) => (
              <div
                key={cls.courseId}
                className="rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/faculty/courses/${cls.courseId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {cls.courseName}
                      </Link>
                      <StatusBadge variant="muted">{cls.courseCode}</StatusBadge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {cls.time} - {cls.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {cls.room}
                      </span>
                      <span>{cls.totalStudents} students</span>
                    </div>
                  </div>
                  {cls.studentsAtRisk > 0 && (
                    <StatusBadge variant="danger" dot>
                      {cls.studentsAtRisk} at risk
                    </StatusBadge>
                  )}
                </div>
                <Link
                  href="/faculty/briefings"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-portal-accent hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  View Briefing
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Trend */}
      <AreaTrend
        title="At-Risk Students - Weekly Trend"
        data={weeklyTrendData}
        color="#dc2626"
        height={240}
      />

    </div>
  );
}
