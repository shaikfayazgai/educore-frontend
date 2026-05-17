"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Globe,
  MapPin,
  Mail,
  User,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  Trash2,
  Hash,
  Send,
  KeyRound,
  MailCheck,
} from "lucide-react";
import {
  useSuperAdminUniversityDetail,
  useUpdateUniversity,
  useMoveUniversityToTrash,
  useSendUniversityInviteOtp,
  useVerifyUniversityInviteOtp,
} from "@/superadmin/lib/hooks/use-super-admin";
import { ApiError } from "@/superadmin/lib/api/client";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatCard } from "@/superadmin/components/shared/misc/stat-card";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { InviteOtpVerifyDialog } from "@/superadmin/components/shared/feedback/invite-otp-verify-dialog";
import { formatDate, formatNumber } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

function getStatusVariant(
  status: "active" | "inactive" | "suspended",
): "success" | "warning" | "danger" {
  if (status === "active") return "success";
  if (status === "inactive") return "warning";
  return "danger";
}

export default function SuperAdminUniversityDetailPage({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (universityId === "trash") {
      router.replace("/superadmin/trash");
    }
  }, [universityId, router]);

  const {
    data: university,
    isLoading,
    isError,
    refetch,
  } = useSuperAdminUniversityDetail(universityId);
  const updateUniversity = useUpdateUniversity();
  const moveToTrash = useMoveUniversityToTrash();
  const sendInviteOtp = useSendUniversityInviteOtp();
  const verifyInviteOtp = useVerifyUniversityInviteOtp();

  const [otpVerifyOpen, setOtpVerifyOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "danger";
    confirmLabel: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    confirmLabel: "Confirm",
    action: async () => {},
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = useCallback(
    (type: "success" | "error", message: string) => {
      setFeedback({ type, message });
      setTimeout(() => setFeedback(null), 5000);
    },
    []
  );

  const handleToggleStatus = useCallback(() => {
    if (!university) return;
    const isSuspending = university.status === "active";
    setConfirmDialog({
      open: true,
      title: isSuspending ? "Suspend University" : "Reactivate University",
      description: isSuspending
        ? `Are you sure you want to suspend "${university.name}"? All users under this university will lose access immediately.`
        : `Are you sure you want to reactivate "${university.name}"? This will restore access for all users.`,
      variant: isSuspending ? "danger" : "default",
      confirmLabel: isSuspending ? "Suspend" : "Reactivate",
      action: async () => {
        try {
          await updateUniversity.mutateAsync({
            id: university.id,
            status: isSuspending ? "suspended" : "active",
          });
          showFeedback(
            "success",
            isSuspending
              ? `"${university.name}" has been suspended. All users have been notified.`
              : `"${university.name}" has been reactivated. Access restored.`
          );
        } catch {
          showFeedback("error", "Failed to update university status.");
        }
      },
    });
  }, [university, updateUniversity, showFeedback]);

  const handleMoveToTrash = useCallback(() => {
    if (!university) return;
    setConfirmDialog({
      open: true,
      title: "Move to trash",
      description: `“${university.name}” will be removed from the active list. You can export or restore it from Trash for 30 days; after that it will be permanently deleted.`,
      variant: "danger",
      confirmLabel: "Move to trash",
      action: async () => {
        try {
          await moveToTrash.mutateAsync(university.id);
          showFeedback(
            "success",
            `"${university.name}" moved to trash. Open Trash from the sidebar to restore or export.`
          );
          router.push("/superadmin/universities");
        } catch {
          showFeedback("error", "Could not move this university to trash.");
        }
      },
    });
  }, [university, moveToTrash, showFeedback, router]);

  if (universityId === "trash") {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Redirecting" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/superadmin/universities"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Universities
        </Link>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !university) {
    return (
      <div className="space-y-6">
        <Link
          href="/superadmin/universities"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Universities
        </Link>
        <ErrorState
          title="Failed to load university"
          message="Could not retrieve university details. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/superadmin/universities"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Universities
        </Link>
        <PageHeader
          icon={Building2}
          title={university.name}
          description={university.shortName}
          actions={
            <div className="flex items-center gap-3">
              {university.invitationVerifiedAt ? (
                <span className="rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
                  Verified
                </span>
              ) : university.previousInvitationVerifiedAt ? (
                <span
                  className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700"
                  title="Admin email changed — needs to be re-verified"
                >
                  Re-verify
                </span>
              ) : (
                <span className="rounded-md border border-danger/40 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-danger">
                  Unverified
                </span>
              )}
              <StatusBadge
                variant={getStatusVariant(university.status)}
                dot
                size="md"
              >
                {university.status}
              </StatusBadge>
              <button
                onClick={handleToggleStatus}
                disabled={updateUniversity.isPending}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                  university.status === "active"
                    ? "border border-danger bg-danger-light text-danger hover:bg-danger hover:text-danger-foreground"
                    : "border border-success bg-success-light text-success hover:bg-success hover:text-white"
                )}
              >
                {university.status === "active" ? "Suspend" : "Reactivate"}
              </button>
            </div>
          }
        />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            feedback.type === "success"
              ? "bg-success-light text-success"
              : "bg-danger-light text-danger"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Users"
          value={formatNumber(university.userCount)}
          icon={Users}
        />
        <StatCard
          label="Students"
          value={formatNumber(university.studentCount)}
          icon={GraduationCap}
        />
        <StatCard
          label="Faculty"
          value={formatNumber(university.facultyCount)}
          icon={BookOpen}
        />
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold">University Information</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs sm:text-sm">
          {university.invitationVerifiedAt ? (
            <>
              <MailCheck className="h-4 w-4 shrink-0 text-success" />
              <span className="text-success">
                Admin email verified · {formatDate(university.invitationVerifiedAt)}
              </span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-amber-900">
                Admin email not verified — send an OTP, then use Verify invitation with the 6-digit code from the admin.
              </span>
            </>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">University code</p>
              <p className="text-sm font-mono font-medium">{university.universityCode || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Domain</p>
              <p className="text-sm font-medium">{university.domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">
                {university.city}, {university.country}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Admin Email</p>
              <p className="text-sm font-medium">{university.adminEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Admin Name</p>
              <p className="text-sm font-medium">{university.adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">
                {formatDate(university.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold">Support Actions</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Administrative actions for this university</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => {
              showFeedback("success", `Password reset email sent to ${university.adminEmail}. The admin will receive a link to set a new password.`);
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Reset Admin Password
          </button>
          {!university.invitationVerifiedAt && (
            <>
              <button
                type="button"
                onClick={async () => {
                  const isResend = !!university.lastInviteOtpSentAt;
                  try {
                    await sendInviteOtp.mutateAsync(university.id);
                    showFeedback(
                      "success",
                      `${isResend ? "Invitation OTP resent" : "Invitation OTP sent"} to ${university.adminEmail} (expires in 10 minutes).`
                    );
                  } catch (e) {
                    showFeedback("error", e instanceof ApiError ? e.message : "Failed to send OTP.");
                  }
                }}
                disabled={sendInviteOtp.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {sendInviteOtp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4" />
                {university.lastInviteOtpSentAt ? "Resend OTP" : "Send OTP"}
              </button>
              {university.lastInviteOtpSentAt && (
                <button
                  type="button"
                  onClick={() => setOtpVerifyOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <KeyRound className="h-4 w-4" />
                  Verify invitation
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleMoveToTrash}
            disabled={moveToTrash.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-light px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/15 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Move to trash
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.action}
      />

      <InviteOtpVerifyDialog
        open={otpVerifyOpen}
        onOpenChange={(o) => setOtpVerifyOpen(o)}
        universityName={university.name}
        adminEmail={university.adminEmail}
        onSubmit={async (otp) => {
          await verifyInviteOtp.mutateAsync({ id: university.id, otp });
          await refetch();
          showFeedback("success", "Invitation email verified.");
        }}
      />
    </div>
  );
}
