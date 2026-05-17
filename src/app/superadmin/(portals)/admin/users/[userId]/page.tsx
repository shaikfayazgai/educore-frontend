"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import {
  UserCog,
  ArrowLeft,
  Loader2,
  Mail,
  Building,
  Calendar,
  Clock,
  Hash,
} from "lucide-react";
import { useAdminUserDetail, useUpdateUser } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/superadmin/components/shared/feedback/confirm-dialog";
import { formatDate, formatRelative } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "research", label: "Research" },
  { value: "placement", label: "Placement" },
  { value: "ministry", label: "Ministry" },
] as const;

const STATUSES = ["active", "inactive", "suspended"] as const;

function getStatusVariant(
  status: "active" | "inactive" | "suspended"
): "success" | "muted" | "danger" {
  const map = {
    active: "success" as const,
    inactive: "muted" as const,
    suspended: "danger" as const,
  };
  return map[status];
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data: user, isLoading, isError, refetch } = useAdminUserDetail(userId);
  const updateUser = useUpdateUser();

  const [roleChanging, setRoleChanging] = useState(false);
  const [deptEditing, setDeptEditing] = useState(false);
  const [deptValue, setDeptValue] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "danger";
    action: () => Promise<void>;
  }>({ open: false, title: "", description: "", variant: "default", action: async () => {} });

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

  const handleRoleChange = useCallback(
    (newRole: string) => {
      if (!user || newRole === user.role) return;
      const newRoleLabel = ROLES.find((r) => r.value === newRole)?.label ?? newRole;
      const currentRoleLabel = ROLES.find((r) => r.value === user.role)?.label ?? user.role;
      setConfirmDialog({
        open: true,
        title: "Confirm Role Change",
        description: `You are about to change ${user.name}'s role from ${currentRoleLabel} to ${newRoleLabel}. This will change their system access. Continue?`,
        variant: "default",
        action: async () => {
          setRoleChanging(true);
          try {
            await updateUser.mutateAsync({
              id: user.id,
              role: newRole as typeof user.role,
            });
            showFeedback("success", `Role updated to ${newRoleLabel}. Changes saved. This action has been logged in the Audit Trail.`);
          } catch {
            showFeedback("error", "Failed to update role");
          } finally {
            setRoleChanging(false);
          }
        },
      });
    },
    [user, updateUser, showFeedback]
  );

  const handleStatusChange = useCallback(
    (newStatus: "active" | "inactive" | "suspended") => {
      if (!user) return;
      setConfirmDialog({
        open: true,
        title: `Change Status to ${newStatus}`,
        description: `Are you sure you want to set ${user.name}'s status to "${newStatus}"? This will take effect immediately.`,
        variant: newStatus === "suspended" ? "danger" : "default",
        action: async () => {
          try {
            await updateUser.mutateAsync({ id: user.id, status: newStatus });
            showFeedback("success", `Status changed to ${newStatus}. Changes saved. This action has been logged in the Audit Trail.`);
          } catch {
            showFeedback("error", "Failed to update status");
          }
        },
      });
    },
    [user, updateUser, showFeedback]
  );

  const handleDeptSave = useCallback(async () => {
    if (!user || !deptValue.trim()) return;
    try {
      await updateUser.mutateAsync({ id: user.id, department: deptValue.trim() });
      showFeedback("success", "Department updated. Changes saved. This action has been logged in the Audit Trail.");
      setDeptEditing(false);
    } catch {
      showFeedback("error", "Failed to update department");
    }
  }, [user, deptValue, updateUser, showFeedback]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Users
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

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Users
        </Link>
        <ErrorState
          title="Failed to load user"
          message="Could not retrieve user details. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Users
        </Link>
        <PageHeader icon={UserCog} title={user.name} description={user.email} />
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

      {/* User Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold">Profile Information</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{user.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="text-sm font-medium">
                  {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tenant ID</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {user.tenantId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Role Card */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Status & Role</h3>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge variant={getStatusVariant(user.status)} dot size="md">
                {user.status}
              </StatusBadge>
              <StatusBadge variant="default" size="md">
                {user.role}
              </StatusBadge>
            </div>
          </div>

          {/* Change Role */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Change Role</h3>
            <div className="relative mt-3">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={roleChanging || updateUser.isPending}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {roleChanging && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Change Status */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Change Status</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={user.status === s || updateUser.isPending}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                    user.status === s
                      ? "border-portal-accent bg-portal-accent-light text-portal-accent"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-danger">Note:</span> Suspending this user will immediately revoke their access.
            </p>
          </div>

          {/* Change Department */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Change Department</h3>
            {deptEditing ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={deptValue}
                  onChange={(e) => setDeptValue(e.target.value)}
                  className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                  placeholder="Enter new department"
                />
                <button
                  onClick={handleDeptSave}
                  disabled={!deptValue.trim() || updateUser.isPending}
                  className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                >
                  {updateUser.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => setDeptEditing(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm">{user.department}</p>
                <button
                  onClick={() => {
                    setDeptValue(user.department);
                    setDeptEditing(true);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
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
        confirmLabel="Confirm"
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
