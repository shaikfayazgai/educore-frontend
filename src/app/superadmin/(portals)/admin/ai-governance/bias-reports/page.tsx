"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useBiasReports } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatDate } from "@/superadmin/lib/utils/format";
import type { BiasReport } from "@/superadmin/lib/api/types/admin.types";

function BiasReportCard({ report }: { report: BiasReport }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pass: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
    fail: <XCircle className="h-3.5 w-3.5 text-danger" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  };

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
            <h3 className="text-sm font-semibold">{report.modelName}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(report.reportDate)}
            </p>
            {report.recommendations.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {report.recommendations.length} recommendation{report.recommendations.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-semibold">{report.overallScore}</span>
          <span className="text-xs text-muted-foreground">Overall Score</span>
        </div>
      </button>
      {expanded && (
        <div className="space-y-4 border-t border-border p-6">
          {/* Gauge */}
          <GaugeChart
            label="Overall Fairness Score"
            value={report.overallScore}
            size="sm"
          />

          {/* Demographics Table */}
          {report.demographics.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Demographic Breakdown
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Group
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Metric
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Value
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Threshold
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.demographics.map((d, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-3 py-2 text-sm">{d.group}</td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {d.metric}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium">
                          {d.value.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                          {d.threshold.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1">
                            {statusIcon[d.status]}
                            <StatusBadge
                              variant={
                                d.status === "pass"
                                  ? "success"
                                  : d.status === "fail"
                                    ? "danger"
                                    : "warning"
                              }
                            >
                              {d.status}
                            </StatusBadge>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Threshold for acceptable bias: values below the target threshold pass. Values above require review and corrective action.
              </p>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Recommendations
              </p>
              <ul className="space-y-1.5">
                {report.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-portal-accent" />
                    {rec}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                These recommendations are generated by the Bias Monitoring System based on statistical analysis of model outputs across demographic groups.
              </p>
            </div>
          )}

          {/* Reviewed By */}
          {report.reviewedBy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Reviewed by {report.reviewedBy}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminBiasReportsPage() {
  const { data: reports, isLoading, isError, refetch } = useBiasReports();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Scale}
          title="Bias & Fairness Reports"
          description="AI model bias audits"
        />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !reports) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Scale}
          title="Bias & Fairness Reports"
          description="AI model bias audits"
        />
        <ErrorState
          title="Failed to load bias reports"
          message="Could not retrieve bias report data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/ai-governance"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Scale}
          title="Bias & Fairness Reports"
          description="Detailed bias audits for each AI model including demographic breakdowns and recommendations"
        />
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <BiasReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
