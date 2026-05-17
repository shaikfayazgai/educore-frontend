"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Pencil,
  Trash2,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  useInterventionDetail,
  useUpdateIntervention,
  useEditInterventionNote,
  useDeleteInterventionNote,
} from "@/superadmin/lib/hooks/use-faculty";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatDate, formatRelative } from "@/superadmin/lib/utils/format";

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  planned: "info",
  active: "default",
  completed: "success",
  abandoned: "muted",
};

const typeLabels: Record<string, string> = {
  academic_support: "Academic Support",
  counseling: "Counseling",
  mentoring: "Mentoring",
  schedule_adjustment: "Schedule Adjustment",
  financial_aid: "Financial Aid",
};

export default function FacultyInterventionDetailPage({
  params,
}: {
  params: Promise<{ interventionId: string }>;
}) {
  const { interventionId } = use(params);
  const { data: intervention, isLoading, isError, refetch } = useInterventionDetail(interventionId);
  const updateIntervention = useUpdateIntervention();
  const editNote = useEditInterventionNote();
  const deleteNote = useDeleteInterventionNote();

  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [outcomes, setOutcomes] = useState("");
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [deletingNoteIndex, setDeletingNoteIndex] = useState<number | null>(null);
  const [confirmReopen, setConfirmReopen] = useState(false);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !intervention) return <ErrorState onRetry={() => refetch()} />;

  const canEdit = intervention.status === "active" || intervention.status === "planned";

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await updateIntervention.mutateAsync({
        id: intervention.id,
        note: note.trim(),
      });
      setNote("");
    } finally {
      setAddingNote(false);
    }
  };

  const handleMarkCompleted = async () => {
    await updateIntervention.mutateAsync({
      id: intervention.id,
      status: "completed",
    });
  };

  const handleMarkAbandoned = async () => {
    await updateIntervention.mutateAsync({
      id: intervention.id,
      status: "abandoned",
    });
  };

  const handleActivate = async () => {
    await updateIntervention.mutateAsync({
      id: interventionId,
      status: "active",
    });
  };

  const handleReopen = async () => {
    await updateIntervention.mutateAsync({
      id: interventionId,
      status: "active",
    });
  };

  const handleSaveNoteEdit = async (noteIndex: number) => {
    if (!editingNoteContent.trim()) return;
    await editNote.mutateAsync({
      interventionId,
      noteIndex,
      content: editingNoteContent.trim(),
    });
    setEditingNoteIndex(null);
    setEditingNoteContent("");
  };

  const handleDeleteNote = async (noteIndex: number) => {
    await deleteNote.mutateAsync({
      interventionId,
      noteIndex,
    });
    setDeletingNoteIndex(null);
  };

  const handleSaveOutcomes = async () => {
    await updateIntervention.mutateAsync({
      id: intervention.id,
      outcomes: outcomes.trim(),
    });
    setEditingOutcomes(false);
  };

  const sortedNotes = [...intervention.notes]
    .map((n, originalIndex) => ({ ...n, originalIndex }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/interventions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interventions
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{intervention.studentName}</h1>
              <StatusBadge variant={statusVariant[intervention.status]} dot>
                {intervention.status}
              </StatusBadge>
            </div>
            <Link
              href={`/faculty/students/${intervention.studentId}`}
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-portal-accent hover:underline"
            >
              View {intervention.studentName}&apos;s Profile &rarr;
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge variant="muted">
                {typeLabels[intervention.type] || intervention.type}
              </StatusBadge>
              <span className="text-sm text-muted-foreground">
                Started {formatDate(intervention.startDate)}
              </span>
              {intervention.endDate && (
                <span className="text-sm text-muted-foreground">
                  Ended {formatDate(intervention.endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {intervention.status === "planned" && (
              <button
                onClick={handleActivate}
                disabled={updateIntervention.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {updateIntervention.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Activate
              </button>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => setConfirmComplete(true)}
                  disabled={updateIntervention.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Completed
                </button>
                <button
                  onClick={() => setConfirmAbandon(true)}
                  disabled={updateIntervention.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Abandon
                </button>
              </>
            )}
            {intervention.status === "completed" && (
              <button
                onClick={() => setConfirmReopen(true)}
                disabled={updateIntervention.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {updateIntervention.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description & Goals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {intervention.description}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Goals</h2>
          <ul className="mt-2 space-y-2">
            {intervention.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-accent-light text-xs font-medium text-portal-accent">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Outcomes Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Outcomes</h2>
          {intervention.status === "completed" && !editingOutcomes && (
            <button
              onClick={() => {
                setOutcomes(intervention.outcomes || "");
                setEditingOutcomes(true);
              }}
              className="text-sm font-medium text-portal-accent hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        {editingOutcomes ? (
          <div className="mt-3 space-y-3">
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
              placeholder="Describe the outcomes of this intervention..."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveOutcomes}
                disabled={updateIntervention.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {updateIntervention.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Outcomes
              </button>
              <button
                onClick={() => setEditingOutcomes(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {intervention.outcomes || "No outcomes recorded yet."}
          </p>
        )}
      </div>

      {/* Add Note Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Add Note</h2>
        </div>
        <div className="mt-3 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
            placeholder="Add a note about this intervention..."
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !note.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {addingNote && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Note
          </button>
        </div>
      </div>

      {/* Notes Timeline */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Notes History</h2>
        {sortedNotes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No notes yet. Add the first note above.
          </p>
        ) : (
          <div className="space-y-0">
            {sortedNotes.map((n, index) => {
              const isLast = index === sortedNotes.length - 1;
              const isEditing = editingNoteIndex === n.originalIndex;
              const isDeleting = deletingNoteIndex === n.originalIndex;

              return (
                <div key={`note-${n.originalIndex}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Line */}
                  {!isLast && (
                    <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
                  )}

                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-border" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.author}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingNoteIndex(n.originalIndex);
                            setEditingNoteContent(n.content);
                          }}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit note"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingNoteIndex(n.originalIndex)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                          title="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveNoteEdit(n.originalIndex)}
                            disabled={editNote.isPending || !editingNoteContent.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                          >
                            {editNote.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingNoteIndex(null);
                              setEditingNoteContent("");
                            }}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.content}</p>
                    )}

                    {isDeleting && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                        <span className="text-xs font-medium text-danger">Delete this note?</span>
                        <button
                          onClick={() => handleDeleteNote(n.originalIndex)}
                          disabled={deleteNote.isPending}
                          className="inline-flex items-center gap-1 rounded bg-danger px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
                        >
                          {deleteNote.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingNoteIndex(null)}
                          className="rounded border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          No
                        </button>
                      </div>
                    )}

                    <p className="mt-1 text-xs text-muted-foreground">{formatRelative(n.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Mark as Completed"
        description="Are you sure you want to mark this intervention as completed? You can still add outcomes afterwards."
        confirmLabel="Mark Completed"
        onConfirm={handleMarkCompleted}
      />
      <ConfirmDialog
        open={confirmAbandon}
        onOpenChange={setConfirmAbandon}
        title="Abandon Intervention"
        description="Are you sure you want to abandon this intervention? This action indicates the intervention was stopped without completion."
        confirmLabel="Abandon"
        variant="danger"
        onConfirm={handleMarkAbandoned}
      />
      <ConfirmDialog
        open={confirmReopen}
        onOpenChange={setConfirmReopen}
        title="Reopen Intervention"
        description="Are you sure you want to reopen this intervention? It will be set back to active status."
        confirmLabel="Reopen"
        onConfirm={handleReopen}
      />
    </div>
  );
}
