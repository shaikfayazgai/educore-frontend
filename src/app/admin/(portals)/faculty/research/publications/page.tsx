"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { useFacultyPublications } from "@/admin/lib/hooks/use-faculty";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { DataTable } from "@/admin/components/shared/data-table/data-table";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { cn } from "@/admin/lib/utils/cn";
import { formatNumber } from "@/admin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { FacultyPublication } from "@/admin/lib/api/types/faculty.types";

const typeFilterOptions = [
  { value: "all", label: "All Types" },
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "book_chapter", label: "Book Chapter" },
  { value: "preprint", label: "Preprint" },
];

const typeVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  journal: "default",
  conference: "info",
  book_chapter: "success",
  preprint: "warning",
};

const columns: ColumnDef<FacultyPublication, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="min-w-[200px] max-w-[400px]">
        <p className="font-medium text-sm">{row.original.title}</p>
        {row.original.doi && (
          <a
            href={`https://doi.org/${row.original.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-portal-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            DOI
          </a>
        )}
      </div>
    ),
  },
  {
    accessorKey: "journal",
    header: "Journal/Venue",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.journal}</span>
    ),
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => <span className="font-medium">{row.original.year}</span>,
  },
  {
    accessorKey: "citations",
    header: "Citations",
    cell: ({ row }) => (
      <span className="font-semibold">{formatNumber(row.original.citations)}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <StatusBadge variant={typeVariant[row.original.type] || "muted"}>
        {row.original.type.replace("_", " ")}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "coAuthors",
    header: "Co-Authors",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.coAuthors.length > 0
          ? row.original.coAuthors.join(", ")
          : "Solo"}
      </span>
    ),
  },
];

export default function FacultyResearchPublicationsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: publications, isLoading, isError, refetch } = useFacultyPublications({
    type: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  // Sort by year desc, then citations desc
  const sortedPublications = [...(publications ?? [])].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.citations - a.citations;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/faculty/research"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Research
      </Link>

      <PageHeader
        icon={FileText}
        title="Publications"
        description="Track and manage your research publications"
      />

      <p className="text-xs text-muted-foreground -mt-4">
        Publication data from institutional records.
      </p>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onSearch={handleSearch}
          placeholder="Search publications..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {typeFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={sortedPublications}
        showSearch={false}
        emptyTitle="No publications found"
        emptyDescription="Try adjusting your search or filter criteria."
      />
    </div>
  );
}
