"use client";

import Link from "next/link";
import {
  Briefcase,
  Search,
  ClipboardList,
  FileText,
  ArrowRight,
  Target,
  Zap,
} from "lucide-react";
import { useCareerReadiness } from "@/student/lib/hooks/use-student";
import { PageHeader } from "@/student/components/shared/misc/page-header";
import { GaugeChart } from "@/student/components/shared/charts/gauge-chart";
import { BarComparison } from "@/student/components/shared/charts/bar-comparison";
import { StatCard } from "@/student/components/shared/misc/stat-card";
import { DashboardSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { cn } from "@/student/lib/utils/cn";

export default function StudentPlacementPage() {
  const { data, isLoading, isError, refetch } = useCareerReadiness();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const barData = data.breakdown.map((b) => ({
    label: b.category,
    score: b.score,
    max: b.maxScore,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Placement & Career"
        description="Career readiness, job matching, and applications"
      />

      {/* Top row: Gauge + Quick Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GaugeChart label="Career Readiness Score" value={data.overallScore} size="lg" />

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Matched Jobs" value={data.matchedJobs} icon={Target} />
            <StatCard label="Active Applications" value={data.applicationsActive} icon={ClipboardList} />
          </div>

          {/* Top Skills & Gap Skills */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Zap className="h-4 w-4 text-success" />
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.topSkills.map((skill) => (
                  <StatusBadge key={skill} variant="success">{skill}</StatusBadge>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-warning" />
                Gap Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.gapSkills.map((skill) => (
                  <StatusBadge key={skill} variant="warning">{skill}</StatusBadge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Readiness Breakdown */}
      <BarComparison
        title="Readiness Breakdown"
        data={barData}
        bars={[
          { dataKey: "score", label: "Your Score", color: "#2563eb" },
          { dataKey: "max", label: "Maximum", color: "#e5e7eb" },
        ]}
        height={280}
      />

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavCard
          href="/student/placement/jobs"
          icon={Search}
          title="Browse Jobs"
          description="View AI-matched job opportunities"
        />
        <NavCard
          href="/student/placement/applications"
          icon={ClipboardList}
          title="My Applications"
          description="Track your application status"
        />
        <NavCard
          href="/student/placement/portfolio"
          icon={FileText}
          title="Portfolio"
          description="Manage your evidence portfolio"
        />
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-portal-accent/50 hover:shadow-md"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-portal-accent-light">
        <Icon className="h-5 w-5 text-portal-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold group-hover:text-portal-accent">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-portal-accent" />
    </Link>
  );
}
