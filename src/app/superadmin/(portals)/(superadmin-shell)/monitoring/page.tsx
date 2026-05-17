"use client";

import {
  Activity, Clock, AlertTriangle, Users, HardDrive, Server,
} from "lucide-react";
import { usePlatformMonitoring } from "@/superadmin/lib/hooks/use-super-admin";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { cn } from "@/superadmin/lib/utils/cn";

function MonitoringSkeleton() {
  return (
    <div className="px-8 pt-6 lg:px-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-5 w-72" />
      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const { data, isLoading, isError, refetch } = usePlatformMonitoring();

  if (isLoading) return <MonitoringSkeleton />;
  if (isError || !data) return <div className="p-10"><ErrorState title="Monitoring is being set up" message="We're currently working on this feature. Live platform health metrics will appear here soon." onRetry={() => refetch()} /></div>;

  const storagePercent = Math.round((data.storageUsed / data.storageTotal) * 100);

  const stats = [
    { label: "Uptime", value: `${data.uptime}%`, sub: "last 30 days", icon: Clock },
    { label: "Avg Response", value: `${data.apiResponseTime}ms`, sub: "API latency", icon: Activity },
    { label: "Error Rate", value: `${data.errorRate}%`, sub: "last 24 hours", icon: AlertTriangle },
    { label: "Active Users", value: data.activeUsers24h.toLocaleString(), sub: "in last 24h", icon: Users },
  ];

  return (
    <div>
      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[420px]" style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }} />

      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
            <p className="mt-1 text-sm text-muted-foreground">Real-time platform health and performance</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-40", data.systemStatus === "healthy" && "bg-success", data.systemStatus === "degraded" && "bg-warning", data.systemStatus === "down" && "bg-danger")} />
              <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", data.systemStatus === "healthy" && "bg-success", data.systemStatus === "degraded" && "bg-warning", data.systemStatus === "down" && "bg-danger")} />
            </span>
            <span className={cn("text-sm font-medium capitalize", data.systemStatus === "healthy" && "text-success", data.systemStatus === "degraded" && "text-warning", data.systemStatus === "down" && "text-danger")}>
              System {data.systemStatus}
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-lg bg-card px-6 py-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <Icon className="h-5 w-5 text-primary-500" strokeWidth={1.8} />
                  </div>
                </div>
                <p className="mt-4 font-mono text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
            <h2 className="text-lg font-semibold">API Response Time</h2>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
            <div className="mt-6">
              <AreaTrend title="" data={data.responseTimeTrend.map((d) => ({ label: new Date(d.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), value: d.ms }))} color="var(--color-primary-500)" className="!rounded-none !border-0 !bg-transparent !p-0" />
            </div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
            <h2 className="text-lg font-semibold">Errors</h2>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
            <div className="mt-6">
              <AreaTrend title="" data={data.errorTrend.map((d) => ({ label: new Date(d.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), value: d.count }))} color="var(--color-danger)" className="!rounded-none !border-0 !bg-transparent !p-0" />
            </div>
          </div>
        </div>

        {/* Service Health — proper table */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Service Health</h2>
          <p className="text-sm text-muted-foreground">Status of individual platform services</p>
          <div className="mt-6 overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 bg-muted/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Service</span><span>Response</span><span>Uptime</span><span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-border/30">
              {data.services.map((service) => (
                <div key={service.name} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-primary-400" strokeWidth={1.8} />
                    <span className="text-sm font-semibold">{service.name}</span>
                  </div>
                  <p className="font-mono text-sm">{service.responseTime}ms</p>
                  <p className="font-mono text-sm">{service.uptime}%</p>
                  <div className="flex items-center justify-end gap-2">
                    <span className={cn("h-2 w-2 rounded-full", service.status === "healthy" && "bg-success", service.status === "degraded" && "bg-warning", service.status === "down" && "bg-danger")} />
                    <span className={cn("text-xs font-semibold capitalize", service.status === "healthy" && "text-success", service.status === "degraded" && "text-warning", service.status === "down" && "text-danger")}>{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="mb-8 mt-10 rounded-lg bg-card px-8 py-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                <HardDrive className="h-5 w-5 text-primary-500" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold">Storage Usage</p>
                <p className="text-xs text-muted-foreground">{data.storageUsed} GB / {data.storageTotal} GB</p>
              </div>
            </div>
            <p className="font-mono text-2xl font-bold">{storagePercent}%</p>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-all", storagePercent < 70 ? "bg-success" : storagePercent < 90 ? "bg-warning" : "bg-danger")} style={{ width: `${storagePercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
