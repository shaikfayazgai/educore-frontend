"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale, Plus } from "lucide-react";
import { useAppeals } from "@/student/lib/hooks/use-student";
import { PageHeader } from "@/student/components/shared/misc/page-header";
import { DataTable } from "@/student/components/shared/data-table/data-table";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { EmptyState } from "@/student/components/shared/feedback/empty-state";
import { formatDate } from "@/student/lib/utils/format";
import { APPEAL_STATUS_LABELS } from "@/student/lib/utils/constants";
import type { ColumnDef } from "@tanstack/react-table";
import type { Appeal } from "@/student/lib/api/types/student.types";
import type { AppealStatus } from "@/student/lib/api/types/common.types";

function getAppealStatusVariant(status: AppealStatus) {
  const map: Record<AppealStatus, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    pending: "warning",
    under_review: "info",
    info_requested: "warning",
    resolved: "success",
    rejected: "danger",
    escalated: "info",
  };
  return map[status] || "muted";
}

const columns: ColumnDef<Appeal, unknown>[] = [
  {
    accessorKey: "courseCode",
    header: "Course",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.courseCode}</p>
        <p className="text-xs text-muted-foreground">{row.original.courseName}</p>
      </div>
    ),
  },
  {
    accessorKey: "assessmentName",
    header: "Assessment",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.assessmentName}</p>
        <p className="text-xs text-muted-foreground">{row.original.assessmentType}</p>
      </div>
    ),
  },
  {
    accessorKey: "currentScore",
    header: "Score",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.currentScore}/{row.original.maxScore}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge variant={getAppealStatusVariant(row.original.status)} dot>
        {APPEAL_STATUS_LABELS[row.original.status]}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
];

export default function StudentAppealsPage() {
  const { data: appeals, isLoading, isError, refetch } = useAppeals();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Scale} title="Appeals" description="Score appeal history" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scale}
        title="Appeals"
        description="Submit and track score appeals"
        actions={
          <Link
            href="/student/appeals/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Appeal
          </Link>
        }
      />

      {!appeals || appeals.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No appeals submitted"
          description="If you believe a grade was incorrectly assessed, you can submit an appeal for review."
          action={{
            label: "Submit New Appeal",
            onClick: () => router.push("/student/appeals/new"),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={appeals}
          searchKey="courseCode"
          searchPlaceholder="Search appeals..."
          onRowClick={(row) => router.push(`/student/appeals/${row.id}`)}
          emptyTitle="No appeals match your search"
        />
      )}
    </div>
  );
}
