"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Clock3,
  Info,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Server,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  useBlockedIps,
  useEmailTemplates,
  useLockedLoginAccounts,
  usePlatformSettings,
  useResetEmailTemplate,
  useSecurityFeatures,
  useSecuritySessions,
  useTestWebhook,
  useUnlockLoginAccount,
  useUnblockIp,
  useUpdateEmailTemplate,
  useUpdatePlatformSettings,
  useUpdateSingleActiveSession,
} from "@/superadmin/lib/hooks/use-super-admin";
import { useAuthStore } from "@/superadmin/lib/stores/auth-store";
import { api, ApiError } from "@/superadmin/lib/api/client";
import { FormField } from "@/superadmin/components/shared/forms/form-field";
import { CustomSelect } from "@/superadmin/components/shared/forms/custom-select";
import { SlideDrawer } from "@/superadmin/components/shared/feedback/slide-drawer";
import { Skeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import type {
  BlockedIpEntry,
  EmailTemplate,
  PlatformSettings,
} from "@/superadmin/lib/api/types/super-admin.types";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
];

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "platform", label: "Platform", icon: Settings },
  { id: "emails", label: "Email Templates", icon: Mail },
];

/* ── Email Template Editor Drawer ──────────────────────────────────────── */

function TemplateEditorDrawer({
  template,
  open,
  onClose,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: {
  template: EmailTemplate | null;
  open: boolean;
  onClose: () => void;
  onSave: (input: { key: string; subject: string; body: string }) => Promise<void>;
  onReset: (key: string) => Promise<void>;
  isSaving: boolean;
  isResetting: boolean;
}) {
  const [subject, setSubject] = useState(() => template?.subject ?? "");
  const [body, setBody] = useState(() => template?.body ?? "");
  const [activeField, setActiveField] = useState<"subject" | "body">("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const token = `{{${variable}}}`;
    if (activeField === "subject") {
      const el = subjectRef.current;
      const start = el?.selectionStart ?? subject.length;
      const end = el?.selectionEnd ?? subject.length;
      setSubject(`${subject.slice(0, start)}${token}${subject.slice(end)}`);
      window.requestAnimationFrame(() => {
        subjectRef.current?.focus();
        subjectRef.current?.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }

    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(`${body.slice(0, start)}${token}${body.slice(end)}`);
    window.requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = async () => {
    if (!template) return;
    await onSave({ key: template.key, subject, body });
    onClose();
  };

  const handleReset = async () => {
    if (!template) return;
    await onReset(template.key);
    onClose();
  };

  return (
    <SlideDrawer open={open} onClose={onClose} title={`Edit: ${template?.label ?? ""}`} description="Customize the email content" width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={handleReset}
            disabled={!template || isSaving || isResetting}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResetting ? "Resetting..." : "Reset"}
          </button>
          <button onClick={onClose} disabled={isSaving || isResetting} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={!template || isSaving || isResetting} className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium">Subject Line</label>
          <input
            ref={subjectRef}
            value={subject}
            onFocus={() => setActiveField("subject")}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-sm font-medium">Email Body</label>
          <p className="mt-0.5 text-xs text-muted-foreground">Use {"{{variable}}"} for dynamic content</p>
          <textarea
            ref={bodyRef}
            value={body}
            onFocus={() => setActiveField("body")}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="mt-2 flex w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Available variables</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(template?.variables ?? []).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="rounded bg-primary-50 px-2 py-0.5 font-mono text-xs text-primary-700 transition-colors hover:bg-primary-100"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlideDrawer>
  );
}

/* ── Profile Tab ──────────────────────────────────────────────────────── */

function ProfileTab() {
  const { user } = useAuthStore();

  // Password change state — Personal Information is read-only.
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      toast.error("Current and new password are required");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setIsChangingPwd(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Password updated");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update password";
      toast.error(msg);
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div id="profile-overview" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white">
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div>
            <p className="text-base font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>

      <div id="personal-information" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Personal Information</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your name and email are managed by the platform and cannot be changed from here.
          Use the Security section below to change your password.
        </p>
        <div className="mt-5 space-y-4">
          <FormField label="Full Name" value={user?.name ?? ""} disabled readOnly />
          <FormField label="Email Address" type="email" value={user?.email ?? ""} disabled readOnly />
        </div>
      </div>

      <div id="profile-security" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Security</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Manage your password</p>
        <div className="mt-5 space-y-4">
          <FormField
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <FormField
              label="Confirm Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleChangePassword}
          disabled={isChangingPwd}
          className="mt-5 flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isChangingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
          Update Password
        </button>
      </div>
    </div>
  );
}

/* ── Platform Tab ─────────────────────────────────────────────────────── */

function PlatformTab({ form, onChange, onSave, isPending, isDirty }: {
  form: PlatformSettings; onChange: (field: keyof PlatformSettings, value: string | number | boolean) => void;
  onSave: () => void; isPending: boolean; isDirty: boolean;
}) {
  const testWebhook = useTestWebhook();

  const handleTestWebhook = async () => {
    const url = form.slackWebhookUrl.trim();
    if (!url) {
      toast.error("Enter a webhook URL first");
      return;
    }
    try {
      const res = await testWebhook.mutateAsync(url);
      toast.success(`Webhook delivered in ${res.data.latencyMs}ms`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Webhook test failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div id="platform-general" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">General</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Basic platform configuration</p>
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Platform Name" value={form.platformName} onChange={(e) => onChange("platformName", e.target.value)} />
            <FormField label="Support Email" type="email" value={form.supportEmail} onChange={(e) => onChange("supportEmail", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium leading-none">Default Timezone</label>
              <div className="mt-2">
                <CustomSelect value={form.defaultTimezone} onChange={(v) => onChange("defaultTimezone", v)} options={TIMEZONE_OPTIONS} className="w-full" />
              </div>
            </div>
            <FormField label="Data Retention (Years)" type="number" value={String(form.dataRetentionYears)} onChange={(e) => onChange("dataRetentionYears", Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div id="platform-limits" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Limits</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Platform capacity constraints</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Max Universities" type="number" value={String(form.maxUniversities)} onChange={(e) => onChange("maxUniversities", Number(e.target.value))} />
          <FormField label="Max Users per University" type="number" value={String(form.maxUsersPerUniversity)} onChange={(e) => onChange("maxUsersPerUniversity", Number(e.target.value))} />
        </div>
      </div>

      <div id="feature-flags" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Feature Flags</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Enable or disable platform features</p>
        <div className="mt-5 divide-y divide-border/30">
          {[
            // Maintenance Mode hidden per admin's request — the flag is
            // still wired end-to-end (backend / store / API). Re-add this
            // entry to surface the toggle again.
            // { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "All users see a maintenance page.", info: "" },
            { key: "allowNewRegistrations" as const, label: "Allow New Registrations", desc: "When disabled, no new accounts can be created.", info: "" },
            {
              key: "emailNotifications" as const,
              label: "Email Notifications",
              desc: "Send emails for account events.",
              info:
                "When OFF, informational emails are skipped — tenant created / suspended / trashed / restored notifications. " +
                "Security-critical emails ALWAYS send regardless of this setting: OTPs, password setup / reset / change, email verification, welcome credentials, and suspension notices.",
            },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="mr-4">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{toggle.label}</p>
                  {toggle.info && (
                    <span
                      tabIndex={0}
                      title={toggle.info}
                      aria-label={toggle.info}
                      className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{toggle.desc}</p>
              </div>
              {/* Toggle updates local form state only. Persists when the
                  user clicks "Save Settings" below — same as the rest of
                  the form. Earlier this auto-saved on flip; reverted per
                  user's request for an explicit-save workflow. */}
              <button onClick={() => onChange(toggle.key, !form[toggle.key])}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form[toggle.key] ? "bg-primary-500" : "bg-muted-foreground/30"}`}>
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form[toggle.key] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div id="integrations" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Integrations</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">External service connections</p>
        <div className="mt-5 space-y-3">
          <FormField label="Slack Webhook URL" placeholder="https://hooks.slack.com/services/..." value={form.slackWebhookUrl} onChange={(e) => onChange("slackWebhookUrl", e.target.value)} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testWebhook.isPending || !form.slackWebhookUrl.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testWebhook.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {testWebhook.isPending ? "Testing..." : "Test Webhook"}
            </button>
            <p className="text-xs text-muted-foreground">
              Sends a small test payload and verifies the endpoint responds successfully.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onSave} disabled={!isDirty || isPending}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50 disabled:hover:translate-y-0">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Save Settings"}
        </button>
        {isDirty && <span className="text-xs font-medium text-warning">Unsaved changes</span>}
      </div>
    </div>
  );
}

/* ── Email Templates Tab ─────────────────────────────────────────────── */

function formatTimestamp(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatTtl(ttlSeconds?: number | null) {
  if (ttlSeconds == null) return null;
  if (ttlSeconds < 60) return `${ttlSeconds}s remaining`;
  if (ttlSeconds < 3600) return `${Math.ceil(ttlSeconds / 60)}m remaining`;
  if (ttlSeconds < 86400) return `${Math.ceil(ttlSeconds / 3600)}h remaining`;
  return `${Math.ceil(ttlSeconds / 86400)}d remaining`;
}

function SecurityTab() {
  const {
    data: security,
    isLoading: isSecurityLoading,
    isError: isSecurityError,
    refetch: refetchSecurity,
  } = useSecurityFeatures();
  const {
    data: blockedIps = [],
    isLoading: isBlockedLoading,
    isError: isBlockedError,
    refetch: refetchBlockedIps,
  } = useBlockedIps(100);
  const {
    data: sessionSummary,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useSecuritySessions();
  const {
    data: lockedAccounts = [],
    isLoading: isLockedAccountsLoading,
    refetch: refetchLockedAccounts,
  } = useLockedLoginAccounts();
  const updateSingleSession = useUpdateSingleActiveSession();
  const unblockIp = useUnblockIp();
  const unlockAccount = useUnlockLoginAccount();

  const redisOperational =
    security?.redisAvailable ?? security?.redisConfigured ?? false;
  const redisStatusLabel =
    security?.redisStatus === "connected"
      ? "Connected"
      : security?.redisStatus === "unreachable"
        ? "Unreachable"
        : security?.redisConfigured
          ? "Checking"
          : "Not configured";
  const singleActiveEnabled =
    sessionSummary?.singleActiveSessionEnabled ??
    security?.singleActiveSessionEnabled ??
    false;
  const currentSessionId = sessionSummary?.currentSessionId ?? null;
  const activeSessionCount =
    sessionSummary?.activeSessionCount ??
    sessionSummary?.sessions.filter((session) => !session.revokedAt).length ??
    0;
  const otherActiveSessionCount =
    sessionSummary?.otherActiveSessionCount ??
    sessionSummary?.sessions.filter(
      (session) => !session.revokedAt && session.sessionId !== currentSessionId
    ).length ??
    0;
  const hasOtherActiveSessions = otherActiveSessionCount > 0;

  const handleRefresh = async () => {
    await Promise.all([
      refetchSecurity(),
      refetchBlockedIps(),
      refetchSessions(),
      refetchLockedAccounts(),
    ]);
  };

  const handleSingleSessionToggle = async () => {
    const nextEnabled = !singleActiveEnabled;
    if (nextEnabled && hasOtherActiveSessions) {
      const ok = window.confirm(
        `${otherActiveSessionCount} other active session${otherActiveSessionCount === 1 ? "" : "s"} will stay active until the next login replaces older sessions. Continue?`
      );
      if (!ok) return;
    }

    try {
      const res = await updateSingleSession.mutateAsync({
        enabled: nextEnabled,
        expectedValue: singleActiveEnabled,
      });
      toast.success(
        res.data.singleActiveSessionEnabled
          ? "Single Session enabled"
          : "Single Session disabled"
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === "SINGLE_SESSION_SETTING_CHANGED") {
        toast.warning("Single Session changed in another active session. Refreshing the latest value.");
        await Promise.all([refetchSecurity(), refetchSessions()]);
        return;
      }
      const message = err instanceof ApiError ? err.message : "Failed to update Single Session";
      toast.error(message);
    }
  };

  const handleUnblockIp = async (entry: BlockedIpEntry) => {
    if (entry.source === "config") {
      toast.error("Config-managed IP blocks must be removed from backend environment settings");
      return;
    }

    if (!window.confirm(`Unblock ${entry.ip}?`)) return;

    try {
      const res = await unblockIp.mutateAsync(entry.ip);
      toast.success(
        res.data.removed ? `Unblocked ${entry.ip}` : `${entry.ip} was not blocked anymore`
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to unblock IP";
      toast.error(message);
    }
  };

  const handleUnlockAccount = async (email: string) => {
    try {
      const res = await unlockAccount.mutateAsync(email);
      toast.success(`Unlocked ${res.data.email}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to unlock account";
      toast.error(message);
    }
  };

  if (isSecurityError && isBlockedError) {
    return (
      <ErrorState
        title="Failed to load security settings"
        message="The blocked IP list and rate-limit status could not be retrieved."
        onRetry={() => {
          void handleRefresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div id="request-security" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <div>
          <h3 className="text-sm font-semibold">Request Security</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Review Redis-backed rate limiting, sessions, and blocked IPs for the API.
          </p>
        </div>
        <button
          onClick={() => {
            void handleRefresh();
          }}
          disabled={isSecurityLoading || isBlockedLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              (isSecurityLoading || isBlockedLoading) && "animate-spin"
            )}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg bg-card p-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Redis</p>
              <p className="text-xs text-muted-foreground">Required for live counters and dynamic blocks</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold">
            {redisStatusLabel}
          </p>
        </div>

        <div className="rounded-lg bg-card p-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Rate Limiting</p>
              <p className="text-xs text-muted-foreground">Route caps per IP and signed-in user</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold">
            {security?.rateLimitEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>

        <div className="rounded-lg bg-card p-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Proxy Headers</p>
              <p className="text-xs text-muted-foreground">Use forwarded headers to detect client IPs</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold">
            {security?.trustProxyHeaders ? "Trusted" : "Direct socket only"}
          </p>
        </div>

        <div className="rounded-lg bg-card p-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Single Session</p>
              <p className="text-xs text-muted-foreground">New logins revoke older sessions when enabled</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-lg font-semibold">
              {singleActiveEnabled ? "Enabled" : "Disabled"}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={singleActiveEnabled}
              aria-label="Toggle Single Session"
              title={singleActiveEnabled ? "Disable Single Session" : "Enable Single Session"}
              onClick={() => {
                void handleSingleSessionToggle();
              }}
              disabled={isSecurityLoading || isSessionsLoading || updateSingleSession.isPending}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-60",
                singleActiveEnabled ? "bg-primary-500" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
                  singleActiveEnabled ? "translate-x-5" : "translate-x-0"
                )}
              >
                {updateSingleSession.isPending && (
                  <Loader2 className="h-3 w-3 animate-spin text-primary-600" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-card p-5 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Brute Force</p>
              <p className="text-xs text-muted-foreground">Login lock after failed attempts</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold">
            {security ? `${security.bruteForceMaxAttempts} tries` : "Loading"}
          </p>
        </div>
      </div>

      {!redisOperational && !isSecurityLoading && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          {security?.redisConfigured
            ? "Redis is configured but unreachable, so dynamic IP blocking and rate limiting are failing open until the backend can connect."
            : "Redis is not configured, so dynamic IP blocking and rate limiting will stay inactive until `REDIS_URL` is set on the backend."}
        </div>
      )}

      <div id="device-sessions" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Device Tracking & Sessions</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Single-session mode revokes older logins. Multi-session mode lets every active browser keep working.
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
            {singleActiveEnabled ? "Single session" : `${activeSessionCount} active`}
          </span>
        </div>

        {hasOtherActiveSessions && (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
            {otherActiveSessionCount} other active session{otherActiveSessionCount === 1 ? "" : "s"} detected. If another settings tab changes Single Session first, this page will refresh before saving over it.
          </div>
        )}

        <div className="mt-5 space-y-3">
          {isSessionsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          )}

          {!isSessionsLoading && sessionSummary?.sessions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/50 p-5 text-sm text-muted-foreground">
              No tracked sessions have been recorded yet.
            </div>
          )}

          {!isSessionsLoading &&
            sessionSummary?.sessions.map((session) => {
              const isCurrent = session.sessionId === sessionSummary.currentSessionId;
              return (
                <div
                  key={session.sessionId}
                  className="flex flex-col gap-3 rounded-lg border border-border/40 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Laptop className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{session.deviceLabel}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          isCurrent && !session.revokedAt
                            ? "bg-success-light text-success"
                            : session.revokedAt
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary-50 text-primary-700"
                        )}
                      >
                        {isCurrent && !session.revokedAt
                          ? "Current"
                          : session.revokedAt
                            ? "Revoked"
                            : "Active"}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <p>IP: {session.ipAddress}</p>
                      <p>Started: {formatTimestamp(session.createdAt)}</p>
                      <p>Last seen: {formatTimestamp(session.lastSeenAt)}</p>
                      <p>Reason: {session.revokedReason || "Active"}</p>
                    </div>
                  </div>
                  <p className="max-w-md truncate text-xs text-muted-foreground" title={session.userAgent}>
                    {session.userAgent || "No user agent recorded"}
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      <div id="rate-limit-rules" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Rate-Limit Rules</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                These rules come directly from the backend middleware configuration.
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {security?.rules.length ?? 0} active
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {isSecurityLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-lg" />
                ))}
              </div>
            )}

            {!isSecurityLoading && security?.rules.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                No rate-limit rules are active right now.
              </div>
            )}

            {!isSecurityLoading &&
              security?.rules.map((rule) => (
                <div
                  key={rule.name}
                  className="rounded-lg border border-border/40 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{rule.description}</p>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      {rule.limit} / {rule.windowSeconds}s
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-background px-2 py-0.5">
                      {rule.identity === "user" ? "Per user" : "Per IP"}
                    </span>
                    <span className="rounded bg-background px-2 py-0.5 font-mono">
                      {rule.methods.join(", ")}
                    </span>
                    <span className="rounded bg-background px-2 py-0.5 font-mono">
                      {rule.path}
                    </span>
                    <span className="rounded bg-background px-2 py-0.5">
                      {rule.scope === "prefix" ? "Prefix match" : "Exact path"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
      </div>

      <div id="login-brute-force" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Login Brute-Force Protection</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Accounts are temporarily locked after repeated failed login attempts.
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
            {security
              ? `${security.bruteForceMaxAttempts} attempts / ${security.bruteForceLockMinutes}m lock`
              : "Loading"}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {isLockedAccountsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          )}

          {!isLockedAccountsLoading && lockedAccounts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/50 p-5 text-sm text-muted-foreground">
              No accounts currently have failed-attempt counters or active lockouts.
            </div>
          )}

          {!isLockedAccountsLoading &&
            lockedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-4 rounded-lg border border-border/40 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{account.email}</p>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      {account.loginLockedUntil ? "Locked" : "Watching"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <p>Name: {account.name}</p>
                    <p>Failed attempts: {account.failedLoginAttempts}</p>
                    <p>Locked until: {formatTimestamp(account.loginLockedUntil)}</p>
                    <p>Last IP: {account.lastFailedLoginIp || "Not recorded"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleUnlockAccount(account.email);
                  }}
                  disabled={unlockAccount.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unlockAccount.isPending ? "Unlocking..." : "Unlock"}
                </button>
              </div>
            ))}
        </div>
      </div>

      <div id="blocked-ips" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Blocked IPs</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dynamic entries come from Redis. Config entries come from backend environment variables.
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {blockedIps.length} listed
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {isBlockedLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          )}

          {!isBlockedLoading && blockedIps.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/50 p-5 text-sm text-muted-foreground">
              No blocked IP entries were found.
            </div>
          )}

          {!isBlockedLoading &&
            blockedIps.map((entry) => (
              <div
                key={`${entry.source}-${entry.ip}`}
                className="flex flex-col gap-4 rounded-lg border border-border/40 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-medium text-foreground">{entry.ip}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        entry.source === "redis"
                          ? "bg-primary-50 text-primary-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {entry.source === "redis" ? "Dynamic" : "Config"}
                    </span>
                    {formatTtl(entry.ttlSeconds) && (
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                        {formatTtl(entry.ttlSeconds)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                    <p>Reason: {entry.reason || "No reason recorded"}</p>
                    <p>Blocked by: {entry.blockedBy || "Unknown"}</p>
                    <p>Created: {formatTimestamp(entry.blockedAt)}</p>
                    <p>Expires: {entry.expiresAt ? formatTimestamp(entry.expiresAt) : "No expiry"}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    void handleUnblockIp(entry);
                  }}
                  disabled={entry.source !== "redis" || unblockIp.isPending}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    entry.source === "redis"
                      ? "bg-danger/10 text-danger hover:bg-danger/15"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {unblockIp.isPending && entry.source === "redis"
                    ? "Working..."
                    : entry.source === "redis"
                      ? "Unblock"
                      : "Config-managed"}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function EmailTemplatesTab() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const {
    data: templates = [],
    isLoading,
    isError,
    refetch,
  } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const resetTemplate = useResetEmailTemplate();

  const handleSaveTemplate = async (input: { key: string; subject: string; body: string }) => {
    try {
      await updateTemplate.mutateAsync(input);
      toast.success("Template saved");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save template";
      toast.error(message);
      throw err;
    }
  };

  const handleResetTemplate = async (key: string) => {
    try {
      await resetTemplate.mutateAsync(key);
      toast.success("Template reset");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to reset template";
      toast.error(message);
      throw err;
    }
  };

  return (
    <div className="">
      <div id="email-templates" className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Email Templates</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Customize emails sent during onboarding and status changes</p>
        <div className="mt-5 divide-y divide-border/30">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="py-4 first:pt-0 last:pb-0">
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ))}

          {isError && (
            <div className="py-4">
              <ErrorState
                title="Failed to load templates"
                message="Could not retrieve email templates."
                onRetry={() => {
                  void refetch();
                }}
              />
            </div>
          )}

          {!isLoading && !isError && templates.map((tpl) => (
            <div key={tpl.key} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
              <div className="mr-4 min-w-0 flex-1">
                <p className="text-sm font-medium">{tpl.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{tpl.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">Subject: <span className="font-mono font-medium text-foreground">{tpl.subject}</span></p>
              </div>
              <button onClick={() => { setEditingTemplate(tpl); setEditorOpen(true); }}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 hover:text-primary-700">Edit</button>
            </div>
          ))}
        </div>
      </div>
      <TemplateEditorDrawer
        key={editingTemplate?.key ?? "closed"}
        template={editingTemplate}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingTemplate(null); }}
        onSave={handleSaveTemplate}
        onReset={handleResetTemplate}
        isSaving={updateTemplate.isPending}
        isResetting={resetTemplate.isPending}
      />
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

function SettingsSkeleton() {
  return (
    <div className="px-8 pt-6 lg:px-10">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-5 w-64" />
      <div className="mt-10 max-w-3xl space-y-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
      </div>
    </div>
  );
}

export default function PlatformSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedTab = searchParams.get("tab") ?? "platform";
  const tabParam = requestedTab === "security" ? "platform" : requestedTab;
  const [activeTab, setActiveTab] = useState(tabParam);

  const { data, isLoading, isError, refetch } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);
  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);
  useEffect(() => {
    if (isLoading || !form) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeTab, form, isLoading]);

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
    router.push(`/superadmin/settings?tab=${tab}`);
  }, [router]);

  if (isLoading) return <SettingsSkeleton />;
  if (isError || !data) return <div className="p-10"><ErrorState title="Failed to load settings" message="Could not retrieve platform settings." onRetry={() => refetch()} /></div>;
  if (!form) return null;

  const handleChange = (field: keyof PlatformSettings, value: string | number | boolean) => {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!form) return;
    try { await updateSettings.mutateAsync(form); setIsDirty(false); toast.success("Settings saved"); } catch { toast.error("Failed to save settings"); }
  };

  return (
    <div>
      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]" style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }} />

      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile and platform configuration</p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-card text-primary-700 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30"
                    : "text-muted-foreground hover:text-foreground",
                )}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="mt-8 pb-10">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "platform" && <PlatformTab form={form} onChange={handleChange} onSave={handleSave} isPending={updateSettings.isPending} isDirty={isDirty} />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "emails" && <EmailTemplatesTab />}
        </div>
      </div>
    </div>
  );
}
