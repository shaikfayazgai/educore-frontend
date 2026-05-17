"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Loader2,
  User,
  Users,
} from "lucide-react";
import {
  useProgrammeAcademicYearCourses,
  useSemesterCourses,
} from "@/admin/lib/hooks/use-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { formatDate } from "@/admin/lib/utils/format";
import { cn } from "@/admin/lib/utils/cn";

/**
 * Course overview page reached from the per-semester "N courses" chip
 * or the per-programme chip on the Academic Calendar page.
 *
 * Two URL modes:
 *   - ?semester=<sem_id>           → all programmes' courses in this semester
 *   - ?mapping=<programme_ay_id>   → courses for one programme in one AY
 *
 * Renders a clear table (Code · Course · Programme · Department · Year ·
 * Branch/Section · Faculty · Credits · Enrolled) plus a Back button so
 * the admin can return to the calendar without losing scroll position
 * (router.back uses the browser's history stack).
 */
export default function CoursesOverviewPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const semesterId = sp.get("semester");
  const mappingId = sp.get("mapping");

  // Both hooks are gated by `enabled: !!id` so only one fires per page load.
  const semQuery = useSemesterCourses(semesterId);
  const progQuery = useProgrammeAcademicYearCourses(mappingId);

  const isSem = !!semesterId;
  const isProg = !!mappingId;
  const isLoading = (isSem && semQuery.isLoading) || (isProg && progQuery.isLoading);
  const isError = (isSem && semQuery.isError) || (isProg && progQuery.isError);

  const rows = isSem
    ? semQuery.data?.data ?? []
    : isProg
      ? progQuery.data?.data ?? []
      : [];

  const totalEnrolled = rows.reduce((sum, r) => sum + r.enrolledCount, 0);

  // Build a context-aware title + subtitle from whichever payload fired.
  const title = isSem
    ? `Courses in ${semQuery.data?.meta.semesterName ?? "Semester"}`
    : isProg
      ? `Courses · ${progQuery.data?.meta.programmeName ?? "Programme"}`
      : "Courses";

  const subtitle = isSem
    ? semQuery.data
      ? `${semQuery.data.meta.academicYearName} · ${formatDate(semQuery.data.meta.startDate || "")} → ${formatDate(semQuery.data.meta.endDate || "")}`
      : ""
    : isProg
      ? progQuery.data
        ? `${progQuery.data.meta.academicYearName} · ${progQuery.data.meta.programmeDepartment || "—"}`
        : ""
      : "";

  if (!isSem && !isProg) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BookOpen} title="Courses" description="Course overview" />
        <ErrorState
          title="Missing context"
          message="Open this page from the Academic Calendar by clicking a course-count chip."
          onRetry={() => router.push("/admin/semesters")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row: back link + title block. Sits above PageHeader so the
          back chip is easy to reach on mobile too. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-1 flex items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                <BookOpen className="h-4 w-4 text-portal-accent" />
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {!isLoading && !isError && (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="rounded-md bg-muted px-2 py-1 font-medium">
              {rows.length} course{rows.length === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-portal-accent-light/60 px-2 py-1 font-medium text-portal-accent">
              <Users className="h-3 w-3" />
              {totalEnrolled} enrolled
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading courses…</p>
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load courses"
          message="Could not retrieve course data. Try again."
          onRetry={() => isSem ? semQuery.refetch() : progQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No courses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isProg
              ? "Set a Programme or Department on courses to link them here."
              : "Courses appear here once they're assigned to this semester (catalog entry or offering)."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Responsive scroll container — keeps a single horizontal scroll
              on narrow viewports so the table doesn't break the layout. */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Course</th>
                  {/* Programme column only meaningful on the semester view;
                      on the per-programme view it's redundant with the title. */}
                  {isSem && <th className="px-4 py-3">Programme</th>}
                  <th className="px-4 py-3">Department</th>
                  {/* Semester column only useful on programme view (spans 2 sems) */}
                  {isProg && <th className="px-4 py-3">Semester</th>}
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3 text-right">Credits</th>
                  <th className="px-4 py-3 text-right">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, idx) => {
                  // `programmeName` exists on SemesterCourse; on
                  // ProgrammeAYCourse it's undefined. Cast through the
                  // intersection so TS lets us read it conditionally.
                  const programmeName = (r as { programmeName?: string }).programmeName ?? "";
                  return (
                    <tr key={r.offeringId ?? r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.code || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      {isSem && (
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs",
                            programmeName ? "font-medium" : "italic text-muted-foreground",
                          )}>
                            {programmeName || "Unassigned"}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs",
                          r.department ? "" : "italic text-muted-foreground",
                        )}>
                          {r.department || "—"}
                        </span>
                      </td>
                      {isProg && (
                        <td className="px-4 py-3 text-xs">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            {r.semesterName || "—"}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs">
                        {r.yearOfStudy != null ? `Y${r.yearOfStudy}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.facultyName ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {r.facultyName}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {r.credits ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-md bg-portal-accent-light/60 px-2 py-0.5 text-[11px] font-medium text-portal-accent">
                          <Users className="h-3 w-3" />
                          {r.enrolledCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
