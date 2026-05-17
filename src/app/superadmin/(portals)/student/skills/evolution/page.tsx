"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSkillEvolution, useSkills } from "@/superadmin/lib/hooks/use-student";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatDate } from "@/superadmin/lib/utils/format";

const SKILL_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

export default function StudentSkillEvolutionPage() {
  const {
    data: evolution,
    isLoading: evolLoading,
    isError: evolError,
    refetch: refetchEvol,
  } = useSkillEvolution();
  const { data: skills } = useSkills();

  const allSkillNames = useMemo(() => {
    if (!evolution || evolution.length === 0) return [];
    const names = new Set<string>();
    evolution.forEach((point) => {
      Object.keys(point.skills).forEach((name) => names.add(name));
    });
    return Array.from(names);
  }, [evolution]);

  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (allSkillNames.length === 0) return;
    setSelectedSkills((prev) =>
      prev.size > 0 ? prev : new Set(allSkillNames.slice(0, 5))
    );
  }, [allSkillNames]);

  if (evolLoading) return <DashboardSkeleton />;
  if (evolError) return <ErrorState onRetry={() => refetchEvol()} />;
  if (!evolution || evolution.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/skills"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Skills
        </Link>
        <PageHeader icon={TrendingUp} title="Skill Evolution" description="Track your skill growth over time" />
        <EmptyState icon={TrendingUp} title="No evolution data" description="Skill evolution data will appear as you progress." />
      </div>
    );
  }

  const chartData = evolution.map((point) => ({
    date: formatDate(point.date),
    ...point.skills,
  }));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) {
        if (next.size > 1) next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedSkills(new Set(allSkillNames));
  const selectNone = () => {
    if (allSkillNames.length > 0) {
      setSelectedSkills(new Set([allSkillNames[0]]));
    }
  };

  const dateRange =
    evolution.length >= 2
      ? `${formatDate(evolution[0].date)} - ${formatDate(evolution[evolution.length - 1].date)}`
      : "";

  return (
    <div className="space-y-6">
      <Link
        href="/student/skills"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Skills
      </Link>

      <PageHeader
        icon={TrendingUp}
        title="Skill Evolution"
        description="Track your skill growth over time"
      />

      {dateRange && (
        <p className="text-xs text-muted-foreground">Date range: {dateRange}</p>
      )}

      {/* Skill selector */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Select Skills</p>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-xs font-medium text-portal-accent hover:underline"
            >
              Select all
            </button>
            <button
              onClick={selectNone}
              className="text-xs font-medium text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allSkillNames.map((skill, i) => {
            const isSelected = selectedSkills.has(skill);
            const color = SKILL_COLORS[i % SKILL_COLORS.length];
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  isSelected
                    ? "border-transparent text-white"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                )}
                style={isSelected ? { backgroundColor: color } : undefined}
              >
                <span
                  className={cn("h-2 w-2 rounded-full", !isSelected && "opacity-50")}
                  style={{ backgroundColor: color }}
                />
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
            <Legend />
            {allSkillNames.map((skill, i) => {
              if (!selectedSkills.has(skill)) return null;
              const color = SKILL_COLORS[i % SKILL_COLORS.length];
              return (
                <Area
                  key={skill}
                  type="monotone"
                  dataKey={skill}
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.05}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: color }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
