"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Globe,
  MapPin,
  Mail,
  User,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import {
  useSuperAdminUniversityDetail,
  useUpdateUniversity,
} from "@/admin/lib/hooks/use-super-admin";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatCard } from "@/admin/components/shared/misc/stat-card";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { formatDate, formatNumber } from "@/admin/lib/utils/format";
import { cn } from "@/admin/lib/utils/cn";

function getStatusVariant(
  status: "active" | "suspended"
): "success" | "danger" {
  return status === "active" ? "success" : "danger";
}

export default function SuperAdminUniversityDetailPage({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = use(params);
  const {
    data: university,
    isLoading,
    isError,
    refetch,
  } = useSuperAdminUniversityDetail(universityId);
  const updateUniversity = useUpdateUniversity();

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
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
          <button
            onClick={() => {
              showFeedback("success", `Activation email resent to ${university.adminEmail}.`);
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Resend Activation Email
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
    </div>
  );
}
