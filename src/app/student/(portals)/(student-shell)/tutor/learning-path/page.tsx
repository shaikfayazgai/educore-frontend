"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Lock,
  CheckCircle2,
  ArrowRight,
  Clock,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useLearningPaths,
  useStartLearningPath,
  usePauseLearningPath,
  useStartSession,
} from "@/student/lib/hooks/use-tutor";
import { PageHeader } from "@/student/components/shared/misc/page-header";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { EmptyState } from "@/student/components/shared/feedback/empty-state";
import { cn } from "@/student/lib/utils/cn";
import type { LearningPath, LearningModule } from "@/student/lib/api/types/tutor.types";

type FilterTab = "all" | "in_progress" | "completed" | "not_started";

const difficultyVariant: Record<string, "info" | "warning" | "danger"> = {
  beginner: "info",
  intermediate: "warning",
  advanced: "danger",
};

const statusVariant: Record<string, "default" | "success" | "warning" | "info" | "muted"> = {
  not_started: "muted",
  in_progress: "info",
  completed: "success",
  paused: "warning",
};

const statusLabel: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  paused: "Paused",
};

const moduleTypeVariant: Record<string, "default" | "info" | "warning" | "success"> = {
  lesson: "info",
  quiz: "warning",
  assignment: "default",
  project: "success",
};

