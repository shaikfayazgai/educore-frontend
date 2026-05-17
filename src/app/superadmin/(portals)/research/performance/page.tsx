"use client";

import {
  LineChart,
  BookOpen,
  Quote,
  Hash,
  Star,
  TrendingUp,
} from "lucide-react";
import { useResearchPerformance } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { BarComparison } from "@/superadmin/components/shared/charts/bar-comparison";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber } from "@/superadmin/lib/utils/format";

export default function ResearchPerformancePage() {
  const { data, isLoading, isError, refetch } = useResearchPerformance();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LineChart}
          title="Performance"
          description="Research performance metrics and benchmarking"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={LineChart}
          title="Performance"
          description="Research performance metrics and benchmarking"
        />
        <ErrorState
          title="Failed to load performance data"
          message="Could not retrieve your research performance metrics. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const outputByYearData = data.outputByYear.map((y) => ({
    label: String(y.year),
    publications: y.publications,
    citations: y.citations,
  }));

  const growthProjectionData = data.growthProjection.map((g) => ({
    label: String(g.year),
    value: g.projected,
    projected: g.projected,
    lower: g.lower,
    upper: g.upper,
  }));

  const peerComparisonData = data.peerComparison.map((p) => ({
    label: p.metric,
    you: p.you,
    fieldAvg: p.fieldAvg,
    top10: p.top10,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LineChart}
        title="Performance"
        description="Research performance metrics and benchmarking"
      />

      {/* Publication Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Publications"
          value={formatNumber(data.publicationMetrics.total)}
          icon={BookOpen}
        />
        <StatCard
          label="This Year"
          value={formatNumber(data.publicationMetrics.thisYear)}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Citations"
          value={data.publicationMetrics.avgCitationsPerPaper.toFixed(1)}
          icon={Quote}
        />
        <StatCard
          label="h-Index"
          value={data.publicationMetrics.hIndex}
          icon={Hash}
        />
        <StatCard
          label="i10-Index"
          value={data.publicationMetrics.i10Index}
          icon={Star}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarComparison
          title="Output by Year (Publications + Citations)"
          data={outputByYearData}
          bars={[
            { dataKey: "publications", label: "Publications", color: "#2563eb" },
            { dataKey: "citations", label: "Citations", color: "#7c3aed" },
          ]}
        />

        {/* Impact by Type Table */}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Impact by Publication Type
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Count
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Avg Citations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.impactByType.map((row) => (
                  <tr key={row.type}>
                    <td className="py-3 text-sm font-medium capitalize">
                      {row.type.replace("_", " ")}
                    </td>
                    <td className="py-3 text-right text-sm">
                      {formatNumber(row.count)}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold">
                      {row.avgCitations.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Growth Projection */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-1 text-sm font-medium text-muted-foreground">
          Growth Projection
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Projected publication output with confidence bands
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AreaTrend
              title=""
              data={growthProjectionData}
              dataKey="projected"
              color="#2563eb"
              height={260}
              className="border-0 p-0"
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Confidence Bands
            </p>
            {data.growthProjection.map((g) => (
              <div key={g.year} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {g.year}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-danger">{g.lower}</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-portal-accent"
                      style={{
                        width: `${
                          g.upper > 0 ? (g.projected / g.upper) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-success">{g.upper}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peer Comparison */}
      <BarComparison
        title="Peer Comparison: You vs Field Avg vs Top 10%"
        data={peerComparisonData}
        bars={[
          { dataKey: "you", label: "You", color: "#2563eb" },
          { dataKey: "fieldAvg", label: "Field Average", color: "#9ca3af" },
          { dataKey: "top10", label: "Top 10%", color: "#059669" },
        ]}
      />
    </div>
  );
}
