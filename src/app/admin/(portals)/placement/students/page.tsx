"use client";

import { useState, useMemo, useCallback } from "react";
import { GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { usePlacementStudents } from "@/admin/lib/hooks/use-placement";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { SearchInput } from "@/admin/components/shared/forms/search-input";
import { DataTable } from "@/admin/components/shared/data-table/data-table";
import { StatusBadge, getRiskVariant } from "@/admin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { formatGpa, formatDate, formatNumber } from "@/admin/lib/utils/format";
import { cn } from "@/admin/lib/utils/cn";
import type { ColumnDef } from "@tanstack/react-table";
import type { PlacementStudent } from "@/admin/lib/api/types/placement.types";

const DEPARTMENTS = [
  { value: "", label: "All Departments" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "Engineering", label: "Engineering" },
  { value: "Business", label: "Business" },
  { value: "Sciences", label: "Sciences" },
  { value: "Arts", label: "Arts" },
];

const MIN_SCORE_OPTIONS = [
  { value: 0, label: "Any Score" },
  { value: 50, label: "50+" },
  { value: 60, label: "60+" },
  { value: 70, label: "70+" },
  { value: 80, label: "80+" },
  { value: 90, label: "90+" },
];

export default function PlacementStudentsPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = usePlacementStudents({
    search: search || undefined,
    department: department || undefined,
    minScore: minScore > 0 ? minScore : undefined,
    pageSize: 50,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const students = data?.students ?? [];

  const columns: ColumnDef<PlacementStudent, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Student",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-portal-accent-light text-xs font-semibold text-portal-accent">
              {row.original.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.studentId}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.department}</span>
        ),
      },
      {
        accessorKey: "gpa",
        header: "GPA",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {formatGpa(row.original.gpa)}
          </span>
        ),
      },
      {
        accessorKey: "employabilityScore",
        header: "Employability",
        cell: ({ row }) => {
          const score = row.original.employabilityScore;
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    score >= 80
                      ? "bg-success"
                      : score >= 60
                        ? "bg-warning"
                        : "bg-danger"
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{score}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "riskLevel",
        header: "Risk",
        cell: ({ row }) => (
          <StatusBadge
            variant={getRiskVariant(row.original.riskLevel)}
            dot
          >
            {row.original.riskLevel}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "applicationCount",
        header: "Applications",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.applicationCount}
          </span>
        ),
      },
      {
        accessorKey: "offerCount",
        header: "Offers",
        cell: ({ row }) => (
          <span
            className={cn(
              "text-sm font-semibold",
              row.original.offerCount > 0 ? "text-success" : ""
            )}
          >
            {row.original.offerCount}
          </span>
        ),
      },
      {
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedId(
                expandedId === row.original.id ? null : row.original.id
              );
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            {expandedId === row.original.id ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        ),
        enableSorting: false,
      },
    ],
    [expandedId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Students"
        description="Student employability directory"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search students..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {MIN_SCORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : isError ? (
        <ErrorState
          title="Failed to load students"
          message="Could not retrieve student data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={students}
            showSearch={false}
            emptyTitle="No students found"
            emptyDescription="Try adjusting your search or filters."
            onRowClick={(row) =>
              setExpandedId(expandedId === row.id ? null : row.id)
            }
          />

          {/* Expanded Student Detail */}
          {expandedId && (() => {
            const student = students.find((s) => s.id === expandedId);
            if (!student) return null;
            return (
              <div className="rounded-xl border border-portal-accent/30 bg-portal-accent-light/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.program} &middot; Graduation:{" "}
                      {formatDate(student.graduationDate)}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-xs font-medium text-portal-accent hover:underline"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Top Skills
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {student.topSkills.length > 0 ? (
                        student.topSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-success-light px-2 py-0.5 text-xs font-medium text-success"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No top skills recorded
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Gap Skills
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {student.gapSkills.length > 0 ? (
                        student.gapSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-danger-light px-2 py-0.5 text-xs font-medium text-danger"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No skill gaps identified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