export default function LearningPathsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skillFilter = searchParams.get("skill");
  const { data: paths, isLoading, isError, refetch } = useLearningPaths();
  const startPath = useStartLearningPath();
  const pausePath = usePauseLearningPath();
  const startSession = useStartSession();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startingModuleId, setStartingModuleId] = useState<string | null>(null);
  const [activeLimitAlert, setActiveLimitAlert] = useState(false);

  // Auto-expand the path matching the skill filter from query params
  useEffect(() => {
    if (skillFilter && paths) {
      const matchingPath = paths.find(
        (p) => p.skill.toLowerCase() === decodeURIComponent(skillFilter).toLowerCase()
      );
      if (matchingPath) {
        setExpandedId(matchingPath.id);
      }
    }
  }, [skillFilter, paths]);

  const handleStartPath = useCallback(async (pathId: string) => {
    const allPaths = paths ?? [];
    const activeCount = allPaths.filter((p) => p.status === "in_progress").length;
    if (activeCount >= 3) {
      setActiveLimitAlert(true);
      return;
    }
    setActiveLimitAlert(false);
    await startPath.mutateAsync(pathId);
  }, [startPath, paths]);

  const handlePausePath = useCallback(async (pathId: string) => {
    await pausePath.mutateAsync(pathId);
  }, [pausePath]);

  const handleStartModule = useCallback(async (moduleId: string, pathId: string) => {
    setStartingModuleId(moduleId);
    try {
      const res = await startSession.mutateAsync({ moduleId, pathId });
      const session = res.data;
      router.push(`/student/tutor/session?id=${session.id}`);
    } finally {
      setStartingModuleId(null);
    }
  }, [startSession, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/tutor"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guided Learning
        </Link>
        <PageHeader icon={BookOpen} title="Learning Paths" description="AI-curated paths to strengthen your skills" />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/tutor"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guided Learning
        </Link>
        <PageHeader icon={BookOpen} title="Learning Paths" description="AI-curated paths to strengthen your skills" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const allPaths = paths ?? [];

  // If skill filter is active, show matching path first with a highlight
  const sortedPaths = skillFilter
    ? [...allPaths].sort((a, b) => {
        const aMatch = a.skill.toLowerCase() === decodeURIComponent(skillFilter).toLowerCase() ? -1 : 0;
        const bMatch = b.skill.toLowerCase() === decodeURIComponent(skillFilter).toLowerCase() ? -1 : 0;
        return aMatch - bMatch;
      })
    : allPaths;

  const filteredPaths = activeTab === "all"
    ? sortedPaths
    : sortedPaths.filter((p) => p.status === activeTab);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: allPaths.length },
    { key: "in_progress", label: "In Progress", count: allPaths.filter((p) => p.status === "in_progress").length },
    { key: "completed", label: "Completed", count: allPaths.filter((p) => p.status === "completed").length },
    { key: "not_started", label: "Not Started", count: allPaths.filter((p) => p.status === "not_started").length },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/student/tutor"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Guided Learning
      </Link>

      <PageHeader icon={BookOpen} title="Learning Paths" description="AI-curated paths to strengthen your skills" />

      {/* Skill filter banner */}
      {skillFilter && (
        <div className="flex items-center justify-between rounded-lg border border-portal-accent/30 bg-portal-accent/5 px-4 py-3">
          <p className="text-sm">
            Showing paths for: <span className="font-semibold">{decodeURIComponent(skillFilter)}</span>
          </p>
          <Link
            href="/student/tutor/learning-path"
            className="text-xs font-medium text-portal-accent hover:underline"
          >
            Clear filter
          </Link>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-portal-accent text-portal-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Active limit alert */}
      {activeLimitAlert && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-light/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-medium">
            You have 3 active learning paths. Pause or complete one before starting a new path.
          </p>
          <button
            onClick={() => setActiveLimitAlert(false)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Paths List */}
      {filteredPaths.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No learning paths found"
          description={activeTab === "all" ? "No learning paths are available yet." : `No ${activeTab.replace("_", " ")} learning paths.`}
        />
      ) : (
        <div className="space-y-3">
          {filteredPaths.map((path) => {
            const isExpanded = expandedId === path.id;
            return (
              <div
                key={path.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : path.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{path.title}</p>
                    <p className="text-xs text-muted-foreground">{path.skill}</p>
                  </div>
                  <StatusBadge variant={difficultyVariant[path.difficulty] ?? "default"}>
                    {path.difficulty}
                  </StatusBadge>
                  <StatusBadge variant={statusVariant[path.status] ?? "muted"} dot>
                    {statusLabel[path.status]}
                  </StatusBadge>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {path.estimatedHours}h
                  </div>
                  <div className="hidden md:block w-32">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{path.completedModules}/{path.totalModules}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          path.status === "completed" ? "bg-success" : "bg-portal-accent"
                        )}
                        style={{ width: `${path.progress}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-muted-foreground">{path.description}</p>
                    {path.author && (
                      <p className="text-xs text-muted-foreground">
                        Created by: <span className="font-medium text-foreground">{path.author}</span>
                      </p>
                    )}

                    {/* Prerequisites & Outcomes */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {path.prerequisites.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Prerequisites
                          </h4>
                          <ul className="space-y-1">
                            {path.prerequisites.map((p, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {path.outcomes.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            What You Will Learn
                          </h4>
                          <ul className="space-y-1">
                            {path.outcomes.map((o, i) => (
                              <li key={i} className="text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                                {o}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Path Actions */}
                    <div className="flex items-center gap-2">
                      {path.status === "not_started" && (
                        <button
                          onClick={() => handleStartPath(path.id)}
                          disabled={startPath.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                        >
                          {startPath.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          Start Path
                        </button>
                      )}
                      {path.status === "in_progress" && (
                        <button
                          onClick={() => handlePausePath(path.id)}
                          disabled={pausePath.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          {pausePath.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                          Pause Path
                        </button>
                      )}
                      {path.status === "paused" && (
                        <button
                          onClick={() => handleStartPath(path.id)}
                          disabled={startPath.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                        >
                          {startPath.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          Resume Path
                        </button>
                      )}
                    </div>

                    {/* Modules List */}
                    <div>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Modules ({path.completedModules}/{path.totalModules})
                      </h4>
                      <div className="space-y-2">
                        {path.modules
                          .sort((a, b) => a.order - b.order)
                          .map((mod, modIdx, sortedMods) => (
                            <ModuleItem
                              key={mod.id}
                              module={mod}
                              pathId={path.id}
                              onStart={handleStartModule}
                              isStarting={startingModuleId === mod.id}
                              previousModuleName={modIdx > 0 ? sortedMods[modIdx - 1].title : undefined}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModuleItem({
  module: mod,
  pathId,
  onStart,
  isStarting,
  previousModuleName,
}: {
  module: LearningModule;
  pathId: string;
  onStart: (moduleId: string, pathId: string) => void;
  isStarting: boolean;
  previousModuleName?: string;
}) {
  const isLocked = mod.status === "locked";
  const isCompleted = mod.status === "completed";
  const isAvailable = mod.status === "available";
  const isInProgress = mod.status === "in_progress";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        isLocked
          ? "border-border bg-muted/30 opacity-60"
          : isCompleted
            ? "border-success/20 bg-success-light/20"
            : "border-border bg-card hover:bg-muted/50"
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : isAvailable || isInProgress ? (
          <ArrowRight className="h-4 w-4 text-portal-accent" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Module Info */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isLocked && "text-muted-foreground")}>
          {mod.title}
        </p>
        <p className="text-xs text-muted-foreground">{mod.description}</p>
        {isLocked && previousModuleName && (
          <p className="mt-0.5 text-xs text-muted-foreground/70 italic">
            Complete {previousModuleName} to unlock
          </p>
        )}
      </div>

      {/* Meta */}
      <StatusBadge variant={moduleTypeVariant[mod.type] ?? "default"}>
        {mod.type}
      </StatusBadge>
      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {mod.duration} min
      </span>

      {/* Score (if completed) */}
      {isCompleted && mod.score !== undefined && mod.maxScore !== undefined && (
        <span className="text-xs font-medium text-success">
          {mod.score}/{mod.maxScore}
        </span>
      )}

      {/* Action Buttons */}
      {isAvailable && (
        <button
          onClick={() => onStart(mod.id, pathId)}
          disabled={isStarting}
          className="inline-flex items-center gap-1 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {isStarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Start
        </button>
      )}
      {isInProgress && (
        <button
          onClick={() => onStart(mod.id, pathId)}
          disabled={isStarting}
          className="inline-flex items-center gap-1 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {isStarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
          Resume
        </button>
      )}
    </div>
  );
}
