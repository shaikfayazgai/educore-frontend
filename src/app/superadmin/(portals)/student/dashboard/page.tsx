"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Clock,
  X,
  Activity,
  BrainCircuit,
  Briefcase,
  Scale,
  Sparkles,
} from "lucide-react";
import { useStudentDashboard, useDismissRiskAlert } from "@/superadmin/lib/hooks/use-student";
import { KpiCard } from "@/superadmin/components/shared/charts/kpi-card";
import { RadarChartDisplay } from "@/superadmin/components/shared/charts/radar-chart";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { Timeline } from "@/superadmin/components/shared/misc/timeline";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { RiskIndicator } from "@/superadmin/components/shared/misc/risk-indicator";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatGpa, formatPercentage, formatRelative, formatDate } from "@/superadmin/lib/utils/format";
import type { RiskAlert } from "@/superadmin/lib/api/types/student.types";

const quickActions = [
  { title: "Continue Learning", href: "/student/tutor", icon: BrainCircuit },
  { title: "Browse Jobs", href: "/student/placement/jobs", icon: Briefcase },
  { title: "New Appeal", href: "/student/appeals/new", icon: Scale },
  { title: "View Recommendations", href: "/student/recommendations", icon: Sparkles },
] as const;

export default function StudentDashboardPage() {
  const { data, isLoading, isError, refetch } = useStudentDashboard();
  const dismissAlert = useDismissRiskAlert();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const gpaChange =
    data.gpa.trend === "up"
      ? { value: Math.round((data.gpa.current - data.gpa.previousSemester) * 100) / 100 * 10, label: "vs last semester" }
      : data.gpa.trend === "down"
        ? { value: -Math.round((data.gpa.previousSemester - data.gpa.current) * 100) / 100 * 10, label: "vs last semester" }
        : undefined;

  const creditsPct = Math.round((data.creditsCompleted / data.creditsRequired) * 100);

  const radarData = data.skillRadarPreview.map((s) => ({
    subject: s.skillName,
    value: s.score,
    benchmark: s.benchmark,
  }));

  const activityVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    grade: "success",
    credential: "info",
    recommendation: "default",
    appeal: "warning",
    application: "info",
  };

  const timelineItems = data.recentActivity.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: formatRelative(a.timestamp),
    variant: activityVariantMap[a.type] || ("default" as const),
    linkUrl: a.linkUrl,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description={`Welcome back, ${data.studentName}`}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="GPA"
          value={formatGpa(data.gpa.current)}
          change={gpaChange}
          sparklineData={[
            { value: data.gpa.previousSemester },
            { value: (data.gpa.previousSemester + data.gpa.current) / 2 },
            { value: data.gpa.current },
          ]}
        />
        <KpiCard
          label="Credits Progress"
          value={`${data.creditsCompleted} / ${data.creditsRequired}`}
          change={{ value: creditsPct, label: "completed" }}
        />
        <KpiCard
          label="Current Courses"
          value={data.currentCourses}
        />
        <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
          <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
          <div className="mt-3">
            <RiskIndicator level={data.riskLevel} size="md" />
          </div>
        </div>
      </div>

      {/* Last Synced */}
      <p className="text-xs text-muted-foreground">
        Last synced: {formatRelative(data.lastSyncedAt)}
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Two-column: Deadlines + Radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Upcoming Deadlines</h2>
          </div>
          {data.upcomingDeadlines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No upcoming deadlines
            </p>
          ) : (
            <div className="space-y-3">
              {data.upcomingDeadlines.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.courseName}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <StatusBadge
                      variant={
                        d.type === "exam" ? "danger" : d.type === "project" ? "warning" : "info"
                      }
                    >
                      {d.type}
                    </StatusBadge>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(d.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Radar */}
        <div>
          <Link href="/student/skills" className="block transition-shadow hover:shadow-md rounded-xl">
            <RadarChartDisplay title="Skill Snapshot" data={radarData} />
          </Link>
          <div className="mt-2 text-right">
            <Link
              href="/student/skills"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all skills &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {data.riskAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold">Risk Alerts</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.riskAlerts.map((alert) => (
              <RiskAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={() => dismissAlert.mutate(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        {timelineItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </div>
    </div>
  );
}

function RiskAlertCard({
  alert,
  onDismiss,
}: {
  alert: RiskAlert;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-shadow hover:shadow-md",
        alert.severity === "high"
          ? "border-danger/30 bg-danger-light/30"
          : alert.severity === "medium"
            ? "border-warning/30 bg-warning-light/30"
            : "border-border bg-card"
      )}
    >
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Dismiss alert"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <StatusBadge variant={getRiskVariant(alert.severity)} dot>
          {alert.severity}
        </StatusBadge>
      </div>
      <p className="mt-2 text-sm">{alert.message}</p>
      {alert.description && (
        <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
      )}
      {alert.courseName && (
        <p className="mt-1 text-xs text-muted-foreground">{alert.courseName}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {formatRelative(alert.triggeredAt)}
      </p>
      {(alert.severity === "high" || alert.severity === "medium") && (
        <p className="mt-1 text-xs text-muted-foreground italic">
          Your academic advisor has been notified.
        </p>
      )}
      {alert.actionLabel && alert.actionUrl && (
        <Link
          href={alert.actionUrl}
          className="mt-3 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {alert.actionLabel}
        </Link>
      )}
    </div>
  );
}
