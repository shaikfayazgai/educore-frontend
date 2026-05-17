"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  UserCircle,
  FileText,
  MessageSquare,
  Calendar,
  Send,
  AlertTriangle,
  Shield,
} from "lucide-react";
import {
  useAdmissionApplications,
  useReviewApplication,
  useScheduleInterview,
  useAddReviewNote,
} from "@/superadmin/lib/hooks/use-admissions";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { StatusBadge, getRiskVariant } from "@/superadmin/components/shared/feedback/status-badge";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { Timeline } from "@/superadmin/components/shared/misc/timeline";
import { TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { cn } from "@/superadmin/lib/utils/cn";
import { formatDate, formatRelative } from "@/superadmin/lib/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdmissionApplication, AdmissionStatus } from "@/superadmin/lib/api/types/admissions.types";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interview_completed", label: "Interview Completed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
];

const DEPARTMENT_OPTIONS = [
  { value: "", label: "All Departments" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "Engineering", label: "Engineering" },
  { value: "Business", label: "Business" },
  { value: "Arts & Sciences", label: "Arts & Sciences" },
  { value: "Medicine", label: "Medicine" },
  { value: "Law", label: "Law" },
];

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  submitted: "muted",
  under_review: "info",
  interview_scheduled: "warning",
  interview_completed: "warning",
  accepted: "success",
  rejected: "danger",
  waitlisted: "default",
  enrolled: "success",
  withdrawn: "muted",
};

const statusLabel: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  enrolled: "Enrolled",
  withdrawn: "Withdrawn",
};

const noteTypeOptions = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "interview", label: "Interview" },
  { value: "decision", label: "Decision" },
];

