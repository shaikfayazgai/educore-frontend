"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useBiasReports, useReviewBiasReport } from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { GaugeChart } from "@/admin/components/shared/charts/gauge-chart";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { formatDate } from "@/admin/lib/utils/format";
import type { BiasReport } from "@/admin/lib/api/types/admin.types";

function exportBiasReport(report: BiasReport) {
  const lines: string[] = [];
  lines.push(`Bias & Fairness Report — ${report.modelName}`);
  lines.push(`Report Date: ${report.reportDate}`);
  lines.push(`Overall Score: ${report.overallScore}`);
  if (report.reviewedBy) lines.push(`Reviewed By: ${report.reviewedBy}`);
  lines.push("");
  lines.push("Demographic Breakdown:");
  lines.push("Group,Metric,Value,Threshold,Status");
  for (const d of report.demographics) {
    lines.push(`"${d.group}","${d.metric}",${d.value},${d.threshold},${d.status}`);
  }
  lines.push("");
  lines.push("Recommendations:");
  for (let i = 0; i < report.recommendations.length; i++) {
    lines.push(`${i + 1}. ${report.recommendations[i]}`);
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bias-report-${report.modelName.toLowerCase().replace(/\s+/g, "-")}-${report.reportDate.split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BiasReportCard({ report }: { report: BiasReport }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const statusIcon = {
    pass: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
    fail: <XCircle className="h-3.5 w-3.5 text-danger" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  };

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    exportBiasReport(report);
    toast.success(`Exported ${report.modelName} bias report`);
  }, [report]);

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

          {/* Review status + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs">
              {report.reviewedBy ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="text-muted-foreground">
                    Reviewed by <span className="font-medium text-foreground">{report.reviewedBy}</span>
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  <span className="text-muted-foreground">Not yet reviewed</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
              {!report.reviewedBy && (
                <button
                  onClick={() => setReviewOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
                >
                  <CheckCircle2 className="h-3 w-3" /> Mark Reviewed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ReviewBiasReportDialog open={reviewOpen} onOpenChange={setReviewOpen} report={report} />
    </div>
  );
}

function ReviewBiasReportDialog({
  open,
  onOpenChange,
  report,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  report: BiasReport;
}) {
  const [reviewer, setReviewer] = useState("");
  const [error, setError] = useState("");
  const review = useReviewBiasReport();

  const handleSubmit = async () => {
    setError("");
    if (!reviewer.trim()) {
      setError("Reviewer name is required");
      return;
    }
    try {
      await review.mutateAsync({ id: report.id, reviewedBy: reviewer.trim() });
      toast.success(`${report.modelName} report marked as reviewed by ${reviewer.trim()}`);
      onOpenChange(false);
    } catch {
      setError("Failed to mark as reviewed");
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReviewer("");
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Mark Report Reviewed</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Confirm you have reviewed the {report.modelName} bias report. Your name and timestamp will be logged in the Audit Trail.
          </Dialog.Description>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Reviewer Name</label>
            <input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="e.g. Dr. Priya Patel — AI Ethics Committee"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={review.isPending}
              className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
            >
              {review.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Mark Reviewed
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
