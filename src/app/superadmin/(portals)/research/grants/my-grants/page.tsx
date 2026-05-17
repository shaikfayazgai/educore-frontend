"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  ArrowLeft,
  Send,
  Clock,
  DollarSign,
  XCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useMyGrants, useUpdateMyGrant } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { formatCurrency, formatDate } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

type MyGrantStatus = "drafting" | "submitted" | "under_review" | "funded" | "rejected";

function getMyGrantVariant(status: MyGrantStatus) {
  const map: Record<MyGrantStatus, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    drafting: "warning",
    submitted: "info",
    under_review: "default",
    funded: "success",
    rejected: "danger",
  };
  return map[status] || "muted";
}

function getMyGrantLabel(status: MyGrantStatus) {
  const map: Record<MyGrantStatus, string> = {
    drafting: "Drafting",
    submitted: "Submitted",
    under_review: "Under Review",
    funded: "Funded",
    rejected: "Rejected",
  };
  return map[status] || status;
}

export default function ResearchMyGrantsPage() {
  const { data: grants, isLoading, isError, refetch } = useMyGrants();
  const updateGrant = useUpdateMyGrant();
  const [submitDialogId, setSubmitDialogId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmitGrant = async () => {
    if (!submitDialogId) return;
    try {
      await updateGrant.mutateAsync({
        id: submitDialogId,
        status: "submitted",
      });
      setActionFeedback({
        id: submitDialogId,
        type: "success",
        message: "Grant proposal submitted successfully.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch {
      setActionFeedback({
        id: submitDialogId,
        type: "error",
        message: "Failed to submit grant. Please try again.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/research/grants"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Grant Discovery
      </Link>

      <PageHeader
        icon={ClipboardList}
        title="My Grants"
        description="Your grant proposals and their statuses"
      />

      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            actionFeedback.type === "success"
              ? "bg-success-light text-success"
              : "bg-danger-light text-danger"
          )}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load your grants"
          message="Could not retrieve your grant proposals. Please try again."
          onRetry={() => refetch()}
        />
      ) : !grants || grants.length === 0 ? (
        <EmptyState
          title="No grant proposals yet"
          description="Start by discovering grants that match your research profile."
          action={{
            label: "Discover Grants",
            onClick: () => {
              window.location.href = "/research/grants";
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {grants.map((grant) => (
            <div
              key={grant.id}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{grant.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {grant.fundingBody}
                  </p>
                </div>
                <StatusBadge
                  variant={getMyGrantVariant(grant.status)}
                  dot
                >
                  {getMyGrantLabel(grant.status)}
                </StatusBadge>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p
                    className={cn(
                      "font-semibold",
                      grant.status === "funded" && "text-success"
                    )}
                  >
                    {formatCurrency(grant.amount, grant.currency)}
                  </p>
                </div>
                {grant.submittedDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {formatDate(grant.submittedDate)}
                    </p>
                  </div>
                )}
                {grant.responseDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Response</p>
                    <p className="font-medium">
                      {formatDate(grant.responseDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Topics */}
              {grant.topics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {grant.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Status-specific UI */}
              <div className="mt-4 border-t border-border pt-4">
                {grant.status === "drafting" && (
                  <button
                    onClick={() => setSubmitDialogId(grant.id)}
                    disabled={updateGrant.isPending}
                    className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Proposal
                  </button>
                )}
                {grant.status === "submitted" && (
                  <div className="flex items-center gap-2 text-sm text-info">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Awaiting Review</span>
                  </div>
                )}
                {grant.status === "under_review" && (
                  <div className="flex items-center gap-2 text-sm text-portal-accent">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Under Review</span>
                  </div>
                )}
                {grant.status === "funded" && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">
                      Funded &mdash;{" "}
                      {formatCurrency(grant.amount, grant.currency)}
                    </span>
                  </div>
                )}
                {grant.status === "rejected" && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-danger">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Not Selected</span>
                    </div>
                    {grant.feedback && (
                      <div className="mt-2 rounded-lg bg-danger-light/50 p-3">
                        <p className="text-xs font-medium text-danger">
                          Feedback
                        </p>
                        <p className="mt-0.5 text-sm">{grant.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Per-grant feedback */}
              {actionFeedback?.id === grant.id && (
                <div
                  className={cn(
                    "mt-3 rounded-lg px-3 py-2 text-xs font-medium",
                    actionFeedback.type === "success"
                      ? "bg-success-light text-success"
                      : "bg-danger-light text-danger"
                  )}
                >
                  {actionFeedback.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Confirmation */}
      <ConfirmDialog
        open={!!submitDialogId}
        onOpenChange={(open) => !open && setSubmitDialogId(null)}
        title="Submit Grant Proposal"
        description="Are you sure you want to submit this proposal? This action cannot be undone."
        confirmLabel="Submit"
        onConfirm={handleSubmitGrant}
      />
    </div>
  );
}
