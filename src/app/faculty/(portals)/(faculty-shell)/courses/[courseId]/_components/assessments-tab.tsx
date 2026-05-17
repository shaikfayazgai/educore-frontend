"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Send,
  Lock,
  Trash2,
  Users,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  useFacultyAssessments,
  usePublishAssessment,
  useCloseAssessment,
  useDeleteAssessment,
  useAssessmentSubmissions,
} from "@/faculty/lib/hooks/use-faculty";
import { StatusBadge } from "@/faculty/components/shared/feedback/status-badge";
import { EmptyState } from "@/faculty/components/shared/feedback/empty-state";
import { ErrorState } from "@/faculty/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/faculty/components/shared/feedback/confirm-dialog";
import { ApiError } from "@/faculty/lib/api/client";
import type {
  Assessment,
  AssessmentStatus,
  AssessmentType,
} from "@/faculty/lib/api/types/assessment.types";
import { cn } from "@/faculty/lib/utils/cn";
import { AssessmentDrawer } from "./assessment-drawer";

const TYPE_LABEL: Record<AssessmentType, string> = {
  quiz: "Quiz",
  midterm: "Midterm",
  final: "Final",
  exam: "Exam",
};

const STATUS_VARIANT: Record<
  AssessmentStatus,
  React.ComponentProps<typeof StatusBadge>["variant"]
