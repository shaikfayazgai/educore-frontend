"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { useAppealDetail, useRespondToAppeal, useEscalateAppeal } from "@/admin/lib/hooks/use-student";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { Timeline } from "@/admin/components/shared/misc/timeline";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { cn } from "@/admin/lib/utils/cn";
import { formatDate } from "@/admin/lib/utils/format";
import { APPEAL_STATUS_LABELS } from "@/admin/lib/utils/constants";
import type { AppealStatus } from "@/admin/lib/api/types/common.types";

function getAppealStatusVariant(status: AppealStatus) {
  const map: Record<AppealStatus, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    pending: "warning",
    under_review: "info",
    info_requested: "warning",
    resolved: "success",
    rejected: "danger",
    escalated: "info",
  };
  return map[status] || "muted";
}

function getTimelineVariant(event: string): "default" | "success" | "warning" | "danger" | "info" {
  if (event.toLowerCase().includes("submit")) return "info";
  if (event.toLowerCase().includes("review")) return "warning";
  if (event.toLowerCase().includes("resolv")) return "success";
  if (event.toLowerCase().includes("reject")) return "danger";
  return "default";
}

export default function StudentAppealDetailPage({
  params,
}: {
  params: Promise<{ appealId: string }>;
}) {
  const { appealId } = use(params);
  const { data: appeal, isLoading, isError, refetch } = useAppealDetail(appealId);
  const respondToAppeal = useRespondToAppeal();
  const escalateAppeal = useEscalateAppeal();

  const [infoResponse, setInfoResponse] = useState("");
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !appeal) return <ErrorState onRetry={() => refetch()} />;

  const scoreChanged = appeal.resolvedScore !== undefined && appeal.resolvedScore !== appeal.currentScore;

  return (
    <div className="space-y-6">
      <Link
        href="/student/appeals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appeals
      </Link>

      {/* Appeal Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="default">{appeal.courseCode}</StatusBadge>
              <StatusBadge variant={getAppealStatusVariant(appeal.status)} dot>
                {APPEAL_STATUS_LABELS[appeal.status]}
              </StatusBadge>
            </div>
            <h1 className="mt-2 text-xl font-semibold">{appeal.courseName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {appeal.assessmentName} ({appeal.assessmentType})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current Score</p>
              <p className="text-2xl font-bold">{appeal.currentScore}<span className="text-sm font-normal text-muted-foreground">/{appeal.maxScore}</span></p>
            </div>
            {appeal.resolvedScore !== undefined && (
              <>
                <div className="text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Resolved Score</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    scoreChanged ? "text-success" : "text-foreground"
                  )}>
                    {appeal.resolvedScore}<span className="text-sm font-normal text-muted-foreground">/{appeal.maxScore}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Submitted on {formatDate(appeal.createdAt)}
          {appeal.resolvedAt && ` | Resolved on ${formatDate(appeal.resolvedAt)}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Reason + Reviewer Note */}
        <div className="space-y-6 lg:col-span-2">
          {/* Appeal Reason */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold">Appeal Reason</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {appeal.appealReason}
            </p>
          </div>

          {/* Reviewer Note */}
          {appeal.reviewerNote && (
            <div className={cn(
              "rounded-xl border p-6",
              appeal.status === "resolved"
                ? "border-success/30 bg-success-light/20"
                : appeal.status === "rejected"
                  ? "border-danger/30 bg-danger-light/20"
                  : "border-border bg-card"
            )}>
              <div className="flex items-center gap-2">
                {appeal.status === "resolved" && <CheckCircle2 className="h-4 w-4 text-success" />}
                <h2 className="text-sm font-semibold">
                  Reviewer Response
                  {appeal.reviewerName && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      from {appeal.reviewerName}
                    </span>
                  )}
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {appeal.reviewerNote}
              </p>
            </div>
          )}

          {/* Info Requested - Respond Flow */}
          {appeal.status === "info_requested" && (
            <div className="rounded-xl border border-warning/30 bg-warning-light/20 p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-warning" />
                <h2 className="text-sm font-semibold">Information Requested</h2>
              </div>
              {appeal.reviewerQuestion && (
                <div className="mt-3 rounded-lg border border-warning/20 bg-card px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Reviewer&apos;s Question</p>
                  <p className="mt-1 text-sm leading-relaxed">{appeal.reviewerQuestion}</p>
                </div>
              )}
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium">Your Response</label>
                <textarea
                  value={infoResponse}
                  onChange={(e) => setInfoResponse(e.target.value)}
                  placeholder="Provide the requested information..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                />
                <button
                  type="button"
                  disabled={!infoResponse.trim() || respondToAppeal.isPending}
                  onClick={() =>
                    respondToAppeal.mutate(
                      { appealId, response: infoResponse },
                      { onSuccess: () => { setInfoResponse(""); refetch(); } }
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                >
                  {respondToAppeal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Response
                </button>
                {respondToAppeal.isError && (
                  <p className="text-sm text-danger">Failed to submit response. Please try again.</p>
                )}
              </div>
            </div>
          )}

          {/* Rejected - Escalation Options */}
          {appeal.status === "rejected" && (
            <div className="rounded-xl border border-danger/30 bg-danger-light/20 p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger" />
                <h2 className="text-sm font-semibold">Appeal Options</h2>
              </div>
              <div className="mt-4 space-y-4">
                {!showEscalation ? (
                  <button
                    type="button"
                    onClick={() => setShowEscalation(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-light/30"
                  >
                    Escalate to Department Head
                  </button>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      Reason for escalation <span className="text-muted-foreground">(min 20 characters)</span>
                    </label>
                    <textarea
                      value={escalationReason}
                      onChange={(e) => setEscalationReason(e.target.value)}
                      placeholder="Explain why you believe this appeal should be reviewed by the department head..."
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                    />
                    <p className="text-xs text-muted-foreground">
                      {escalationReason.length}/20 characters minimum
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={escalationReason.length < 20 || escalateAppeal.isPending}
                        onClick={() =>
                          escalateAppeal.mutate(
                            { appealId, reason: escalationReason },
                            { onSuccess: () => { setShowEscalation(false); setEscalationReason(""); refetch(); } }
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
                      >
                        {escalateAppeal.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit Escalation
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowEscalation(false); setEscalationReason(""); }}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                    {escalateAppeal.isError && (
                      <p className="text-sm text-danger">Failed to escalate appeal. Please try again.</p>
                    )}
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <a
                    href="mailto:ombudsman@university.edu"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent transition-colors hover:text-portal-accent-hover"
                  >
                    Contact the Ombudsman
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ombudsman@university.edu
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resolved - Success Banner */}
          {appeal.status === "resolved" && appeal.resolvedScore !== undefined && (
            <div className="rounded-xl border border-success/30 bg-success-light/20 p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h2 className="text-sm font-semibold text-success">Appeal Resolved</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your grade for <span className="font-medium text-foreground">{appeal.assessmentName}</span> in{" "}
                <span className="font-medium text-foreground">{appeal.courseName}</span> has been updated from{" "}
                <span className="font-medium text-foreground">{appeal.currentScore}</span> to{" "}
                <span className="font-medium text-success">{appeal.resolvedScore}</span>.
                This change is reflected in your transcript.
              </p>
            </div>
          )}

          {/* Supporting Documents */}
          {appeal.supportingDocuments.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold">Supporting Documents</h2>
              <div className="space-y-2">
                {appeal.supportingDocuments.map((doc) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Timeline */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Timeline</h2>
          <Timeline
            items={appeal.timeline.map((t, i) => ({
              id: `${appealId}-${i}`,
              title: t.event,
              description: t.actor,
              date: formatDate(t.date),
              variant: getTimelineVariant(t.event),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
