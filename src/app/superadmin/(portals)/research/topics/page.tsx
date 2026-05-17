"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { useTopicTrends } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { AreaTrend } from "@/superadmin/components/shared/charts/area-trend";
import {
  CardSkeleton,
  ChartSkeleton,
} from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";

export default function ResearchTopicsPage() {
  const { data, isLoading, isError, refetch } = useTopicTrends();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={TrendingUp}
          title="Topic Trends"
          description="Emerging research areas and their momentum"
        />
        <ChartSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={TrendingUp}
          title="Topic Trends"
          description="Emerging research areas and their momentum"
        />
        <ErrorState
          title="Failed to load topic trends"
          message="Could not retrieve topic analytics. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const sortedTopics = [...data.topics].sort(
    (a, b) => b.momentum - a.momentum
  );

  // Prepare AreaTrend data for top 5 topics
  const topTopicNames = sortedTopics.slice(0, 5).map((t) => t.topic);
  const trendColors = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];

  // Build single-topic AreaTrend data for each top topic (using the trendOverTime)
  const trendChartData: Record<string, string | number>[] = data.trendOverTime.map((monthEntry) => ({
    label: monthEntry.month as string,
    value: (topTopicNames[0] ? (monthEntry[topTopicNames[0]] as number) : 0) || 0,
    ...topTopicNames.reduce(
      (acc, name) => ({ ...acc, [name]: (monthEntry[name] as number) || 0 }),
      {} as Record<string, number>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Topic Trends"
        description="Emerging research areas and their momentum"
      />

      {/* Trend Chart - Top 5 topics over time */}
      {trendChartData.length > 0 && topTopicNames.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Top 5 Topics Over 12 Months
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {topTopicNames.slice(0, 3).map((name, i) => (
              <AreaTrend
                key={name}
                title={name}
                data={trendChartData.map((d) => ({
                  label: String(d.label),
                  value: (d[name] as number) || 0,
                }))}
                color={trendColors[i]}
                height={180}
                className="border-0 p-0"
              />
            ))}
          </div>
          {topTopicNames.length > 3 && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {topTopicNames.slice(3, 5).map((name, i) => (
                <AreaTrend
                  key={name}
                  title={name}
                  data={trendChartData.map((d) => ({
                    label: String(d.label),
                    value: (d[name] as number) || 0,
                  }))}
                  color={trendColors[i + 3]}
                  height={180}
                  className="border-0 p-0"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Topic Cards Grid */}
      {sortedTopics.length === 0 ? (
        <EmptyState
          title="No topics tracked"
          description="Topic trends will appear as you publish and engage with research."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTopics.map((topic) => (
            <div
              key={topic.topic}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{topic.topic}</p>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    topic.momentum > 0
                      ? "bg-success-light text-success"
                      : topic.momentum < 0
                        ? "bg-danger-light text-danger"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {topic.momentum > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : topic.momentum < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {topic.momentum > 0 ? "+" : ""}
                  {topic.momentum}%
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <p className="text-[10px] uppercase tracking-wider">
                      Funding
                    </p>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-sm font-semibold",
                      topic.fundingGrowth > 0
                        ? "text-success"
                        : topic.fundingGrowth < 0
                          ? "text-danger"
                          : ""
                    )}
                  >
                    {topic.fundingGrowth > 0 ? "+" : ""}
                    {topic.fundingGrowth}%
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <p className="text-[10px] uppercase tracking-wider">
                      Pubs
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold">
                    {topic.publicationCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FlaskConical className="h-3 w-3" />
                    <p className="text-[10px] uppercase tracking-wider">
                      Grants
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold">
                    {topic.relatedGrants}
                  </p>
                </div>
              </div>

              {/* Related Topics */}
              {topic.relatedTopics.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Related Topics
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {topic.relatedTopics.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-portal-accent-light px-2 py-0.5 text-[10px] font-medium text-portal-accent"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
