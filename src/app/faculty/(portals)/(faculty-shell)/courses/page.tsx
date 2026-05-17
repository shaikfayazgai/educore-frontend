"use client";

import Link from "next/link";
import {
  GraduationCap,
  Users,
  AlertTriangle,
  BarChart3,
  Clock,
} from "lucide-react";
import { useFacultyCourses } from "@/faculty/lib/hooks/use-faculty";
import { PageHeader } from "@/faculty/components/shared/misc/page-header";
import { StatusBadge } from "@/faculty/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/faculty/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/faculty/components/shared/feedback/error-state";
import { EmptyState } from "@/faculty/components/shared/feedback/empty-state";
import { cn } from "@/faculty/lib/utils/cn";
import { formatPercentage } from "@/faculty/lib/utils/format";
import type { FacultyCourse } from "@/faculty/lib/api/types/faculty.types";

export default function FacultyCoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useFacultyCourses();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!courses || courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={GraduationCap}
          title="My Courses"
          description="Course list and analytics"
        />
        <EmptyState
          icon={GraduationCap}
          title="No courses assigned"
          description="You don't have any courses assigned yet."
        />
      </div>
    );
  }

  const totalStudents = courses.reduce((sum, c) => sum + c.totalStudents, 0);
  const avgAttendance =
    courses.reduce((sum, c) => sum + c.attendanceRate, 0) / courses.length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="My Courses"
        description="Course list and analytics"
      />

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-xs text-muted-foreground">Total Courses</span>
          <p className="text-lg font-semibold">{courses.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-xs text-muted-foreground">Total Students</span>
          <p className="text-lg font-semibold">{totalStudents}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-xs text-muted-foreground">Avg. Attendance</span>
          <p className="text-lg font-semibold">{formatPercentage(avgAttendance, 0)}</p>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: FacultyCourse }) {
  return (
    <Link
      href={`/faculty/courses/${course.id}`}
      className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-portal-accent/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <StatusBadge variant="muted">{course.code}</StatusBadge>
          <h3 className="mt-2 text-sm font-semibold group-hover:text-portal-accent">
            {course.name}
          </h3>
        </div>
        {course.studentsAtRisk > 0 && (
          <StatusBadge variant="danger" dot>
            {course.studentsAtRisk} at risk
          </StatusBadge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Students</p>
          <p className="text-sm font-semibold">{course.totalStudents}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Grade</p>
          <p className="text-sm font-semibold">{course.averageGrade.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Attendance</p>
          <p
            className={cn(
              "text-sm font-semibold",
              course.attendanceRate < 75
                ? "text-danger"
                : course.attendanceRate < 85
                ? "text-warning"
                : "text-success"
            )}
          >
            {formatPercentage(course.attendanceRate, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Credits</p>
          <p className="text-sm font-semibold">{course.credits}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {course.schedule}
      </div>
    </Link>
  );
}
