"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Hash,
  Quote,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react";
import { useResearchDashboard } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber, formatCurrency, formatCompact } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

export default function ResearchDashboardPage() {
  const { data, isLoading, isError, refetch } = useResearchDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Research activity overview"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          description="Research activity overview"
        />
        <ErrorState
          title="Failed to load dashboard"
          message="Could not retrieve your research data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Research activity overview"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Publications"
          value={formatNumber(data.publications.total)}
          change={{
            value: data.publications.trend,
            label: `${data.publications.thisYear} this year`,
          }}
          icon={BookOpen}
        />
        <StatCard
          label="Active Grants"
          value={formatNumber(data.grants.active)}
          change={{
            value: 0,
            label: formatCurrency(data.grants.totalFunding) + " funded",
          }}
          icon={DollarSign}
        />
        <StatCard label="h-Index" value={data.hIndex} icon={Hash} />
        <StatCard
          label="Total Citations"
          value={formatCompact(data.citations)}
          icon={Quote}
        />
      </div>

      {/* Trending Topics + Quick Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trending Topics */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Trending Topics</h2>
              <Link
                href="/research/topics"
                className="flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {data.trendingTopics.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No trending topics available.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                {data.trendingTopics.slice(0, 4).map((topic) => (
                  <div
                    key={topic.topic}
                    className="rounded-lg border border-border p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{topic.topic}</p>
                      <div
                        className={cn(
                          "flex items-center gap-0.5 text-xs font-medium",
                          topic.momentum > 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {topic.momentum > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(topic.momentum)}%
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{topic.publicationCount} pubs</span>
                      <span>{topic.relatedGrants} grants</span>
                    </div>
                    {topic.relatedTopics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {topic.relatedTopics.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold">Quick Links</h2>
            <div className="space-y-2">
              <Link
                href="/research/grants"
                className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                  <DollarSign className="h-4 w-4 text-portal-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p>Grant Discovery</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {data.grants.pendingProposals} pending proposals
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
              <Link
                href="/research/collaborations"
                className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                  <Users className="h-4 w-4 text-portal-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p>Collaborations</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {data.collaborations.active} active,{" "}
                    {data.collaborations.pending} pending
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
              <Link
                href="/research/publications"
                className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                  <FileText className="h-4 w-4 text-portal-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p>Publications</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {data.publications.total} total publications
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Publications */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Recent Publications</h2>
          <Link
            href="/research/publications"
            className="flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {data.recentPublications.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No publications yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recentPublications.slice(0, 5).map((pub) => (
              <div
                key={pub.id}
                className="flex items-start justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{pub.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pub.journal} &middot; {pub.year}
                    {pub.coAuthors.length > 0 && (
                      <>
                        {" "}
                        &middot; with{" "}
                        {pub.coAuthors.slice(0, 2).join(", ")}
                        {pub.coAuthors.length > 2 &&
                          ` +${pub.coAuthors.length - 2}`}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge
                    variant={
                      pub.type === "journal"
                        ? "default"
                        : pub.type === "conference"
                          ? "info"
                          : pub.type === "preprint"
                            ? "warning"
                            : "muted"
                    }
                  >
                    {pub.type.replace("_", " ")}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {pub.citations} citations
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
