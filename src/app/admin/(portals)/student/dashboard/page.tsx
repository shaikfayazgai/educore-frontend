"use client";

import Link from "next/link";
import {
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
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Radar as RadarIcon,
  ShieldAlert,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  useStudentDashboard,
  useDismissRiskAlert,
} from "@/admin/lib/hooks/use-student";
import { useAuthStore } from "@/admin/lib/stores/auth-store";
import { RadarChartDisplay } from "@/admin/components/shared/charts/radar-chart";
import { Timeline } from "@/admin/components/shared/misc/timeline";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/admin/lib/utils/cn";
import { formatGpa, formatRelative } from "@/admin/lib/utils/format";
import type { RiskAlert } from "@/admin/lib/api/types/student.types";

// --- Quick actions (routes already exist in the app) ------------------------

const quickActions = [
  {
    title: "Continue learning",
    helper: "Resume your AI tutor session",
    href: "/student/tutor",
    icon: BrainCircuit,
  },
  {
    title: "Browse jobs",
    helper: "Matched openings for you",
    href: "/student/placement/jobs",
    icon: Briefcase,
  },
  {
    title: "Start an appeal",
    helper: "Request a grade review",
    href: "/student/appeals/new",
    icon: Scale,
  },
  {
    title: "Recommendations",
    helper: "AI-curated next steps",
    href: "/student/recommendations",
    icon: Sparkles,
  },
] as const;

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function StudentDashboardPage() {
  const { data, isLoading, isError, refetch } = useStudentDashboard();
  const { user } = useAuthStore();
  const dismissAlert = useDismissRiskAlert();
  const greeting = useGreeting();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const firstName = (data.studentName || user?.name || "there").split(" ")[0];

  const gpaDelta = data.gpa.current - data.gpa.previousSemester;
  const gpaDir: "up" | "down" | "flat" =
    gpaDelta > 0.01 ? "up" : gpaDelta < -0.01 ? "down" : "flat";

  const creditsPct = Math.round(
    (data.creditsCompleted / data.creditsRequired) * 100,
  );

  const radarData = data.skillRadarPreview.map((s) => ({
    subject: s.skillName,
    value: s.score,
    benchmark: s.benchmark,
  }));

  const activityVariantMap: Record<
    string,
    "default" | "success" | "warning" | "danger" | "info"
  > = {
    grade: "success",
    credential: "info",
    recommendation: "default",
    appeal: "warning",
    application: "info",
  };

  const timelineItems = data.recentActivity.slice(0, 5).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    date: formatRelative(a.timestamp),
    variant: activityVariantMap[a.type] || ("default" as const),
    linkUrl: a.linkUrl,
  }));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* ============================================================
          PAGE HEADER — simple greeting + meta
          ============================================================ */}
      <header className="flex flex-col gap-1">
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">
          {greeting}, {firstName}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Here's where things stand today. Last synced{" "}
          {formatRelative(data.lastSyncedAt)}.
        </p>
      </header>

      {/* ============================================================
          KPI ROW
          ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="GPA"
          value={formatGpa(data.gpa.current)}
          sublabel={`Last term · ${formatGpa(data.gpa.previousSemester)}`}
          delta={
            gpaDir !== "flat"
              ? {
                  direction: gpaDir,
                  label: `${gpaDelta >= 0 ? "+" : ""}${gpaDelta.toFixed(2)}`,
                }
              : undefined
          }
          icon={GraduationCap}
          sparkline={[
            { value: data.gpa.previousSemester },
            { value: (data.gpa.previousSemester + data.gpa.current) / 2 },
            { value: data.gpa.current },
          ]}
        />
        <MetricCard
          label="Credits"
          value={`${data.creditsCompleted}`}
          sublabel={`of ${data.creditsRequired} toward degree`}
          progress={creditsPct}
          icon={BookOpen}
        />
        <MetricCard
          label="Active courses"
          value={`${data.currentCourses}`}
          sublabel="Current semester"
          icon={Layers}
        />
        <MetricCard
          label="Risk level"
          value={riskLabel(data.riskLevel)}
          sublabel={riskSublabel(data.riskLevel)}
          icon={ShieldAlert}
          tone={
            data.riskLevel === "high"
              ? "danger"
              : data.riskLevel === "medium"
                ? "warning"
                : "success"
          }
        />
      </div>

      {/* ============================================================
          QUICK ACTIONS
          ============================================================ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:-translate-y-[1px] hover:border-primary-200 hover:shadow-[0_6px_18px_-8px_rgba(74,58,186,0.2)]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                <Icon className="h-4 w-4" strokeWidth={2.1} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight">
                  {action.title}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {action.helper}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500" />
            </Link>
          );
        })}
      </div>

      {/* ============================================================
          MAIN GRID — 2/3 left, 1/3 right
          ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — deadlines + recent activity */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Upcoming deadlines"
            subtitle="Next 7 days"
            icon={Clock}
            action={{ label: "All courses", href: "/student/academics" }}
          >
            {data.upcomingDeadlines.length === 0 ? (
              <EmptyState
                icon={Clock}
                message="No upcoming deadlines. Enjoy the breathing room."
              />
            ) : (
              <div className="-mx-5 divide-y divide-border">
                {data.upcomingDeadlines.slice(0, 5).map((d) => (
                  <DeadlineRow key={d.id} deadline={d} />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent activity"
            subtitle="Updates across your profile"
            icon={Activity}
          >
            {timelineItems.length === 0 ? (
              <EmptyState icon={Activity} message="No recent activity yet." />
            ) : (
              <Timeline items={timelineItems} />
            )}
          </SectionCard>
        </div>

        {/* RIGHT — skill radar + risk alerts */}
        <div className="space-y-6">
          <SectionCard
            title="Skill snapshot"
            subtitle="You vs program average"
            icon={RadarIcon}
            action={{ label: "Details", href: "/student/skills" }}
            noPadding
          >
            <div className="px-3 pb-3">
              <RadarChartDisplay data={radarData} />
            </div>
          </SectionCard>

          {data.riskAlerts.length > 0 && (
            <SectionCard
              title="Risk alerts"
              subtitle={`${data.riskAlerts.length} active`}
              icon={AlertTriangle}
              iconTone="warning"
            >
              <div className="space-y-3">
                {data.riskAlerts.slice(0, 3).map((alert) => (
                  <RiskAlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => dismissAlert.mutate(alert.id)}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SectionCard — consistent container
// =============================================================================

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconTone = "primary",
  action,
  children,
  noPadding,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Clock;
  iconTone?: "primary" | "warning";
  action?: { label: string; href: string };
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              iconTone === "warning"
                ? "bg-warning-100 text-warning-600"
                : "bg-primary-50 text-primary-600",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[13.5px] font-semibold leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-[11px] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-[11.5px] font-semibold text-primary-600 transition-colors hover:bg-primary-50"
          >
            {action.label}
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </section>
  );
}

// =============================================================================
// MetricCard
// =============================================================================

function MetricCard({
  label,
  value,
  sublabel,
  delta,
  icon: Icon,
  sparkline,
  progress,
  tone = "primary",
}: {
  label: string;
  value: string;
  sublabel?: string;
  delta?: { direction: "up" | "down" | "flat"; label: string };
  icon: typeof GraduationCap;
  sparkline?: { value: number }[];
  progress?: number;
  tone?: "primary" | "danger" | "warning" | "success";
}) {
  const toneStyles = {
    primary: {
      iconBg: "bg-primary-50",
      iconColor: "text-primary-600",
      stroke: "#4A3ABA",
      progress: "bg-primary-500",
    },
    danger: {
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      stroke: "#EF4444",
      progress: "bg-danger-500",
    },
    warning: {
      iconBg: "bg-warning-100",
      iconColor: "text-warning-600",
      stroke: "#F59E0B",
      progress: "bg-warning-500",
    },
    success: {
      iconBg: "bg-success-100",
      iconColor: "text-success-600",
      stroke: "#22C55E",
      progress: "bg-success-500",
    },
  }[tone];

  const TrendIcon =
    delta?.direction === "up"
      ? TrendingUp
      : delta?.direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-border hover:shadow-[0_4px_14px_-6px_rgba(15,23,42,0.1)]">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            toneStyles.iconBg,
            toneStyles.iconColor,
          )}
        >
          <Icon className="h-[15px] w-[15px]" strokeWidth={2.1} />
        </div>

        {sparkline && sparkline.length > 1 && (
          <div className="h-8 w-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparkline}
                margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`spark-${label.replace(/\s+/g, "-")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={toneStyles.stroke}
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor={toneStyles.stroke}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={toneStyles.stroke}
                  strokeWidth={1.6}
                  fill={`url(#spark-${label.replace(/\s+/g, "-")})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-[26px] font-bold leading-none tracking-tight">
          {value}
        </p>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold",
              delta.direction === "up" && "text-success-600",
              delta.direction === "down" && "text-danger-600",
              delta.direction === "flat" && "text-muted-foreground",
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {delta.label}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">{sublabel}</p>
      )}

      {typeof progress === "number" && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              toneStyles.progress,
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Deadline row — date-tile on the left, title + type chip on the right
// =============================================================================

function DeadlineRow({
  deadline,
}: {
  deadline: {
    id: string;
    title: string;
    courseName: string;
    type: string;
    dueDate: string;
  };
}) {
  const typeConfig: Record<
    string,
    { chipBg: string; chipText: string; label: string }
  > = {
    exam: {
      chipBg: "bg-danger-50",
      chipText: "text-danger-600",
      label: "Exam",
    },
    project: {
      chipBg: "bg-warning-50",
      chipText: "text-warning-700",
      label: "Project",
    },
    assignment: {
      chipBg: "bg-primary-50",
      chipText: "text-primary-600",
      label: "Assignment",
    },
    quiz: {
      chipBg: "bg-accent-50",
      chipText: "text-accent-700",
      label: "Quiz",
    },
  };
  const cfg = typeConfig[deadline.type] || typeConfig.assignment;

  const due = new Date(deadline.dueDate);
  const daysUntil = Math.max(
    0,
    Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-background text-center">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {due.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-[13px] font-bold leading-none text-foreground">
          {due.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight">
          {deadline.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {deadline.courseName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
            cfg.chipBg,
            cfg.chipText,
          )}
        >
          {cfg.label}
        </span>
        <span className="w-[56px] whitespace-nowrap text-right text-[11px] font-medium text-muted-foreground">
          {daysUntil === 0
            ? "Today"
            : daysUntil === 1
              ? "Tomorrow"
              : `in ${daysUntil}d`}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Risk alert (compact)
// =============================================================================

function RiskAlertCard({
  alert,
  onDismiss,
}: {
  alert: RiskAlert;
  onDismiss: () => void;
}) {
  const config = {
    high: {
      bg: "bg-danger-50",
      border: "border-danger-200",
      chip: "bg-danger-500",
      text: "text-danger-600",
    },
    medium: {
      bg: "bg-warning-50",
      border: "border-warning-200",
      chip: "bg-warning-500",
      text: "text-warning-700",
    },
    low: {
      bg: "bg-primary-50",
      border: "border-primary-200",
      chip: "bg-primary-500",
      text: "text-primary-600",
    },
  } as const;
  const cfg =
    config[alert.severity as keyof typeof config] || config.low;

  return (
    <div className={cn("relative rounded-lg border p-3", cfg.bg, cfg.border)}>
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="flex items-center gap-2 pr-6">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white",
            cfg.chip,
          )}
        >
          {alert.severity}
        </span>
        {alert.courseName && (
          <span className="truncate text-[10.5px] font-medium text-muted-foreground">
            {alert.courseName}
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-snug">
        {alert.message}
      </p>
      {alert.description && (
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
          {alert.description}
        </p>
      )}
      {alert.actionLabel && alert.actionUrl && (
        <Link
          href={alert.actionUrl}
          className={cn(
            "mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold",
            cfg.text,
          )}
        >
          {alert.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// Empty state
// =============================================================================

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof Clock;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-7 w-7 text-muted-foreground/40" />
      <p className="mt-2 text-[12px] text-muted-foreground">{message}</p>
    </div>
  );
}

// =============================================================================
// Risk label helpers
// =============================================================================

function riskLabel(level: string): string {
  const map: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
    none: "None",
  };
  return map[level] || "Unknown";
}

function riskSublabel(level: string): string {
  const map: Record<string, string> = {
    high: "Action required",
    medium: "Monitor closely",
    low: "On track",
    none: "No active risks",
  };
  return map[level] || "";
}
