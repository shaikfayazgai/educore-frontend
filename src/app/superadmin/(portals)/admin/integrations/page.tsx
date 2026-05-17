"use client";

import { useState } from "react";
import {
  Link2,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useIntegrations } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import {
  StatusBadge,
  getHealthVariant,
} from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import {
  formatRelative,
  formatDateTime,
  formatNumber,
  formatPercentage,
} from "@/superadmin/lib/utils/format";
import type { Integration } from "@/superadmin/lib/api/types/admin.types";

const TYPE_LABELS: Record<Integration["type"], string> = {
  lms: "LMS",
  sis: "SIS",
  erp: "ERP",
  hrms: "HRMS",
  research: "Research",
  auth: "Auth",
  other: "Other",
};

const SYNC_DIRECTION_LABELS: Record<Integration["type"], string> = {
  lms: "Inbound: Grades, enrollments, attendance",
  sis: "Bidirectional: Student records",
  erp: "Inbound: Financial data",
  hrms: "Inbound: Staff records, payroll",
  research: "Inbound: Publications, grants",
  auth: "Bidirectional: Identity, permissions",
  other: "Varies by configuration",
};

const HEALTH_EXPLANATIONS: Record<string, string> = {
  degraded: "Some sync operations are failing. Check error logs.",
  down: "Integration is offline. Contact system administrator.",
};

function IntegrationCard({ integration }: { integration: Integration }) {
  const [expanded, setExpanded] = useState(false);

  const syncHistoryData = integration.syncHistory.map((s) => ({
    label: s.date,
    value: s.records,
    errors: s.errors,
  }));

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between p-6 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start gap-3">
          {expanded ? (
            <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{integration.name}</h3>
              <StatusBadge variant="muted">{TYPE_LABELS[integration.type]}</StatusBadge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {integration.provider}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              {SYNC_DIRECTION_LABELS[integration.type]}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last sync {formatRelative(integration.lastSyncAt)}
              </span>
              {integration.nextSyncAt && (
                <span className="flex items-center gap-1">
                  Next sync: {formatRelative(integration.nextSyncAt)}
                </span>
              )}
              <span>{formatNumber(integration.recordsSynced)} records</span>
              {integration.errorCount > 0 && (
                <span className="flex items-center gap-1 text-danger">
                  <AlertCircle className="h-3 w-3" />
                  {integration.errorCount} errors
                </span>
              )}
            </div>
            {HEALTH_EXPLANATIONS[integration.health] && (
              <p className="mt-1.5 text-xs font-medium text-warning">
                {HEALTH_EXPLANATIONS[integration.health]}
              </p>
            )}
          </div>
        </div>
        <StatusBadge variant={getHealthVariant(integration.health)} dot>
          {integration.health}
        </StatusBadge>
      </button>
      {expanded && (
        <div className="space-y-4 border-t border-border p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="mt-1 text-lg font-semibold">
                {formatPercentage(integration.uptime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next Sync</p>
              <p className="mt-1 text-sm font-medium">
                {formatDateTime(integration.nextSyncAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Errors</p>
              <p className="mt-1 text-lg font-semibold">
                {formatNumber(integration.errorCount)}
              </p>
            </div>
          </div>
          {syncHistoryData.length > 0 && (
            <AreaTrend
              title="Sync History (Records Synced)"
              data={syncHistoryData}
              color="#2563eb"
              height={200}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminIntegrationsPage() {
  const { data: integrations, isLoading, isError, refetch } = useIntegrations();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Link2}
          title="Integrations"
          description="Connected systems and data synchronization status"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !integrations) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Link2}
          title="Integrations"
          description="Connected systems and data synchronization status"
        />
        <ErrorState
          title="Failed to load integrations"
          message="Could not retrieve integration data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const healthy = integrations.filter((i) => i.health === "healthy").length;
  const degraded = integrations.filter((i) => i.health === "degraded").length;
  const down = integrations.filter((i) => i.health === "down").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Link2}
        title="Integrations"
        description="Connected systems and data synchronization status"
      />

      {/* Health Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Healthy"
          value={healthy}
          icon={CheckCircle2}
        />
        <StatCard
          label="Degraded"
          value={degraded}
          icon={AlertCircle}
        />
        <StatCard
          label="Down"
          value={down}
          icon={Activity}
        />
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
