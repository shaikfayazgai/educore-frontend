"use client";

import { useState, useMemo, useCallback } from "react";
import { FileText, ExternalLink, BookOpen, Quote } from "lucide-react";
import { useResearchPublications } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { TableSkeleton, CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";
import type { ColumnDef } from "@tanstack/react-table";
import type { ResearchPublication } from "@/superadmin/lib/api/types/research.types";

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Journal", value: "journal" },
  { label: "Conference", value: "conference" },
  { label: "Book Chapter", value: "book_chapter" },
  { label: "Preprint", value: "preprint" },
];

function getTypeVariant(type: string) {
  const map: Record<string, "default" | "info" | "warning" | "muted"> = {
    journal: "default",
    conference: "info",
    book_chapter: "muted",
    preprint: "warning",
  };
  return map[type] || "muted";
}

export default function ResearchPublicationsPage() {
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useResearchPublications({
    type: type || undefined,
    search: search || undefined,
    page,
    pageSize: 20,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const publications = data?.publications ?? [];

  // Summary stats
  const summary = useMemo(() => {
    if (!publications.length) return null;
    const totalCitations = publications.reduce((sum, p) => sum + p.citations, 0);
    return {
      total: publications.length,
      totalCitations,
      avgCitations:
        publications.length > 0
          ? Math.round(totalCitations / publications.length)
          : 0,
    };
  }, [publications]);

  const columns: ColumnDef<ResearchPublication, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <p className="truncate text-sm font-medium">
              {row.original.title}
            </p>
            {row.original.coAuthors.length > 0 && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                with {row.original.coAuthors.slice(0, 3).join(", ")}
                {row.original.coAuthors.length > 3 &&
                  ` +${row.original.coAuthors.length - 3}`}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "journal",
        header: "Journal / Venue",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.journal}</span>
        ),
      },
      {
        accessorKey: "year",
        header: "Year",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.year}</span>
        ),
      },
      {
        accessorKey: "citations",
        header: "Citations",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {formatNumber(row.original.citations)}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <StatusBadge variant={getTypeVariant(row.original.type)}>
            {row.original.type.replace("_", " ")}
          </StatusBadge>
        ),
      },
      {
        id: "doi",
        header: "DOI",
        cell: ({ row }) =>
          row.original.doi ? (
            <a
              href={`https://doi.org/${row.original.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
            >
              Link
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          ),
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Publications"
        description="Your research publications and impact metrics"
      />

      {/* Summary Stats */}
      {!isLoading && !isError && summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Publications"
            value={formatNumber(summary.total)}
            icon={BookOpen}
          />
          <StatCard
            label="Total Citations"
            value={formatNumber(summary.totalCitations)}
            icon={Quote}
          />
          <StatCard
            label="Avg Citations / Paper"
            value={formatNumber(summary.avgCitations)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setType(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search publications..."
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load publications"
          message="Could not retrieve your publications. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={publications}
          searchKey="title"
          showSearch={false}
          emptyTitle="No publications found"
          emptyDescription={
            search || type
              ? "Try adjusting your filters."
              : "You have no publications yet."
          }
        />
      )}
    </div>
  );
}
