"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Users,
  Clock,
  FlaskConical,
  MapPin,
  ExternalLink,
  FileText,
  Quote,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useFacultyDashboard } from "@/superadmin/lib/hooks/use-faculty";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatDate, formatCurrency, formatNumber } from "@/superadmin/lib/utils/format";

export default function FacultyDashboardPage() {
  const { data, isLoading, isError, refetch } = useFacultyDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const weeklyTrendData = data.weeklyTrend.map((w) => ({
    label: w.day,
    value: w.atRisk,
    interventions: w.interventions,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Overview of your students, courses, and research"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="At-Risk Students"
          value={data.atRiskStudentCount}
          icon={AlertTriangle}
          className="border-danger/20"
        />
        <StatCard
          label="Active Interventions"
          value={data.activeInterventions}
          icon={Activity}
        />
        <StatCard
          label="Total Students"
          value={data.totalStudents}
          icon={Users}
        />
        <StatCard
          label="h-index"
          value={data.researchMetrics.hIndex}
          icon={FlaskConical}
        />
      </div>

      {/* Two columns: Upcoming Classes + Grant Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        {/* Grant Alerts */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Grant Alerts</h2>
          </div>
          {data.grantAlerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No grant alerts
            </p>
          ) : (
            <div className="space-y-3">
              {data.grantAlerts.map((grant) => (
                <div
                  key={grant.id}
                  className={cn(
                    "rounded-lg border px-4 py-3 transition-shadow hover:shadow-sm",
                    grant.isNew
                      ? "border-portal-accent/30 bg-portal-accent-light/20"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{grant.title}</p>
                        {grant.isNew && (
                          <StatusBadge variant="info">New</StatusBadge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {grant.fundingBody}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(grant.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Deadline: {formatDate(grant.deadline)}</span>
                    <span className="font-medium text-portal-accent">
                      {grant.alignmentScore}% match
                    </span>
                  </div>
                </div>
              ))}
              <Link
                href="/faculty/research/grants"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
              >
                View all grants
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Trend */}
      <AreaTrend
        title="At-Risk Students - Weekly Trend"
        data={weeklyTrendData}
        color="#dc2626"
        height={240}
      />

      {/* Research Metrics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Research Metrics</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold">{formatNumber(data.researchMetrics.publications)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Publications</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold">{formatNumber(data.researchMetrics.citations)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Citations</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold">{data.researchMetrics.hIndex}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">h-index</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-semibold">{data.researchMetrics.activeGrants}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Active Grants</p>
          </div>
        </div>
      </div>
    </div>
  );
}
