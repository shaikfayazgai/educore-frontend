"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCog,
  ArrowLeft,
  Loader2,
  Mail,
  Building,
  Calendar,
  Clock,
  Hash,
  IdCard,
  GraduationCap,
  MoreVertical,
  Pencil,
  ShieldBan,
  ShieldCheck,
  MailPlus,
  Trash2,
  KeyRound,
  Phone,
  BookOpen,
  Layers,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import {
  useAdminUserDetail,
  useUpdateUser,
  useSendOnboardingEmails,
} from "@/admin/lib/hooks/use-admin";
import { ApiError } from "@/admin/lib/api/client";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { formatDate, formatRelative } from "@/admin/lib/utils/format";
import { cn } from "@/admin/lib/utils/cn";
import type { AdminUser } from "@/admin/lib/api/types/admin.types";
import type { PortalRole } from "@/admin/lib/api/types/common.types";

const ROLES: { value: PortalRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "placement", label: "Placement" },
];

function getStatusVariant(status: AdminUser["status"]): "success" | "muted" | "danger" {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  return "muted";
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();

  const { data: user, isLoading, isError, refetch } = useAdminUserDetail(userId);
  const updateUser = useUpdateUser();
  const sendOnboarding = useSendOnboardingEmails();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "danger";
    confirmLabel: string;
    action: () => Promise<void>;
  }>({ open: false, title: "", description: "", variant: "default", confirmLabel: "Confirm", action: async () => {} });

  const handleToggleStatus = useCallback(() => {
    if (!user) return;
    const isSuspending = user.status === "active";
    setConfirmDialog({
      open: true,
      title: isSuspending ? "Suspend User" : "Activate User",
      description: isSuspending
        ? `Suspend "${user.name}"? They will lose access immediately and won't be able to sign in.`
        : `Activate "${user.name}"? They will regain access right away.`,
      variant: isSuspending ? "danger" : "default",
      confirmLabel: isSuspending ? "Suspend" : "Activate",
      action: async () => {
        try {
          await updateUser.mutateAsync({
            id: user.id,
            status: isSuspending ? "suspended" : "active",
          });
          toast.success(isSuspending ? `${user.name} suspended` : `${user.name} activated`);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Failed to update status");
        }
      },
    });
  }, [user, updateUser]);

  const handleResendOnboarding = useCallback(() => {
    if (!user) return;
    setConfirmDialog({
      open: true,
      title: user.welcomedAt ? "Re-send onboarding email" : "Send onboarding email",
      description: `A fresh temporary password will be generated for "${user.name}" and emailed to ${user.email}. They'll be required to change it on first sign-in.`,
      variant: "default",
      confirmLabel: user.welcomedAt ? "Re-send" : "Send",
      action: async () => {
        try {
          const res = await sendOnboarding.mutateAsync({ userIds: [user.id], forceReset: true });
          const r = res.data;
          if (r.sentCount > 0) {
            toast.success(`Onboarding email sent to ${user.email}`);
          } else {
            toast.error(`Could not send onboarding email${r.failedCount > 0 ? ` (${r.failedCount} failed)` : ""}`);
          }
          refetch();
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Failed to send onboarding email");
        }
      },
    });
  }, [user, sendOnboarding, refetch]);

  const handleDelete = useCallback(() => {
    if (!user) return;
    setConfirmDialog({
      open: true,
      title: "Delete user",
      description: `Permanently remove "${user.name}" from this institution? This cannot be undone — their account will be deleted and they will lose all access.`,
      variant: "danger",
      confirmLabel: "Delete",
      action: async () => {
        try {
          // Soft-delete via status change to "inactive" — preserves audit trail.
          // (No hard-delete API exists; the platform admin handles that.)
          await updateUser.mutateAsync({ id: user.id, status: "inactive" });
          toast.success(`${user.name} deactivated`);
          router.push("/admin/users");
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Failed to delete user");
        }
      },
    });
  }, [user, updateUser, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
        </Link>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
        </Link>
        <ErrorState title="Failed to load user" message="Could not retrieve user details. Please try again." onRetry={() => refetch()} />
      </div>
    );
  }

  // Unified ID No. — single label/field for every role.
  const idLabel = "ID No.";
  const idValue = user.idNo || user.studentId || user.employeeId || user.id.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Users
        </Link>
        <PageHeader
          icon={UserCog}
          title={user.name}
          description={user.email}
          actions={
            <div className="flex items-center gap-3">
              <StatusBadge variant={getStatusVariant(user.status)} dot size="md">
                {user.status}
              </StatusBadge>
              <StatusBadge variant="default" size="md">{user.role}</StatusBadge>
              {/* 3-dots ActionMenu removed at admin's request — the row's
                  3-dots on the Users list already exposes the same Edit /
                  Resend / Delete options, so the header menu here was a
                  duplicate. */}
            </div>
          }
        />
      </div>

      {/* Profile + identifiers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold">Profile Information</h3>
          <div className="mt-4 space-y-4">
            <InfoRow Icon={Mail} label="Email" value={user.email} />
            <InfoRow Icon={IdCard} label={idLabel} value={idValue} mono />
            <InfoRow Icon={Building} label="Department" value={user.department || "—"} />
            {user.phone && <InfoRow Icon={Phone} label="Phone" value={user.phone} />}
            {user.role === "student" && user.program && (
              <InfoRow Icon={GraduationCap} label="Program" value={user.program} />
            )}
            {user.role === "student" && user.currentSemester && (
              <InfoRow Icon={Layers} label="Current Semester" value={String(user.currentSemester)} />
            )}
            {user.role === "faculty" && user.designation && (
              <InfoRow Icon={GraduationCap} label="Designation" value={user.designation} />
            )}
            {user.role === "faculty" && user.specialization && (
              <InfoRow Icon={BookOpen} label="Specialization" value={user.specialization} />
            )}
            <InfoRow Icon={Calendar} label="Created" value={formatDate(user.createdAt)} />
            <InfoRow Icon={Clock} label="Last Login" value={user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"} />
            <InfoRow Icon={Hash} label="Tenant ID" value={user.tenantId} mono />
          </div>
        </div>

        {/* Onboarding & access summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold">Onboarding</h3>
            <div className="mt-3 flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                user.welcomedAt
                  ? "bg-success-50 text-success-700 ring-success-200 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/30"
                  : "bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/30",
              )}>
                {user.welcomedAt ? "Onboarded" : "Pending onboarding"}
              </span>
              {user.welcomedAt && (
                <span className="text-xs text-muted-foreground">{formatRelative(user.welcomedAt)}</span>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {user.welcomedAt
                ? "This user has received their credential email. Use Re-send onboarding from the menu to issue a fresh temp password."
                : "This user hasn't been emailed credentials yet. Use Send onboarding email from the menu to dispatch a temp password and login link."}
            </p>
          </div>

          {/* Quick actions card removed at admin's request — these
              actions are already reachable via the row 3-dots menu on
              the Users list page. */}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((p) => ({ ...p, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.action}
      />

      <EditUserDialog user={editOpen ? user : null} onClose={() => setEditOpen(false)} />
    </div>
  );
}

