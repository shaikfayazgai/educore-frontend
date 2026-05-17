"use client";

import Link from "next/link";
import {
  FlaskConical,
  FileText,
  Network,
  Search,
  BookOpen,
  Quote,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  useFacultyPublications,
  useFacultyGrants,
} from "@/admin/lib/hooks/use-faculty";
import { useFacultyDashboard } from "@/admin/lib/hooks/use-faculty";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatCard } from "@/admin/components/shared/misc/stat-card";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { formatDate, formatNumber } from "@/admin/lib/utils/format";

export default function FacultyResearchPage() {
  const { data: dashboard, isLoading: dashLoading, isError: dashError, refetch: dashRefetch } = useFacultyDashboard();
  const { data: publicationsData, isLoading: pubLoading, isError: pubError, refetch: pubRefetch } = useFacultyPublications();

  const isLoading = dashLoading || pubLoading;
  const isError = dashError || pubError;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return (
      <ErrorState
        onRetry={() => {
          dashRefetch();
          pubRefetch();
        }}
      />
    );
  }

  const metrics = dashboard?.researchMetrics;
  const recentPubs = publicationsData?.slice(0, 5) ?? [];

  const pubTypeVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    journal: "default",
    conference: "info",
    book_chapter: "success",
    preprint: "warning",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        title="Research Overview"
        description="Your research metrics and recent publications"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Publications"
          value={formatNumber(metrics?.publications ?? 0)}
          icon={FileText}
        />
        <StatCard
          label="Citations"
          value={formatNumber(metrics?.citations ?? 0)}
          icon={Quote}
        />
        <StatCard
          label="h-index"
          value={metrics?.hIndex ?? 0}
          icon={BarChart3}
        />
        <StatCard
          label="Active Grants"
          value={metrics?.activeGrants ?? 0}
          icon={FlaskConical}
        />
      </div>

      {/* Recent Publications */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Publications</h2>
          <Link
            href="/faculty/research/publications"
            className="text-sm font-medium text-portal-accent hover:underline"
          >
            View all
          </Link>
        </div>
        {recentPubs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No publications found
          </p>
        ) : (
          <div className="space-y-3">
            {recentPubs.map((pub) => (
              <div
                key={pub.id}
                className="rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{pub.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pub.journal} ({pub.year})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={pubTypeVariant[pub.type] || "muted"}>
                      {pub.type}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground">
                      {pub.citations} citations
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/faculty/research/grants"
          className="group flex items-center justify-between rounded-xl border border-border bg-card p-6 transition-all hover:border-portal-accent/30 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-portal-accent-light">
              <Search className="h-5 w-5 text-portal-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Grant Radar</p>
              <p className="text-xs text-muted-foreground">Discover funding opportunities</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-portal-accent" />
        </Link>

        <Link
          href="/faculty/research/collaborations"
          className="group flex items-center justify-between rounded-xl border border-border bg-card p-6 transition-all hover:border-portal-accent/30 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-portal-accent-light">
              <Network className="h-5 w-5 text-portal-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Collaborations</p>
              <p className="text-xs text-muted-foreground">Explore collaboration network</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-portal-accent" />
        </Link>

        <Link
          href="/faculty/research/publications"
          className="group flex items-center justify-between rounded-xl border border-border bg-card p-6 transition-all hover:border-portal-accent/30 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-portal-accent-light">
              <FileText className="h-5 w-5 text-portal-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Publications</p>
              <p className="text-xs text-muted-foreground">Track all publications</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-portal-accent" />
        </Link>
      </div>
    </div>
  );
}
