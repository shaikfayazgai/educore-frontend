"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Globe,
  Mail,
  User,
  ExternalLink,
} from "lucide-react";
import { useEmployerDetail } from "@/admin/lib/hooks/use-placement";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { BarComparison } from "@/admin/components/shared/charts/bar-comparison";
import { DataTable } from "@/admin/components/shared/data-table/data-table";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { formatDate, formatCurrency, formatNumber } from "@/admin/lib/utils/format";
import { cn } from "@/admin/lib/utils/cn";
import type { ColumnDef } from "@tanstack/react-table";
import type { EmployerJob } from "@/admin/lib/api/types/placement.types";

function getSizeLabel(size: string) {
  const map: Record<string, string> = {
    startup: "Startup",
    small: "Small (1-50)",
    medium: "Medium (51-200)",
    large: "Large (201-1000)",
    enterprise: "Enterprise (1000+)",
  };
  return map[size] || size;
}

function getJobStatusVariant(status: string) {
  const map: Record<string, "success" | "muted" | "warning"> = {
    active: "success",
    closed: "muted",
    filled: "warning",
  };
  return map[status] || "muted";
}

export default function PlacementEmployerDetailPage({
  params,
}: {
  params: Promise<{ employerId: string }>;
}) {
  const { employerId } = use(params);
  const { data: employer, isLoading, isError, refetch } =
    useEmployerDetail(employerId);

  const hiringHistoryData = useMemo(() => {
    if (!employer?.hiringHistory) return [];
    return employer.hiringHistory.map((h) => ({
      label: String(h.year),
      hires: h.hires,
    }));
  }, [employer]);

  const jobColumns: ColumnDef<EmployerJob, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Job Title",
        cell: ({ row }) => (
          <p className="text-sm font-medium">{row.original.title}</p>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <StatusBadge variant="muted">
            {row.original.type.replace("_", " ")}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.location}</span>
        ),
      },
      {
        id: "salary",
        header: "Salary",
        cell: ({ row }) =>
          row.original.salary ? (
            <span className="text-sm">
              {formatCurrency(row.original.salary.min)} -{" "}
              {formatCurrency(row.original.salary.max)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not specified</span>
          ),
      },
      {
        accessorKey: "applicants",
        header: "Applicants",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {row.original.applicants}
          </span>
        ),
      },
      {
        accessorKey: "deadline",
        header: "Deadline",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.deadline)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            variant={getJobStatusVariant(row.original.status)}
            dot
          >
            {row.original.status}
          </StatusBadge>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/placement/employers"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employers
        </Link>
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !employer) {
    return (
      <div className="space-y-6">
        <Link
          href="/placement/employers"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employers
        </Link>
        <ErrorState
          title="Failed to load employer"
          message="Could not retrieve employer details. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/placement/employers"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employers
      </Link>

      {/* Employer Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-portal-accent-light text-lg font-bold text-portal-accent">
              {employer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{employer.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{employer.industry}</span>
                <StatusBadge variant="muted">
                  {getSizeLabel(employer.size)}
                </StatusBadge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {employer.website && (
              <a
                href={employer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href={`mailto:${employer.contactEmail}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          </div>
        </div>

        {/* Contact + Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Contact Person</p>
            <div className="mt-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-medium">{employer.contactName}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Postings</p>
            <p className="mt-1 text-sm font-semibold">
              {employer.activeJobPostings}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Hires</p>
            <p className="mt-1 text-sm font-semibold">
              {formatNumber(employer.totalHires)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Engagement Score</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    employer.engagementScore >= 80
                      ? "bg-success"
                      : employer.engagementScore >= 50
                        ? "bg-warning"
                        : "bg-danger"
                  )}
                  style={{ width: `${employer.engagementScore}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {employer.engagementScore}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {employer.description && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              About
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              {employer.description}
            </p>
          </div>
        )}
      </div>

      {/* Hiring History */}
      {hiringHistoryData.length > 0 && (
        <BarComparison
          title="Hiring History"
          data={hiringHistoryData}
          bars={[{ dataKey: "hires", label: "Hires", color: "#2563eb" }]}
        />
      )}

      {/* Active Job Postings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">
          Job Postings ({employer.jobPostings?.length ?? 0})
        </h2>
        {employer.jobPostings && employer.jobPostings.length > 0 ? (
          <DataTable
            columns={jobColumns}
            data={employer.jobPostings}
            showSearch={false}
            showPagination={employer.jobPostings.length > 10}
            emptyTitle="No job postings"
            emptyDescription="This employer has no active job postings."
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No job postings from this employer.
          </div>
        )}
      </div>
    </div>
  );
}
