"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Target,
  Users,
  Globe,
  Award,
} from "lucide-react";
import {
  useAdmissionPredictions,
  useImplementRecommendation,
  useDismissRecommendation,
} from "@/superadmin/lib/hooks/use-admissions";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { AiConfidenceIndicator } from "@/superadmin/components/shared/ai/ai-confidence-indicator";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatPercentage, formatNumber } from "@/superadmin/lib/utils/format";
import type { AdmissionRecommendation } from "@/superadmin/lib/api/types/admissions.types";

const impactVariant: Record<string, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

const categoryVariant: Record<string, "default" | "success" | "info" | "warning"> = {
  capacity: "warning",
  outreach: "info",
  scholarship: "success",
  process: "default",
};

export default function AdmissionsPredictionsPage() {
  const { data, isLoading, isError, refetch } = useAdmissionPredictions();
  const implementRec = useImplementRecommendation();
  const dismissRec = useDismissRecommendation();

  const [implementingId, setImplementingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [implementFeedback, setImplementFeedback] = useState<string | null>(null);

  const handleImplement = async (id: string) => {
    setImplementingId(id);
    try {
      await implementRec.mutateAsync(id);
      setImplementFeedback(
        "Recommendation marked for implementation. Assigned to the relevant department for action."
      );
      setTimeout(() => setImplementFeedback(null), 8000);
    } finally {
      setImplementingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    try {
      await dismissRec.mutateAsync(id);
    } finally {
      setDismissingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admissions
        </Link>
        <PageHeader icon={TrendingUp} title="AI Predictions" description="Enrollment forecasts and insights" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admissions
        </Link>
        <PageHeader icon={TrendingUp} title="AI Predictions" description="Enrollment forecasts and insights" />
        <ErrorState
          title="Failed to load predictions"
          message="Could not retrieve AI predictions. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const yieldDiff = data.yieldRate.predicted - data.yieldRate.historicalAvg;

  const trendChartData = data.trendAnalysis.map((t) => ({
    label: t.year,
    value: t.applications,
    accepted: t.accepted,
    enrolled: t.enrolled,
    yield: t.yield,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/admissions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admissions
      </Link>

      <PageHeader icon={TrendingUp} title="AI Predictions" description="Enrollment forecasts and insights" />

      {/* Yield Rate Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-portal-accent" />
          <h2 className="text-sm font-semibold">Yield Rate Prediction</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Predicted Yield</p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatPercentage(data.yieldRate.predicted)}
            </p>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              yieldDiff >= 0 ? "text-success" : "text-danger"
            )}>
              {yieldDiff >= 0 ? "+" : ""}{yieldDiff.toFixed(1)}% vs historical
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Historical Average</p>
            <p className="text-3xl font-semibold tracking-tight text-muted-foreground">
              {formatPercentage(data.yieldRate.historicalAvg)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <div className="flex items-center gap-3">
              <AiConfidenceIndicator confidence={data.yieldRate.confidence} size="md" />
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-snug">
              Based on historical enrollment data from the past 5 years.
            </p>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Avg AI Score"
          value={data.qualityMetrics.avgAiScore.toFixed(1)}
          icon={Sparkles}
        />
        <StatCard
          label="Avg Academic Score"
          value={data.qualityMetrics.avgAcademicScore.toFixed(1)}
          icon={Award}
        />
        <StatCard
          label="Diversity Index"
          value={data.qualityMetrics.diversityIndex.toFixed(2)}
          icon={Users}
        />
        <StatCard
          label="International Ratio"
          value={formatPercentage(data.qualityMetrics.internationalRatio)}
          icon={Globe}
        />
      </div>

      {/* Enrollment Forecast Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Enrollment Forecast by Department</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Predicted Enrollment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Capacity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fill Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Likelihood
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.enrollmentForecast.map((dept) => {
                const isOverCapacity = dept.predicted > dept.capacity;
                const fillRate = dept.capacity > 0
                  ? Math.round((dept.predicted / dept.capacity) * 100)
                  : 0;

                return (
                  <tr
                    key={dept.department}
                    className={cn(
                      "border-b border-border last:border-b-0 transition-colors",
                      isOverCapacity && "bg-danger-light/20"
                    )}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{dept.department}</td>
                    <td className={cn(
                      "px-4 py-3 text-sm font-semibold",
                      isOverCapacity && "text-danger"
                    )}>
                      {dept.predicted}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{dept.capacity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isOverCapacity ? "bg-danger" : fillRate >= 80 ? "bg-warning" : "bg-success"
                            )}
                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-medium",
                          isOverCapacity ? "text-danger" : "text-muted-foreground"
                        )}>
                          {fillRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{dept.likelihood}%</td>
                    <td className="px-4 py-3">
                      {isOverCapacity ? (
                        <StatusBadge variant="danger" dot>Over Capacity</StatusBadge>
                      ) : fillRate >= 80 ? (
                        <StatusBadge variant="warning" dot>Near Capacity</StatusBadge>
                      ) : (
                        <StatusBadge variant="success" dot>On Track</StatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Analysis */}
      <AreaTrend
        title="5-Year Application & Enrollment Trends"
        data={trendChartData}
      />

      {/* Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold">Risk Factors</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.riskFactors.map((rf) => (
              <div
                key={rf.factor}
                className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{rf.factor}</h3>
                  <StatusBadge variant={impactVariant[rf.impact] ?? "info"}>
                    {rf.impact} impact
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {rf.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-portal-accent" />
            <h2 className="text-sm font-semibold">AI Recommendations</h2>
          </div>
          {implementFeedback && (
            <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-light/30 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <p className="text-sm font-medium text-success">{implementFeedback}</p>
              <button
                onClick={() => setImplementFeedback(null)}
                className="ml-auto text-success/60 hover:text-success"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onImplement={handleImplement}
                onDismiss={handleDismiss}
                isImplementing={implementingId === rec.id}
                isDismissing={dismissingId === rec.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation: rec,
  onImplement,
  onDismiss,
  isImplementing,
  isDismissing,
}: {
  recommendation: AdmissionRecommendation;
  onImplement: (id: string) => void;
  onDismiss: (id: string) => void;
  isImplementing: boolean;
  isDismissing: boolean;
}) {
  if (rec.status === "implemented") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-light/30 p-4">
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{rec.title}</p>
          <p className="text-xs text-success mt-0.5">Implemented</p>
        </div>
        <StatusBadge variant={categoryVariant[rec.category] ?? "default"}>{rec.category}</StatusBadge>
      </div>
    );
  }

  if (rec.status === "dismissed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 opacity-60">
        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-through">{rec.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Dismissed</p>
        </div>
        <StatusBadge variant={categoryVariant[rec.category] ?? "default"}>{rec.category}</StatusBadge>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-portal-accent-light">
            <Sparkles className="h-4 w-4 text-portal-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{rec.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {rec.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge variant={impactVariant[rec.impact] ?? "info"}>
          {rec.impact} impact
        </StatusBadge>
        <StatusBadge variant={categoryVariant[rec.category] ?? "default"}>
          {rec.category}
        </StatusBadge>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => onDismiss(rec.id)}
          disabled={isDismissing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {isDismissing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
          Dismiss
        </button>
        <button
          onClick={() => onImplement(rec.id)}
          disabled={isImplementing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {isImplementing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Implement
        </button>
      </div>
    </div>
  );
}
