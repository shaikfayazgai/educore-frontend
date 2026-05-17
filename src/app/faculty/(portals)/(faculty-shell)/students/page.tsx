"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, AlertTriangle, AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useFacultyStudents } from "@/faculty/lib/hooks/use-faculty";
import { PageHeader } from "@/faculty/components/shared/misc/page-header";
import { SearchInput } from "@/faculty/components/shared/forms/search-input";
import { DataTable } from "@/faculty/components/shared/data-table/data-table";
import { RiskIndicator } from "@/faculty/components/shared/misc/risk-indicator";
import { DashboardSkeleton } from "@/faculty/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/faculty/components/shared/feedback/error-state";
import { cn } from "@/faculty/lib/utils/cn";
import { formatGpa, formatPercentage, formatRelative } from "@/faculty/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { FacultyStudentListItem } from "@/faculty/lib/api/types/faculty.types";

const riskFilterOptions = [
  { value: "all", label: "All Risk Levels" },
  { value: "high", label: "High Risk" },
  { value: "medium", label: "Medium Risk" },
  { value: "low", label: "Low Risk" },
  { value: "none", label: "No Risk" },
];

const columns: ColumnDef<FacultyStudentListItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "studentId",
    header: "Student ID",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.studentId}</span>
    ),
  },
  {
    accessorKey: "program",
    header: "Program",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.program}</span>
    ),
  },
  {
    accessorKey: "gpa",
    header: "GPA",
    cell: ({ row }) => (
      <span className="font-semibold">{formatGpa(row.original.gpa)}</span>
    ),
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: ({ row }) => <RiskIndicator level={row.original.riskLevel} />,
  },
  {
    accessorKey: "attendanceRate",
    header: "Attendance",
    cell: ({ row }) => {
      const rate = row.original.attendanceRate;
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium",
            rate < 75
              ? "text-danger"
              : rate < 85
              ? "text-warning"
              : "text-success"
          )}
        >
          {formatPercentage(rate, 0)}
          {rate < 75 ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : rate < 85 ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {formatRelative(row.original.lastActivity)}
      </span>
    ),
  },
];

export default function FacultyStudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("all");

  const { data, isLoading, isError, refetch } = useFacultyStudents({
    search: search || undefined,
    riskLevel: riskLevel === "all" ? undefined : riskLevel,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleRowClick = useCallback(
    (row: FacultyStudentListItem) => {
      router.push(`/faculty/students/${row.id}`);
    },
    [router]
  );

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const students = data?.students ?? [];
  const highRiskCount = students.filter((s) => s.riskLevel === "high").length;
  const mediumRiskCount = students.filter((s) => s.riskLevel === "medium").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="My Students"
        description="Student roster with risk indicators"
      />

      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-xs text-muted-foreground">Total Students</span>
          <p className="text-lg font-semibold">{students.length}</p>
        </div>
        <div className="rounded-lg border border-danger/20 bg-danger-light/30 px-4 py-2">
          <span className="flex items-center gap-1 text-xs text-danger">
            <AlertTriangle className="h-3 w-3" />
            High Risk
          </span>
          <p className="text-lg font-semibold text-danger">{highRiskCount}</p>
        </div>
        <div className="rounded-lg border border-warning/20 bg-warning-light/30 px-4 py-2">
          <span className="flex items-center gap-1 text-xs text-warning">
            <AlertCircle className="h-3 w-3" />
            Medium Risk
          </span>
          <p className="text-lg font-semibold text-warning">{mediumRiskCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onSearch={handleSearch}
          placeholder="Search students..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {riskFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        showSearch={false}
        onRowClick={handleRowClick}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your search or filter criteria."
      />
    </div>
  );
}
