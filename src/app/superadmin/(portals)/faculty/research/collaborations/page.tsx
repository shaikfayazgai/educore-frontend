"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Network,
  Mail,
  Star,
  FileText,
} from "lucide-react";
import { useFacultyCollaborations } from "@/superadmin/lib/hooks/use-faculty";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import type { FacultyCollaboration } from "@/superadmin/lib/api/types/faculty.types";

export default function FacultyResearchCollaborationsPage() {
  const [search, setSearch] = useState("");
  const { data: collaborators, isLoading, isError, refetch } = useFacultyCollaborations({
    search: search || undefined,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

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
        icon={Network}
        title="Collaboration Network"
        description="Discover and connect with potential collaborators"
      />

      {/* Search */}
      <SearchInput
        value={search}
        onSearch={handleSearch}
        placeholder="Search by name, institution, or expertise..."
        className="max-w-md"
      />

      {/* Collaborator Cards Grid */}
      {!collaborators || collaborators.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No collaborators found"
          description={
            search
              ? "Try adjusting your search terms."
              : "No potential collaborators have been identified yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collaborators.map((collab) => (
            <CollaboratorCard key={collab.id} collaborator={collab} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollaboratorCard({ collaborator }: { collaborator: FacultyCollaboration }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        {collaborator.avatarUrl ? (
          <img
            src={collaborator.avatarUrl}
            alt={collaborator.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-portal-accent-light text-portal-accent font-semibold">
            {collaborator.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{collaborator.name}</p>
          <p className="text-xs text-muted-foreground">{collaborator.department}</p>
          <p className="text-xs text-muted-foreground">{collaborator.institution}</p>
        </div>
      </div>

      {/* Match Score */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-portal-accent" />
          <span className="text-sm font-medium text-portal-accent">
            {collaborator.matchScore}% match
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            {collaborator.sharedPublications} co-authored paper{collaborator.sharedPublications !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          Based on research interest overlap and publication history.
        </p>
      </div>

      {/* Expertise Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {collaborator.expertise.map((exp, i) => (
          <span
            key={i}
            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {exp}
          </span>
        ))}
      </div>

      {/* Email Link */}
      <a
        href={`mailto:${collaborator.email}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
      >
        <Mail className="h-3.5 w-3.5" />
        {collaborator.email}
      </a>
    </div>
  );
}