/* ── 3-dots action menu in the header (matches super-admin universities pattern) ── */
function ActionMenu({
  user,
  onEdit,
  onToggleStatus,
  onResendOnboarding,
  onDelete,
}: {
  user: AdminUser;
  onEdit: () => void;
  onToggleStatus: () => void;
  onResendOnboarding: () => void;
  onDelete: () => void;
}) {
  const isActive = user.status === "active";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="More actions"
          className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-56 rounded-lg border border-border/60 bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit profile
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onResendOnboarding} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            {user.welcomedAt ? "Re-send onboarding" : "Send onboarding"}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />

          <DropdownMenu.Item
            onSelect={onToggleStatus}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isActive ? "text-danger" : "text-success",
            )}
          >
            {isActive ? <ShieldBan className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {isActive ? "Suspend user" : "Activate user"}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />

          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-danger/10 focus:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" /> Delete user
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Profile info row helper ── */
function InfoRow({
  Icon, label, value, mono = false,
}: {
  Icon: typeof Mail;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("truncate text-sm font-medium", mono && "font-mono text-xs")}>{value}</p>
      </div>
    </div>
  );
}

/* ── Inline edit dialog (lightweight; mirrors the list-page modal) ── */
function EditUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const [form, setForm] = useState({
    name: user?.name || "",
    role: (user?.role || "student") as PortalRole,
    department: user?.department || "",
    phone: user?.phone || "",
    // Unified ID No. — hydrated from idNo first, falling back to legacy aliases.
    idNo: user?.idNo || user?.studentId || user?.employeeId || "",
    program: user?.program || "",
    designation: user?.designation || "",
    specialization: user?.specialization || "",
  });
  const [error, setError] = useState("");

  const onSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.department.trim()) { setError("Department is required."); return; }
    try {
      await updateUser.mutateAsync({
        id: user.id,
        name: form.name.trim(),
        role: form.role,
        department: form.department.trim(),
        phone: form.phone.trim() || undefined,
        idNo: (form.role === "student" || form.role === "faculty")
          ? form.idNo.trim()
          : undefined,
        program: form.role === "student" ? form.program.trim() || undefined : undefined,
        designation: form.role === "faculty" ? form.designation.trim() || undefined : undefined,
      });
      toast.success(`${form.name} updated`);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update user.");
    }
  };

  if (!user) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mt-[8vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[85vh]">
        <h2 className="text-lg font-semibold">Edit User</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update <span className="font-medium text-foreground">{user.email}</span>. Email cannot be changed here.</p>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Full Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
            </FieldLabel>
            <FieldLabel label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as PortalRole })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent">
                {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FieldLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Department">
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
            </FieldLabel>
            <FieldLabel label="Phone (optional)">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
            </FieldLabel>
          </div>

          {form.role === "student" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <FieldLabel label="ID No.">
                <input value={form.idNo} onChange={(e) => setForm({ ...form, idNo: e.target.value })} placeholder="e.g. STU-2024-001" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
              </FieldLabel>
              <FieldLabel label="Program">
                <input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
              </FieldLabel>
            </div>
          )}

          {form.role === "faculty" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <FieldLabel label="ID No.">
                <input value={form.idNo} onChange={(e) => setForm({ ...form, idNo: e.target.value })} placeholder="e.g. FAC-2024-001" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
              </FieldLabel>
              <FieldLabel label="Designation">
                <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent" />
              </FieldLabel>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} disabled={updateUser.isPending} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Cancel</button>
            <button onClick={onSave} disabled={updateUser.isPending} className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground hover:bg-portal-accent-hover disabled:opacity-50">
              {updateUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}
