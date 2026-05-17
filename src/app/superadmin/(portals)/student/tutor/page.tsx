"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  BookOpen,
  Flame,
  Target,
  TrendingUp,
  Activity,
  ArrowRight,
  Play,
  Clock,
  BarChart3,
  CheckCircle2,
  Zap,
  Pencil,
  Star,
} from "lucide-react";
import {
  useTutorDashboard,
  useRecommendedLessons,
  useUpdateWeeklyGoal,
} from "@/superadmin/lib/hooks/use-tutor";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { Timeline } from "@/superadmin/components/shared/misc/timeline";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatRelative } from "@/superadmin/lib/utils/format";
import type { WeaknessArea, RecommendedLesson } from "@/superadmin/lib/api/types/tutor.types";

const difficultyVariant: Record<string, "default" | "info" | "warning" | "danger"> = {
  beginner: "info",
  intermediate: "warning",
  advanced: "danger",
};

const typeIcon: Record<string, typeof BookOpen> = {
  video: Play,
  reading: BookOpen,
  exercise: Zap,
  quiz: Target,
  project: BarChart3,
};

const activityVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  lesson_completed: "success",
  quiz_passed: "info",
  path_started: "default",
  milestone_reached: "warning",
  streak_achieved: "success",
};

export default function TutorDashboardPage() {
  const { data, isLoading, isError, refetch } = useTutorDashboard();
  const { data: recommended } = useRecommendedLessons();
  const updateWeeklyGoal = useUpdateWeeklyGoal();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BrainCircuit}
          title="Guided Learning"
          description="Your personalized learning dashboard"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BrainCircuit}
          title="Guided Learning"
          description="Your personalized learning dashboard"
        />
        <ErrorState
          title="Failed to load tutor dashboard"
          message="Could not retrieve your learning data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const weeklyPct = data.weeklyGoal.target > 0
    ? Math.round((data.weeklyGoal.completed / data.weeklyGoal.target) * 100)
    : 0;

  const timelineItems = data.recentActivity.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description + (a.xpEarned ? ` (+${a.xpEarned} XP)` : ""),
    date: formatRelative(a.timestamp),
    variant: activityVariantMap[a.type] || ("default" as const),
  }));

  const lessons = recommended ?? data.recommendedLessons ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BrainCircuit}
        title="Guided Learning"
        description="Your personalized learning dashboard"
        actions={
          <Link
            href="/student/tutor/learning-path"
            className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            Learning Paths
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Active Learning Paths"
          value={data.activeLearningPaths}
          icon={BookOpen}
        />
        <StatCard
          label="Completed Lessons"
          value={`${data.completedLessons} / ${data.totalLessons}`}
          icon={CheckCircle2}
          change={data.totalLessons > 0
            ? { value: Math.round((data.completedLessons / data.totalLessons) * 100), label: "completed" }
            : undefined
          }
        />
        <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Level</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <Star className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {data.level}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{data.levelTitle}</p>
        </div>
        <div
          className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          title="Lesson: 50 XP, Quiz passed: 100 XP, Perfect score: 150 XP"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total XP</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {data.totalXp.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Experience points</p>
        </div>
        <div
          className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          title="Consecutive days with at least one completed learning activity"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {data.currentStreak} days
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Keep it going!</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Weekly Goal</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsEditingGoal(!isEditingGoal);
                  setGoalInput(String(data.weeklyGoal.target));
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Edit weekly goal"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                <Target className="h-4 w-4 text-portal-accent" />
              </div>
            </div>
          </div>
          {isEditingGoal ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-portal-accent"
                />
                <span className="text-xs text-muted-foreground">lessons/week</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[3, 5, 7].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setGoalInput(String(preset))}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      goalInput === String(preset)
                        ? "bg-portal-accent text-portal-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={async () => {
                    const target = parseInt(goalInput, 10);
                    if (target > 0) {
                      await updateWeeklyGoal.mutateAsync(target);
                      setIsEditingGoal(false);
                    }
                  }}
                  disabled={updateWeeklyGoal.isPending || !goalInput || parseInt(goalInput, 10) < 1}
                  className="rounded-lg bg-portal-accent px-3 py-1 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                >
                  {updateWeeklyGoal.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingGoal(false)}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {data.weeklyGoal.completed} / {data.weeklyGoal.target}
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{weeklyPct}% complete</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      weeklyPct >= 100 ? "bg-success" : weeklyPct >= 50 ? "bg-portal-accent" : "bg-warning"
                    )}
                    style={{ width: `${Math.min(weeklyPct, 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weakness Areas */}
      {data.weaknesses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Areas to Improve</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.weaknesses.map((w) => (
              <WeaknessCard key={w.skill} weakness={w} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Lessons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recommended For You</h2>
          </div>
          <Link
            href="/student/tutor/learning-path"
            className="text-xs font-medium text-portal-accent hover:underline"
          >
            View all paths
          </Link>
        </div>
        {lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No recommendations yet"
            description="Start a learning path to get personalized lesson recommendations."
            action={{
              label: "Browse Learning Paths",
              onClick: () => window.location.assign("/student/tutor/learning-path"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.slice(0, 6).map((lesson) => (
              <RecommendedLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>

      {/* Skill Progress */}
      {data.skillProgress.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Skill Progress</h2>
          </div>
          <div className="space-y-4">
            {data.skillProgress.map((sp) => (
              <div key={sp.skill} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{sp.skill}</span>
                  <span className="text-xs text-muted-foreground">
                    {sp.lessonsCompleted} lessons completed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs text-muted-foreground">Before</span>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-muted-foreground/40 transition-all"
                          style={{ width: `${sp.before}%` }}
                        />
                      </div>
                      <span className="w-8 text-xs text-muted-foreground text-right">{sp.before}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs text-portal-accent font-medium">After</span>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-portal-accent transition-all"
                          style={{ width: `${sp.after}%` }}
                        />
                      </div>
                      <span className="w-8 text-xs font-medium text-portal-accent text-right">{sp.after}%</span>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    sp.after > sp.before ? "text-success" : sp.after < sp.before ? "text-danger" : "text-muted-foreground"
                  )}>
                    {sp.after > sp.before ? "+" : ""}{sp.after - sp.before}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        {timelineItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </div>
    </div>
  );
}

function WeaknessCard({ weakness }: { weakness: WeaknessArea }) {
  const gapPct = Math.abs(weakness.gap);
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{weakness.skill}</h3>
        <StatusBadge variant={getRiskVariant(weakness.priority)} dot>
          {weakness.priority}
        </StatusBadge>
      </div>

      <div className="mt-3 space-y-2">
        {/* Score vs Benchmark */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Your score: {weakness.score}%</span>
            <span>Benchmark: {weakness.benchmark}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute h-full rounded-full bg-danger/60"
              style={{ width: `${weakness.score}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground/60"
              style={{ left: `${weakness.benchmark}%` }}
            />
          </div>
        </div>

        {/* Gap Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-danger font-medium">
            {gapPct}% below benchmark
          </span>
          <span className="text-xs text-muted-foreground">
            {weakness.suggestedLessons} lessons suggested
          </span>
        </div>
      </div>

      <Link
        href={`/student/tutor/learning-path?skill=${encodeURIComponent(weakness.skill)}`}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-portal-accent px-3 py-2 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
      >
        Start Learning
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function RecommendedLessonCard({ lesson }: { lesson: RecommendedLesson }) {
  const TypeIcon = typeIcon[lesson.type] ?? BookOpen;

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
            <TypeIcon className="h-4 w-4 text-portal-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{lesson.title}</h3>
            <p className="text-xs text-muted-foreground">{lesson.skill}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge variant={difficultyVariant[lesson.difficulty] ?? "default"}>
          {lesson.difficulty}
        </StatusBadge>
        <StatusBadge variant="muted">
          {lesson.type}
        </StatusBadge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {lesson.duration} min
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
        {lesson.matchReason}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {lesson.completionRate}% completion rate
        </span>
        <Link
          href="/student/tutor/learning-path"
          className="inline-flex items-center gap-1 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
        >
          Start Lesson
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
