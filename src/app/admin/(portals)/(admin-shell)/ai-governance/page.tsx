"use client";

import Link from "next/link";
import {
  Bot,
  Cpu,
  Scale,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useAiGovernanceOverview, useOverrideLog } from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatCard } from "@/admin/components/shared/misc/stat-card";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { formatPercentage, formatNumber, formatRelative } from "@/admin/lib/utils/format";

export default function AdminAiGovernancePage() {
  const { data: overview, isLoading, isError, refetch } = useAiGovernanceOverview();
  const { data: overrideData } = useOverrideLog({ page: 1, pageSize: 5 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Bot}
          title="AI Governance"
          description="Oversight of AI models, bias metrics, and decision overrides"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Bot}
          title="AI Governance"
          description="Oversight of AI models, bias metrics, and decision overrides"
        />
        <ErrorState
          title="Failed to load AI governance data"
          message="Could not retrieve AI governance overview. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const recentOverrides = overrideData?.overrides ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        title="AI Governance"
        description="Oversight of AI models, bias metrics, and decision overrides"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Models"
          value={overview.totalModels}
          icon={Cpu}
        />
        <StatCard
          label="Active Models"
          value={overview.activeModels}
          icon={Activity}
        />
        <StatCard
          label="Avg Accuracy"
          value={formatPercentage(overview.avgAccuracy * 100)}
          icon={Bot}
        />
        <StatCard
          label="Avg Bias Score"
          value={overview.avgBias.toFixed(2)}
          icon={Scale}
        />
      </div>

      {/* Bias Score Context */}
      <p className="text-xs text-muted-foreground">
        Bias score measures demographic parity. Lower values indicate better fairness. Target: &lt; 0.10.
      </p>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/ai-governance/models"
          className="group flex items-center justify-between rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-portal-accent-light">
              <Cpu className="h-5 w-5 text-portal-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Model Registry</h3>
              <p className="text-xs text-muted-foreground">
                View and manage AI models
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/admin/ai-governance/bias-reports"
          className="group flex items-center justify-between rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-portal-accent-light">
              <Scale className="h-5 w-5 text-portal-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Bias & Fairness Reports</h3>
              <p className="text-xs text-muted-foreground">
                Review demographic fairness audits
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Override Stats & Log */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold">Recent Override Log</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {overview.recentOverrides} recent overrides
            </p>
          </div>
        </div>
        <p className="px-6 pb-2 text-xs text-muted-foreground">
          All AI overrides are permanently logged for compliance and audit purposes.
        </p>
        {recentOverrides.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No recent overrides found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOverrides.map((entry) => (
              <div key={entry.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      <p className="text-sm font-medium">
                        {entry.modelName}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="line-through">{entry.originalDecision}</span>
                      {" "}
                      <span className="font-medium text-foreground">
                        {entry.overriddenTo}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.reason}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{entry.overriddenBy}</p>
                    <p className="mt-0.5">{formatRelative(entry.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