> = {
  draft: "muted",
  published: "success",
  closed: "warning",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AssessmentsTab({ courseId }: { courseId: string }) {
  const { data: assessments, isLoading, isError, refetch } = useFacultyAssessments(courseId);
  const publishMut = usePublishAssessment();
  const closeMut = useCloseAssessment();
  const deleteMut = useDeleteAssessment();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    | null
    | {
        type: "publish" | "close" | "delete";
        assessmentId: string;
        title: string;
      }
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = useMemo(() => assessments ?? [], [assessments]);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(a: Assessment) {
    setEditing(a);
    setDrawerOpen(true);
    setOpenMenuId(null);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  async function performConfirmed() {
    if (!confirm) return;
    setActionError(null);
    try {
      if (confirm.type === "publish") {
        await publishMut.mutateAsync({ courseId, assessmentId: confirm.assessmentId });
      } else if (confirm.type === "close") {
        await closeMut.mutateAsync({ courseId, assessmentId: confirm.assessmentId });
      } else if (confirm.type === "delete") {
        await deleteMut.mutateAsync({ courseId, assessmentId: confirm.assessmentId });
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Unexpected error. Please retry.";
      setActionError(msg);
      throw err;
    }
  }

  // ─── Skeletons / Error / Empty ────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Assessments</h2>
          <p className="text-xs text-muted-foreground">
            Author quizzes and exams students take in-browser. Auto-graded on submit.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Create Assessment
        </button>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-light/20 px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments yet"
          description="Create your first quiz or exam. Students will see published assessments on their course page."
          action={{ label: "Create Assessment", onClick: openCreate }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Window</th>
                <th className="px-4 py-3 text-left font-medium">Attempts</th>
                <th className="px-4 py-3 text-left font-medium">Weight</th>
                <th className="px-4 py-3 text-left font-medium">Questions</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const isExpanded = expandedId === a.id;
                return (
                  <RowGroup
                    key={a.id}
                    assessment={a}
                    isExpanded={isExpanded}
                    onToggleExpand={() =>
                      setExpandedId(isExpanded ? null : a.id)
                    }
                    onEdit={() => openEdit(a)}
                    onPublish={() =>
                      setConfirm({
                        type: "publish",
                        assessmentId: a.id,
                        title: a.title,
                      })
                    }
                    onClose={() =>
                      setConfirm({
                        type: "close",
                        assessmentId: a.id,
                        title: a.title,
                      })
                    }
                    onDelete={() =>
                      setConfirm({
                        type: "delete",
                        assessmentId: a.id,
                        title: a.title,
                      })
                    }
                    openMenuId={openMenuId}
                    onOpenMenu={(id) => setOpenMenuId(id)}
                    courseId={courseId}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <AssessmentDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        courseId={courseId}
        editing={editing}
      />

      {/* Confirmations */}
      <ConfirmDialog
        open={!!confirm && confirm.type === "publish"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Publish assessment"
        description={`Students enrolled in this course will see "${confirm?.title}" and be able to attempt it during its open window.`}
        confirmLabel="Publish"
        onConfirm={performConfirmed}
      />
      <ConfirmDialog
        open={!!confirm && confirm.type === "close"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Close assessment"
        description={`"${confirm?.title}" will be closed immediately. Students with in-progress attempts won't be able to submit new ones, but past results stay visible.`}
        confirmLabel="Close"
        variant="danger"
        onConfirm={performConfirmed}
      />
      <ConfirmDialog
        open={!!confirm && confirm.type === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete assessment"
        description={`Permanently delete "${confirm?.title}". This cannot be undone. Assessments with student attempts cannot be deleted — close them instead.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={performConfirmed}
      />
    </div>
  );
}

// ─── Row + expanded submissions panel ────────────────────────────────────────

function RowGroup({
  assessment: a,
  isExpanded,
  onToggleExpand,
  onEdit,
  onPublish,
  onClose,
  onDelete,
  openMenuId,
  onOpenMenu,
  courseId,
}: {
  assessment: Assessment;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  openMenuId: string | null;
  onOpenMenu: (id: string | null) => void;
  courseId: string;
}) {
  const menuOpen = openMenuId === a.id;
  return (
    <>
      <tr className="border-b border-border last:border-b-0">
        <td className="px-4 py-3">
          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1.5 text-left font-medium hover:underline"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            {a.title}
          </button>
        </td>
        <td className="px-4 py-3">
          <StatusBadge variant="muted">{TYPE_LABEL[a.type]}</StatusBadge>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {formatDateTime(a.opensAt)} → {formatDateTime(a.closesAt)}
        </td>
        <td className="px-4 py-3">{a.attemptsAllowed}</td>
        <td className="px-4 py-3">{a.weight}%</td>
        <td className="px-4 py-3">
          {a.questions.length} ·{" "}
          <span className="text-muted-foreground">{a.maxScore} pts</span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge variant={STATUS_VARIANT[a.status]} dot>
            {a.status}
          </StatusBadge>
        </td>
        <td className="relative px-4 py-3 text-right">
          <button
            onClick={() => onOpenMenu(menuOpen ? null : a.id)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Row actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <RowMenu
              status={a.status}
              onEdit={() => {
                onOpenMenu(null);
                onEdit();
              }}
              onPublish={() => {
                onOpenMenu(null);
                onPublish();
              }}
              onClose={() => {
                onOpenMenu(null);
                onClose();
              }}
              onDelete={() => {
                onOpenMenu(null);
                onDelete();
              }}
            />
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border last:border-b-0 bg-muted/20">
          <td colSpan={8} className="px-4 py-4">
            <SubmissionsPanel courseId={courseId} assessment={a} />
          </td>
        </tr>
      )}
    </>
  );
}

function RowMenu({
  status,
  onEdit,
  onPublish,
  onClose,
  onDelete,
}: {
  status: AssessmentStatus;
  onEdit: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute right-3 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 text-left shadow-md">
      <button
        onClick={onEdit}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
      {status === "draft" && (
        <button
          onClick={onPublish}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
        >
          <Send className="h-3.5 w-3.5 text-success" />
          Publish
        </button>
      )}
      {status === "published" && (
        <button
          onClick={onClose}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
        >
          <Lock className="h-3.5 w-3.5 text-warning" />
          Close
        </button>
      )}
      <button
        onClick={onDelete}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-light/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

function SubmissionsPanel({
  courseId,
  assessment,
}: {
  courseId: string;
  assessment: Assessment;
}) {
  const { data, isLoading, isError, refetch } = useAssessmentSubmissions(
    courseId,
    assessment.id,
  );
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }
  const submissions = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {submissions.length === 0
            ? "No student attempts yet."
            : `${submissions.length} ${submissions.length === 1 ? "student" : "students"}`}
        </span>
      </div>
      {submissions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Student</th>
                <th className="px-3 py-2 text-left font-medium">Attempts</th>
                <th className="px-3 py-2 text-left font-medium">Best score</th>
                <th className="px-3 py-2 text-left font-medium">Last submitted</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.studentId} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 font-medium">{s.studentName}</td>
                  <td className="px-3 py-2">{s.attempts}</td>
                  <td className="px-3 py-2">
                    {typeof s.bestScore === "number" ? (
                      <span className="font-semibold">
                        {s.bestScore}/{assessment.maxScore}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({s.bestPercentage}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {s.lastSubmittedAt
                      ? formatDateTime(s.lastSubmittedAt)
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {s.status === "submitted" && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Submitted
                      </span>
                    )}
                    {s.status === "in_progress" && (
                      <span className="inline-flex items-center gap-1 text-xs text-info">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        In progress
                      </span>
                    )}
                    {s.status === "not_started" && (
                      <span className="text-xs text-muted-foreground">
                        Not started
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
