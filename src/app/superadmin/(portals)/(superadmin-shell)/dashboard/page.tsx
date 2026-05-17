"use client";

import Link from "next/link";
import {
  Building2, GraduationCap, BookOpen, Briefcase,
  ArrowRight, ArrowUpRight, Activity, ScrollText,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useSuperAdminDashboard } from "@/superadmin/lib/hooks/use-super-admin";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber, formatRelative, formatCompact } from "@/superadmin/lib/utils/format";

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

type GrowthTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string }>;
  label?: string | number;
};

function ChartTooltip({ active, payload, label }: GrowthTooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-lg bg-card px-4 py-3 shadow-xl ring-1 ring-border/20">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{v} universities</p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="px-8 pt-2 lg:px-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-2 h-5 w-72" />
      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useSuperAdminDashboard();

  if (isLoading) return <DashboardLoading />;
  if (isError || !data) return <div className="p-10"><ErrorState title="Failed to load dashboard" message="Could not retrieve platform data." onRetry={() => refetch()} /></div>;

  // Four KPI cards on the dashboard. Placement was added so the platform
  // team can see the size of the placement-officer cohort at a glance —
  // mirrors the role mix already exposed on the universities list page.
  const stats = [
    { label: "Universities", value: data.totalUniversities, sub: `${data.activeUniversities} active`, icon: Building2, href: "/superadmin/universities" },
    { label: "Students", value: formatCompact(data.totalStudents), sub: "enrolled", icon: GraduationCap },
    { label: "Faculty", value: formatCompact(data.totalFaculty), sub: "across institutions", icon: BookOpen },
    { label: "Placement Team", value: formatCompact(data.totalPlacement ?? 0), sub: "officers", icon: Briefcase },
  ];

  const chartData = data.universityGrowth.map((d: { month: string; count: number }) => ({ month: d.month, count: d.count }));
  const growthPct = chartData.length >= 2 ? Math.round(((chartData[chartData.length - 1].count / chartData[0].count) - 1) * 100) : 0;

  return (
    <div>
      {/* ── Gradient wash — fades into white ───────────────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[420px]"
        style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }}
      />

      {/* ── Content on top of gradient ─────────────────────────── */}
      <div className="relative px-8 pt-6 lg:px-10">

        {/* Greeting */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}</h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <span className="text-sm font-medium text-success">All systems operational</span>
          </div>
        </div>

        {/* ── Stat cards with shadow ────────────────────────────── */}
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const card = (
              <div className="group rounded-lg bg-card px-6 py-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 transition-colors group-hover:bg-primary-100">
                    <Icon className="h-5 w-5 text-primary-500" strokeWidth={1.8} />
                  </div>
                </div>
                <p className="mt-4 font-mono text-3xl font-bold tracking-tight transition-colors group-hover:text-primary-700">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{stat.sub}</p>
              </div>
            );
            return stat.href ? <Link key={stat.label} href={stat.href}>{card}</Link> : <div key={stat.label}>{card}</div>;
          })}
        </div>

        {/* ── Chart + Quick Access ──────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chart */}
          <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">University Growth</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Last 10 months</p>
              </div>
              {growthPct > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  <span className="font-mono text-sm font-semibold text-success">+{growthPct}%</span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="sa-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="[stop-color:var(--color-primary-500)]" stopOpacity={0.12} />
                    <stop offset="100%" className="[stop-color:var(--color-primary-500)]" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="[&_line]:stroke-border/30" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs [&_text]:fill-muted-foreground" dy={8} />
                <YAxis axisLine={false} tickLine={false} className="text-xs [&_text]:fill-muted-foreground" dx={-4} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary-500)" strokeWidth={2.5} fill="url(#sa-grad)" activeDot={{ r: 5, strokeWidth: 2, fill: "var(--color-background)", stroke: "var(--color-primary-500)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Access */}
          <div className="rounded-lg bg-card p-5 shadow-lg ring-1 ring-border/30 shadow-primary-900/[0.04]">
            <h2 className="text-base font-semibold">Quick Access</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Navigate to key areas</p>
            <div className="mt-5 space-y-2">
              {[
                { label: "Universities", href: "/superadmin/universities", icon: Building2, sub: `${data.activeUniversities} active, ${data.suspendedUniversities} suspended` },
                { label: "Monitoring", href: "/superadmin/monitoring", icon: Activity, sub: "Platform health" },
                { label: "Audit Log", href: "/superadmin/audit-log", icon: ScrollText, sub: "Activity trail" },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 hover:bg-primary-50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 transition-colors group-hover:bg-primary-100">
                      <Icon className="h-4 w-4 text-primary-500" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium group-hover:text-primary-700">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.sub}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Recent Onboardings — proper table ────────────────── */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Onboardings</h2>
            <Link href="/superadmin/universities" className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
            <div className="grid grid-cols-[2fr_1.5fr_0.8fr_1fr] gap-4 bg-muted/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>University</span><span>Admin</span><span>Users</span><span className="text-right">Onboarded</span>
            </div>
            <div className="divide-y divide-border/40">
              {data.recentOnboardings.map((o) => (
                <Link key={o.id} href={`/superadmin/universities/${o.id}`}
                  className="group grid grid-cols-[2fr_1.5fr_0.8fr_1fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40">
                  <p className="text-sm font-semibold group-hover:text-primary-700">{o.universityName}</p>
                  <div>
                    <p className="text-sm">{o.adminName}</p>
                    <p className="text-xs text-muted-foreground">{o.adminEmail}</p>
                  </div>
                  <p className="font-mono text-sm">{formatNumber(o.userCount)}</p>
                  <p className="text-right text-sm text-muted-foreground">{formatRelative(o.createdAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Summary strip ────────────────────────────────────── */}
        <div className="mb-4 mt-10 flex items-center gap-10 rounded-lg bg-card px-8 py-6 shadow-lg ring-1 ring-border/30 shadow-primary-900/[0.04]">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Users</p>
            <p className="mt-1 font-mono text-2xl font-bold">{formatNumber(data.totalUsers)}</p>
          </div>
          <div className="h-10 w-px bg-border/40" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Rate</p>
            <p className="mt-1 font-mono text-2xl font-bold text-success">{Math.round((data.activeUniversities / data.totalUniversities) * 100)}%</p>
          </div>
          <div className="hidden h-10 w-px bg-border/40 sm:block" />
          <div className="hidden sm:block">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suspended</p>
            <p className="mt-1 font-mono text-2xl font-bold text-muted-foreground">{data.suspendedUniversities}</p>
          </div>
          <div className="ml-auto">
            <Link href="/superadmin/monitoring" className="flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600">
              <Activity className="h-4 w-4" /> View Monitoring
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
