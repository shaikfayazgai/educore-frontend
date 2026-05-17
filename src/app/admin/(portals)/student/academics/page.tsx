"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, ChevronDown, ChevronRight, Download } from "lucide-react";
import { useCourses, useTranscript } from "@/admin/lib/hooks/use-student";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { CardSkeleton, TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { EmptyState } from "@/admin/components/shared/feedback/empty-state";
import { cn } from "@/admin/lib/utils/cn";
import { formatGpa, formatPercentage } from "@/admin/lib/utils/format";
import type { Course, TranscriptSemester } from "@/admin/lib/api/types/student.types";

type TabId = "current" | "transcript";

export default function StudentAcademicsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("current");
  const [search, setSearch] = useState("");

  const coursesQuery = useCourses({ status: "active" });
  const transcriptQuery = useTranscript();

  const isLoading = activeTab === "current" ? coursesQuery.isLoading : transcriptQuery.isLoading;
  const isError = activeTab === "current" ? coursesQuery.isError : transcriptQuery.isError;
  const refetch = activeTab === "current" ? coursesQuery.refetch : transcriptQuery.refetch;

  const summary = useMemo(() => {
    const semesters = transcriptQuery.data;
    if (!semesters || semesters.length === 0) return null;
    const latest = semesters[semesters.length - 1];
    const totalCreditsEarned = semesters.reduce((sum, s) => sum + s.creditsEarned, 0);
    const totalCreditsAttempted = semesters.reduce((sum, s) => sum + s.creditsAttempted, 0);
    return {
      cumulativeGpa: latest.cumulativeGpa,
      creditsEarned: totalCreditsEarned,
      creditsAttempted: totalCreditsAttempted,
      currentSemesterGpa: latest.semesterGpa,
    };
  }, [transcriptQuery.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Academics"
        description="Your courses, grades, and transcript"
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Download Unofficial Transcript
          </button>
        }
      />

      {summary && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCell label="Cumulative GPA" value={formatGpa(summary.cumulativeGpa)} />
            <SummaryCell label="Credits Earned" value={`${summary.creditsEarned}`} />
            <SummaryCell label="Credits Attempted" value={`${summary.creditsAttempted}`} />
            <SummaryCell label="Current Semester GPA" value={formatGpa(summary.currentSemesterGpa)} />
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <TabButton active={activeTab === "current"} onClick={() => setActiveTab("current")}>
          Current Semester
        </TabButton>
        <TabButton active={activeTab === "transcript"} onClick={() => setActiveTab("transcript")}>
          Full Transcript
        </TabButton>
      </div>

      {isLoading &&
        (activeTab === "current" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton rows={8} />
        ))}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && activeTab === "current" && (
        <CurrentSemesterTab
          courses={coursesQuery.data?.courses ?? []}
          search={search}
          onSearchChange={setSearch}
        />
      )}

      {!isLoading && !isError && activeTab === "transcript" && (
        <TranscriptTab
          semesters={transcriptQuery.data ?? []}
          search={search}
          onSearchChange={setSearch}
        />
      )}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function CurrentSemesterTab({
  courses,
  search,
  onSearchChange,
}: {
  courses: Course[];
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!search) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [courses, search]);

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onSearch={onSearchChange}
        placeholder="Search courses..."
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={search ? "Try adjusting your search." : "No active courses this semester."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <button
              key={course.id}
              onClick={() => router.push(`/student/academics/${course.id}`)}
              className="group rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-portal-accent/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <StatusBadge variant="default">{course.code}</StatusBadge>
                {course.grade && (
                  <span className="text-lg font-bold text-portal-accent">{course.grade}</span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold group-hover:text-portal-accent">
                {course.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{course.credits} credits</span>
                <div
                  className="flex items-center gap-1.5"
                  title="Attendance data synced from your institution's records"
                >
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        course.attendance >= 80
                          ? "bg-success"
                          : course.attendance >= 60
                            ? "bg-warning"
                            : "bg-danger"
                      )}
                      style={{ width: `${Math.min(course.attendance, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatPercentage(course.attendance, 0)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscriptTab({
  semesters,
  search,
  onSearchChange,
}: {
  semesters: TranscriptSemester[];
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(semesters.length > 0 ? [semesters[semesters.length - 1].semester] : [])
  );

  const toggle = (semId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(semId)) next.delete(semId);
      else next.add(semId);
      return next;
    });
  };

  const filteredSemesters = useMemo(() => {
    if (!search) return semesters;
    const q = search.toLowerCase();
    return semesters
      .map((sem) => ({
        ...sem,
        courses: sem.courses.filter(
          (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        ),
      }))
      .filter((sem) => sem.courses.length > 0);
  }, [semesters, search]);

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onSearch={onSearchChange}
        placeholder="Search transcript..."
        className="max-w-sm"
      />

      {filteredSemesters.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No records found"
          description="No transcript records match your search."
        />
      ) : (
        <div className="space-y-3">
          {[...filteredSemesters].reverse().map((sem) => {
            const isOpen = expanded.has(sem.semester);
            return (
              <div
                key={`${sem.semester}-${sem.year}`}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <button
                  onClick={() => toggle(sem.semester)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold">
                      {sem.semester} {sem.year}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Semester GPA</p>
                      <p className="text-sm font-semibold">{formatGpa(sem.semesterGpa)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Cumulative</p>
                      <p className="text-sm font-semibold">{formatGpa(sem.cumulativeGpa)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Credits</p>
                      <p className="text-sm font-semibold">
                        {sem.creditsEarned}/{sem.creditsAttempted}
                      </p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Code
                          </th>
                          <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Course
                          </th>
                          <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Instructor
                          </th>
                          <th className="px-5 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Credits
                          </th>
                          <th className="px-5 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Grade
                          </th>
                          <th className="px-5 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((c) => (
                          <tr key={c.id} className="border-b border-border last:border-b-0">
                            <td className="px-5 py-3 text-sm font-medium">{c.code}</td>
                            <td className="px-5 py-3 text-sm">{c.name}</td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">
                              {c.instructor}
                            </td>
                            <td className="px-5 py-3 text-center text-sm">{c.credits}</td>
                            <td className="px-5 py-3 text-center text-sm font-semibold">
                              {c.grade || "-"}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <StatusBadge
                                variant={
                                  c.status === "completed"
                                    ? "success"
                                    : c.status === "active"
                                      ? "info"
                                      : "muted"
                                }
                              >
                                {c.status}
                              </StatusBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
