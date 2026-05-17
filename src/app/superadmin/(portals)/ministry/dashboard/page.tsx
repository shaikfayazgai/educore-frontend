"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Landmark,
  ShieldCheck,
  GraduationCap,
  Users,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
} from "lucide-react";
import { useMinistryDashboard } from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { DonutBreakdown } from "@/superadmin/components/shared/charts/donut-breakdown";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber, formatPercentage } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

const REGION_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#be185d",
  "#65a30d",
];

const QUICK_LINKS = [
  { label: "Institutions", href: "/ministry/institutions", icon: Landmark },
  { label: "Compliance", href: "/ministry/compliance", icon: ShieldCheck },
  { label: "Budget", href: "/ministry/budget", icon: Wallet },
];

export default function MinistryDashboardPage() {
  const { data, isLoading, isError, refetch } = useMinistryDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="National education overview"
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
          description="National education overview"
        />
        <ErrorState
          title="Failed to load dashboard"
          message="Could not retrieve national education data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const regionDonutData = data.enrollment.byRegion.map((r, i) => ({
    name: r.region,
    value: r.count,
    color: REGION_COLORS[i % REGION_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="National education overview"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Institutions"
          value={formatNumber(data.institutions.total)}
          icon={Landmark}
        />
        <StatCard
          label="National Enrollment"
          value={formatNumber(data.enrollment.national)}
          change={{ value: data.enrollment.trend, label: "vs last year" }}
          icon={Users}
        />
        <StatCard
          label="Graduation Rate"
          value={formatPercentage(data.graduation.nationalRate)}
          change={{ value: data.graduation.trend, label: "vs last year" }}
          icon={GraduationCap}
        />
        <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Compliance Score
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
              <ShieldCheck className="h-4 w-4 text-portal-accent" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight">
              {data.compliance.nationalScore}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                data.compliance.nationalScore >= 80
                  ? "bg-success-light text-success"
                  : data.compliance.nationalScore >= 60
                    ? "bg-warning-light text-warning"
                    : "bg-danger-light text-danger"
              )}
            >
              {data.compliance.deviations} deviation
              {data.compliance.deviations !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutBreakdown
          title="Enrollment by Region"
          data={regionDonutData}
          centerLabel="Total"
          centerValue={data.enrollment.national}
        />
        <GaugeChart
          label="Budget Utilization"
          value={Math.round(data.budgetUtilization)}
          size="lg"
        />
      </div>

      {/* Key Highlights */}
      {data.highlights.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Key Highlights</h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {data.highlights.map((highlight, i) => {
              const TrendIcon =
                highlight.trend === "up"
                  ? TrendingUp
                  : highlight.trend === "down"
                    ? TrendingDown
                    : Minus;
              return (
                <div key={i} className="px-6 py-4">
                  <p className="text-xs text-muted-foreground">
                    {highlight.label}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-lg font-semibold">{highlight.value}</p>
                    <TrendIcon
                      className={cn(
                        "h-4 w-4",
                        highlight.trend === "up" && "text-success",
                        highlight.trend === "down" && "text-danger",
                        highlight.trend === "stable" && "text-muted-foreground"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Institution Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Compliant</p>
          <p className="mt-2 text-2xl font-semibold text-success">
            {data.institutions.compliant}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            of {data.institutions.total} institutions
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">At Risk</p>
          <p className="mt-2 text-2xl font-semibold text-warning">
            {data.institutions.atRisk}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            of {data.institutions.total} institutions
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Non-Compliant
          </p>
          <p className="mt-2 text-2xl font-semibold text-danger">
            {data.institutions.nonCompliant}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            of {data.institutions.total} institutions
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-portal-accent/30 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-portal-accent-light">
                <link.icon className="h-4 w-4 text-portal-accent" />
              </div>
              <span className="text-sm font-medium">{link.label}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-portal-accent" />
          </Link>
        ))}
      </div>
    </div>
  );
}
