"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { useGrantDiscovery } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { formatCurrency, formatDate } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";
import type { GrantStatus } from "@/superadmin/lib/api/types/common.types";

const STATUS_TABS: { label: string; value: GrantStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Discovered", value: "discovered" },
  { label: "Interested", value: "interested" },
  { label: "Drafting", value: "drafting" },
  { label: "Submitted", value: "submitted" },
  { label: "Funded", value: "funded" },
];

function getGrantStatusVariant(status: GrantStatus) {
  const map: Record<GrantStatus, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    discovered: "muted",
    interested: "info",
    drafting: "warning",
    submitted: "default",
    funded: "success",
    rejected: "danger",
  };
  return map[status] || "muted";
}

export default function ResearchGrantsPage() {
  const [status, setStatus] = useState<GrantStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const queryStatus = status === "all" ? undefined : status;
  const { data, isLoading, isError, refetch } = useGrantDiscovery({
    status: queryStatus,
    page,
    pageSize: 12,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const grants = data?.grants ?? [];
  const filteredGrants = search
    ? grants.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.fundingBody.toLowerCase().includes(search.toLowerCase())
      )
    : grants;
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Search}
        title="Grant Discovery"
        description="Find and track grant opportunities aligned with your research"
        actions={
          <Link
            href="/research/grants/my-grants"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ClipboardList className="h-4 w-4" />
            My Grants
          </Link>
        }
      />

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              status === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchInput
        onSearch={handleSearch}
        placeholder="Search by title or funder..."
        className="max-w-md"
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load grants"
          message="Could not retrieve grant opportunities. Please try again."
          onRetry={() => refetch()}
        />
      ) : filteredGrants.length === 0 ? (
        <EmptyState
          title="No grants found"
          description={
            search
              ? "Try adjusting your search terms."
              : "No grant opportunities match the selected status filter."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredGrants.map((grant) => {
              const isExpanded = expandedId === grant.id;
              return (
                <div
                  key={grant.id}
                  className="rounded-xl border border-border bg-card transition-shadow hover:shadow-sm"
                >
                  {/* Grant Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{grant.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {grant.fundingBody}
                        </p>
                      </div>
                      <StatusBadge variant={getGrantStatusVariant(grant.status)}>
                        {grant.status}
                      </StatusBadge>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(grant.amount, grant.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="text-sm font-medium">
                          {formatDate(grant.deadline)}
                        </p>
                      </div>
                    </div>

                    {/* Alignment + Success */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Alignment
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-portal-accent transition-all"
                              style={{
                                width: `${grant.alignmentScore * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {Math.round(grant.alignmentScore * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Success Probability
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                grant.successProbability >= 0.7
                                  ? "bg-success"
                                  : grant.successProbability >= 0.4
                                    ? "bg-warning"
                                    : "bg-danger"
                              )}
                              style={{
                                width: `${grant.successProbability * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {Math.round(grant.successProbability * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Topics */}
                    {grant.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {grant.topics.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                        {grant.topics.length > 4 && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            +{grant.topics.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : grant.id)
                      }
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Show details <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border px-6 py-4 space-y-3">
                      {grant.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Description
                          </p>
                          <p className="mt-1 text-sm">{grant.description}</p>
                        </div>
                      )}
                      {grant.eligibility && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Eligibility
                          </p>
                          <p className="mt-1 text-sm">{grant.eligibility}</p>
                        </div>
                      )}
                      {grant.requirements.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Requirements
                          </p>
                          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
                            {grant.requirements.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {grant.matchExplanation && (
                        <div className="rounded-lg bg-portal-accent-light/50 p-3">
                          <p className="text-xs font-medium text-portal-accent">
                            Why this matches your profile
                          </p>
                          <p className="mt-1 text-sm">
                            {grant.matchExplanation}
                          </p>
                        </div>
                      )}
                      {grant.url && (
                        <a
                          href={grant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-portal-accent hover:underline"
                        >
                          View original listing
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing page {meta.page} of {meta.totalPages} ({meta.total}{" "}
                grants)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page >= meta.totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
