"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  X,
} from "lucide-react";
import { useJobMatches, useApplyToJob, useSaveJob, useUnsaveJob } from "@/student/lib/hooks/use-student";
import { PageHeader } from "@/student/components/shared/misc/page-header";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { SearchInput } from "@/student/components/shared/forms/search-input";
import { AiConfidenceIndicator } from "@/student/components/shared/ai/ai-confidence-indicator";
import { CardSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { EmptyState } from "@/student/components/shared/feedback/empty-state";
import { cn } from "@/student/lib/utils/cn";
import { formatDate, formatCurrency } from "@/student/lib/utils/format";
import type { JobMatch } from "@/student/lib/api/types/student.types";

const typeOptions: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "full_time", label: "Full Time" },
  { value: "internship", label: "Internship" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
];

const matchOptions: { value: number; label: string }[] = [
  { value: 0, label: "Any Match" },
  { value: 50, label: "50%+" },
  { value: 70, label: "70%+" },
  { value: 85, label: "85%+" },
];

export default function StudentPlacementJobsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useJobMatches({
    type: typeFilter || undefined,
    minMatch: minMatch || undefined,
    page,
    pageSize: 20,
  });

  const applyMutation = useApplyToJob();
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();

  const filtered = useMemo(() => {
    if (!data?.jobs) return [];
    if (!search) return data.jobs;
    const q = search.toLowerCase();
    return data.jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }, [data?.jobs, search]);

  return (
    <div className="space-y-6">
      <Link
        href="/student/placement"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Placement
      </Link>

      <PageHeader
        icon={Search}
        title="Job Opportunities"
        description="AI-matched job opportunities based on your skills"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchInput
          value={search}
          onSearch={setSearch}
          placeholder="Search jobs..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={minMatch}
          onChange={(e) => { setMinMatch(Number(e.target.value)); setPage(1); }}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {matchOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try adjusting your filters or check back later."
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={(jobId, note) => applyMutation.mutate({ jobId, note })}
                  isApplying={applyMutation.isPending}
                  applyingId={applyMutation.variables?.jobId}
                  onSave={(jobId) => saveMutation.mutate(jobId)}
                  onUnsave={(jobId) => unsaveMutation.mutate(jobId)}
                  isSaving={saveMutation.isPending || unsaveMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} jobs)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= (data.meta.totalPages || 1)}
                  onClick={() => setPage((p) => p + 1)}
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

function JobCard({
  job,
  onApply,
  isApplying,
  applyingId,
  onSave,
  onUnsave,
  isSaving,
}: {
  job: JobMatch;
  onApply: (jobId: string, note?: string) => void;
  isApplying: boolean;
  applyingId?: string;
  onSave: (jobId: string) => void;
  onUnsave: (jobId: string) => void;
  isSaving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyNote, setApplyNote] = useState("");
  const isThisApplying = isApplying && applyingId === job.id;

  const typeLabel: Record<string, string> = {
    full_time: "Full Time",
    internship: "Internship",
    part_time: "Part Time",
    contract: "Contract",
  };

  const handleConfirmApply = () => {
    onApply(job.id, applyNote || undefined);
    setShowApplyModal(false);
    setApplyNote("");
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-left"
              >
                <h3 className="text-sm font-semibold hover:text-portal-accent">
                  {job.title}
                </h3>
              </button>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
                <StatusBadge variant="muted">{typeLabel[job.type] || job.type}</StatusBadge>
                {job.salary && (
                  <span>
                    {formatCurrency(job.salary.min, job.salary.currency)} - {formatCurrency(job.salary.max, job.salary.currency)}
                  </span>
                )}
              </div>
              {/* Source label */}
              <p className="mt-1 text-xs text-muted-foreground/70">
                Posted via {job.source || "Career Services"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Match score */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Match</p>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-lg font-bold",
                    job.matchScore >= 80 ? "text-success" : job.matchScore >= 60 ? "text-warning" : "text-danger"
                  )}>
                    {job.matchScore}%
                  </span>
                </div>
              </div>

              {/* Bookmark button */}
              <button
                onClick={() => job.saved ? onUnsave(job.id) : onSave(job.id)}
                disabled={isSaving}
                className={cn(
                  "rounded-lg p-2 transition-colors disabled:opacity-50",
                  job.saved
                    ? "text-portal-accent bg-portal-accent/10 hover:bg-portal-accent/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-label={job.saved ? "Remove bookmark" : "Bookmark job"}
              >
                {job.saved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>

              {/* Apply button */}
              {job.applied ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-light px-4 py-2 text-xs font-medium text-success">
                  <Check className="h-3.5 w-3.5" />
                  Applied
                </span>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  disabled={isThisApplying}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                >
                  {isThisApplying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Skills row */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.matchedSkills.map((s) => (
              <StatusBadge key={s} variant="success">{s}</StatusBadge>
            ))}
            {job.gapSkills.map((s) => (
              <Link
                key={s}
                href={`/student/tutor/learning-path?skill=${encodeURIComponent(s)}`}
                className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger-light px-2.5 py-0.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20 hover:underline"
              >
                {s}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ))}
          </div>

          {/* Deadline */}
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Posted {formatDate(job.postedDate)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Deadline: {formatDate(job.deadline)}
            </span>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
          >
            {expanded ? "Show less" : "Show details"}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Expanded description */}
        {expanded && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>

            {/* Employer info */}
            {(job.companyDescription || job.companyIndustry || job.companySize) && (
              <div className="mt-4 rounded-lg bg-muted/50 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About {job.company}
                </h4>
                {job.companyDescription && (
                  <p className="mt-2 text-sm text-muted-foreground">{job.companyDescription}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {job.companyIndustry && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {job.companyIndustry}
                    </span>
                  )}
                  {job.companySize && (
                    <span>
                      {job.companySize} employees
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground italic">{job.matchExplanation}</p>
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">Required Skills</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => (
                  <StatusBadge key={s} variant="muted">{s}</StatusBadge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowApplyModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Apply to {job.title} at {job.company}
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Your profile and portfolio will be shared with {job.company}.
            </p>

            {/* Matched / Gap skills */}
            <div className="mt-4 space-y-2">
              {job.matchedSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Matched Skills</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {job.matchedSkills.map((s) => (
                      <StatusBadge key={s} variant="success">{s}</StatusBadge>
                    ))}
                  </div>
                </div>
              )}
              {job.gapSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Skill Gaps</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {job.gapSkills.map((s) => (
                      <StatusBadge key={s} variant="danger">{s}</StatusBadge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Note textarea */}
            <div className="mt-4">
              <label htmlFor="apply-note" className="text-sm font-medium">
                Add a note (optional):
              </label>
              <textarea
                id="apply-note"
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
                placeholder="Tell the employer why you're a great fit..."
              />
            </div>

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApply}
                disabled={isThisApplying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {isThisApplying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