export default function AdmissionsApplicationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAdmissionApplications({
    search: search || undefined,
    status: status || undefined,
    department: department || undefined,
    page,
    pageSize: 20,
  });

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "danger" | "default";
    confirmLabel: string;
    applicationId: string;
    outcome: string;
  } | null>(null);

  // Reason textarea for reject/waitlist
  const [reason, setReason] = useState("");

  // Interview form
  const [interviewForm, setInterviewForm] = useState<{
    applicationId: string;
    date: string;
    time: string;
    interviewerName: string;
  } | null>(null);
  const [interviewErrors, setInterviewErrors] = useState<Record<string, string>>({});

  // Success feedback messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add note form
  const [noteForm, setNoteForm] = useState<{ applicationId: string } | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");

  const reviewApplication = useReviewApplication();
  const scheduleInterview = useScheduleInterview();
  const addReviewNote = useAddReviewNote();

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const openConfirm = useCallback((applicationId: string, outcome: string) => {
    setReason("");
    if (outcome === "accepted") {
      setConfirmDialog({
        open: true,
        title: "Accept Application",
        description: "Are you sure you want to accept this application? This action will notify the applicant.",
        variant: "default",
        confirmLabel: "Accept",
        applicationId,
        outcome,
      });
    } else if (outcome === "rejected") {
      setConfirmDialog({
        open: true,
        title: "Reject Application",
        description: "Please provide a reason for rejection. This action will notify the applicant.",
        variant: "danger",
        confirmLabel: "Reject",
        applicationId,
        outcome,
      });
    } else if (outcome === "waitlisted") {
      setConfirmDialog({
        open: true,
        title: "Waitlist Application",
        description: "Are you sure you want to place this application on the waitlist?",
        variant: "default",
        confirmLabel: "Waitlist",
        applicationId,
        outcome,
      });
    }
  }, []);

  const handleConfirmReview = useCallback(async () => {
    if (!confirmDialog) return;
    if (confirmDialog.outcome === "rejected" && !reason.trim()) return;
    await reviewApplication.mutateAsync({
      applicationId: confirmDialog.applicationId,
      outcome: confirmDialog.outcome,
      reason: reason.trim() || undefined,
    });
    if (confirmDialog.outcome === "accepted") {
      setSuccessMessage(
        "Application accepted. Acceptance notification will be sent to the applicant. Next step: Enrollment confirmation."
      );
    } else if (confirmDialog.outcome === "rejected") {
      setSuccessMessage(
        "Application rejected. The applicant will be notified with the provided reason."
      );
    } else if (confirmDialog.outcome === "waitlisted") {
      setSuccessMessage(
        "Application waitlisted. The applicant will be notified of their waitlist status."
      );
    }
    setConfirmDialog(null);
    setReason("");
    setTimeout(() => setSuccessMessage(null), 8000);
  }, [confirmDialog, reason, reviewApplication]);

  const handleScheduleInterview = useCallback(async () => {
    if (!interviewForm) return;
    const errors: Record<string, string> = {};
    if (!interviewForm.date) errors.date = "Date is required";
    if (!interviewForm.time) errors.time = "Time is required";
    if (!interviewForm.interviewerName.trim()) errors.interviewerName = "Interviewer name is required";
    if (Object.keys(errors).length > 0) {
      setInterviewErrors(errors);
      return;
    }
    const interviewerName = interviewForm.interviewerName.trim();
    await scheduleInterview.mutateAsync(interviewForm);
    setSuccessMessage(
      `Interview scheduled. Calendar invite will be sent to ${interviewerName} and the applicant.`
    );
    setInterviewForm(null);
    setInterviewErrors({});
    setTimeout(() => setSuccessMessage(null), 8000);
  }, [interviewForm, scheduleInterview]);

  const handleAddNote = useCallback(async () => {
    if (!noteForm || !noteContent.trim()) return;
    await addReviewNote.mutateAsync({
      applicationId: noteForm.applicationId,
      content: noteContent.trim(),
      type: noteType,
    });
    setNoteForm(null);
    setNoteContent("");
    setNoteType("general");
  }, [noteForm, noteContent, noteType, addReviewNote]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admissions
        </Link>
        <PageHeader icon={ClipboardList} title="Applications" description="Review and manage admission applications" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/admissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admissions
        </Link>
        <PageHeader icon={ClipboardList} title="Applications" description="Review and manage admission applications" />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const applications = data?.applications ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/admissions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admissions
      </Link>

      <PageHeader
        icon={ClipboardList}
        title="Applications"
        description="Review and manage admission applications"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onSearch={handleSearch}
          placeholder="Search applicants..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
        >
          {DEPARTMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Success Feedback Banner */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-light/30 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
          <p className="text-sm font-medium text-success">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-success/60 hover:text-success"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No applications found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            const hasDecision = !!app.decision;
            return (
              <div
                key={app.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{app.applicantName}</p>
                    <p className="text-xs text-muted-foreground">{app.programApplied} - {app.department}</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-muted-foreground">Applied</p>
                    <p className="text-xs font-medium">{formatDate(app.applicationDate)}</p>
                  </div>
                  {/* AI Score */}
                  <div className="hidden md:flex items-center gap-2 w-28">
                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          app.aiScore >= 80 ? "bg-success" : app.aiScore >= 60 ? "bg-warning" : "bg-danger"
                        )}
                        style={{ width: `${app.aiScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{app.aiScore}</span>
                  </div>
                  <StatusBadge variant={statusVariant[app.status] ?? "muted"} dot>
                    {statusLabel[app.status] ?? app.status}
                  </StatusBadge>
                  {app.scholarshipEligible && (
                    <StatusBadge variant="success">Scholarship</StatusBadge>
                  )}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-5 space-y-6">
                    {/* AI Profile */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-portal-accent" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          AI Assessment
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-3">
                          <ScoreBar label="Academic" value={app.aiProfile.academicScore} />
                          <ScoreBar label="Extracurricular" value={app.aiProfile.extracurricularScore} />
                          <ScoreBar label="Essay" value={app.aiProfile.essayScore} />
                          <ScoreBar label="Recommendation" value={app.aiProfile.recommendationScore} />
                          <ScoreBar label="Overall Fit" value={app.aiProfile.overallFit} highlight />
                          <p className="text-[11px] text-muted-foreground/70 leading-snug pt-1">
                            Scores generated by Glimmora Admissions AI v2.1. Based on academic records, essays, and extracurricular profile.
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Strengths</p>
                            <ul className="space-y-1">
                              {app.aiProfile.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-sm">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Concerns</p>
                            <ul className="space-y-1">
                              {app.aiProfile.concerns.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-sm">
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">Predicted GPA</p>
                            <p className="text-lg font-semibold">{app.aiProfile.predictedGpa.toFixed(2)}</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">Graduation Likelihood</p>
                            <p className="text-lg font-semibold">{app.aiProfile.predictedGraduation}%</p>
                          </div>
                          <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">Risk Level</p>
                            <StatusBadge variant={getRiskVariant(app.aiProfile.riskLevel)} dot size="md">
                              {app.aiProfile.riskLevel}
                            </StatusBadge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Documents
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{doc.name}</span>
                            <StatusBadge
                              variant={
                                doc.type === "transcript" ? "info" :
                                doc.type === "essay" ? "default" :
                                doc.type === "recommendation" ? "success" :
                                "muted"
                              }
                            >
                              {doc.type}
                            </StatusBadge>
                            <StatusBadge
                              variant={
                                doc.status === "verified" ? "success" :
                                doc.status === "flagged" ? "danger" :
                                "muted"
                              }
                            >
                              {doc.status}
                            </StatusBadge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Review Notes
                          </h3>
                        </div>
                        {noteForm?.applicationId !== app.id && (
                          <button
                            onClick={() => setNoteForm({ applicationId: app.id })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
                          >
                            Add Note
                          </button>
                        )}
                      </div>

                      {/* Add Note Form */}
                      {noteForm?.applicationId === app.id && (
                        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Write a review note..."
                            rows={3}
                            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 hover:border-muted-foreground"
                          />
                          <div className="flex items-center gap-3">
                            <select
                              value={noteType}
                              onChange={(e) => setNoteType(e.target.value)}
                              className="flex h-9 rounded-lg border border-input bg-background px-3 text-sm transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                            >
                              {noteTypeOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <div className="flex-1" />
                            <button
                              onClick={() => { setNoteForm(null); setNoteContent(""); setNoteType("general"); }}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddNote}
                              disabled={!noteContent.trim() || addReviewNote.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                            >
                              {addReviewNote.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              Add Note
                            </button>
                          </div>
                        </div>
                      )}

                      {app.reviewNotes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No review notes yet.</p>
                      ) : (
                        <Timeline
                          items={app.reviewNotes.map((n) => ({
                            id: n.id,
                            title: n.content,
                            description: `${n.author} - ${n.type}`,
                            date: formatRelative(n.date),
                            variant: n.type === "decision" ? "warning" : n.type === "interview" ? "info" : "default" as const,
                          }))}
                        />
                      )}
                    </div>

                    {/* Decision Display (for decided applications) */}
                    {hasDecision && app.decision && (
                      <div className={cn(
                        "rounded-lg border p-4",
                        app.decision.outcome === "accepted"
                          ? "border-success/20 bg-success-light/20"
                          : app.decision.outcome === "rejected"
                            ? "border-danger/20 bg-danger-light/20"
                            : "border-border bg-muted/20"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {app.decision.outcome === "accepted" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : app.decision.outcome === "rejected" ? (
                            <XCircle className="h-4 w-4 text-danger" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <StatusBadge variant={statusVariant[app.decision.outcome] ?? "muted"}>
                            {statusLabel[app.decision.outcome] ?? app.decision.outcome}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Decided by <span className="font-medium text-foreground">{app.decision.decidedBy}</span> on {formatDate(app.decision.decidedAt)}
                        </p>
                        {app.decision.reason && (
                          <p className="mt-2 text-sm">{app.decision.reason}</p>
                        )}
                      </div>
                    )}

                    {/* Actions (for non-decided) */}
                    {!hasDecision && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => openConfirm(app.id, "accepted")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => openConfirm(app.id, "rejected")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => openConfirm(app.id, "waitlisted")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Waitlist
                        </button>
                        <button
                          onClick={() => {
                            setInterviewForm({
                              applicationId: app.id,
                              date: "",
                              time: "",
                              interviewerName: "",
                            });
                            setInterviewErrors({});
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Schedule Interview
                        </button>
                      </div>
                    )}

                    {/* Interview Scheduling Form */}
                    {interviewForm?.applicationId === app.id && (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                        <h4 className="text-sm font-semibold">Schedule Interview</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                              Date<span className="text-danger ml-0.5">*</span>
                            </label>
                            <input
                              type="date"
                              value={interviewForm.date}
                              onChange={(e) =>
                                setInterviewForm({ ...interviewForm, date: e.target.value })
                              }
                              className={cn(
                                "flex h-9 w-full rounded-lg border bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
                                interviewErrors.date ? "border-danger" : "border-input hover:border-muted-foreground"
                              )}
                            />
                            {interviewErrors.date && (
                              <p className="text-xs text-danger">{interviewErrors.date}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                              Time<span className="text-danger ml-0.5">*</span>
                            </label>
                            <input
                              type="time"
                              value={interviewForm.time}
                              onChange={(e) =>
                                setInterviewForm({ ...interviewForm, time: e.target.value })
                              }
                              className={cn(
                                "flex h-9 w-full rounded-lg border bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
                                interviewErrors.time ? "border-danger" : "border-input hover:border-muted-foreground"
                              )}
                            />
                            {interviewErrors.time && (
                              <p className="text-xs text-danger">{interviewErrors.time}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                              Interviewer<span className="text-danger ml-0.5">*</span>
                            </label>
                            <input
                              type="text"
                              value={interviewForm.interviewerName}
                              onChange={(e) =>
                                setInterviewForm({ ...interviewForm, interviewerName: e.target.value })
                              }
                              placeholder="Dr. Smith"
                              className={cn(
                                "flex h-9 w-full rounded-lg border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
                                interviewErrors.interviewerName ? "border-danger" : "border-input hover:border-muted-foreground"
                              )}
                            />
                            {interviewErrors.interviewerName && (
                              <p className="text-xs text-danger">{interviewErrors.interviewerName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setInterviewForm(null); setInterviewErrors({}); }}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleScheduleInterview}
                            disabled={scheduleInterview.isPending}
                            className="inline-flex items-center gap-1 rounded-lg bg-portal-accent px-4 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                          >
                            {scheduleInterview.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                            Schedule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= (meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog for accept/waitlist */}
      {confirmDialog && confirmDialog.outcome !== "rejected" && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={handleConfirmReview}
        />
      )}

      {/* Custom reject modal with required reason textarea */}
      {confirmDialog?.outcome === "rejected" && confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{confirmDialog.description}</p>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">
                Reason<span className="text-danger ml-0.5">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
              />
              {!reason.trim() && (
                <p className="text-xs text-danger">Reason is required for rejection.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmDialog(null); setReason(""); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={!reason.trim() || reviewApplication.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {reviewApplication.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={cn("font-medium", highlight && "text-portal-accent")}>{label}</span>
        <span className={cn("font-semibold", highlight && "text-portal-accent")}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            highlight ? "bg-portal-accent" :
            value >= 80 ? "bg-success" :
            value >= 60 ? "bg-warning" :
            "bg-danger"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
