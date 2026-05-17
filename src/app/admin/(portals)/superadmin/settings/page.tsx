"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, User, Settings, Mail } from "lucide-react";
import { toast } from "sonner";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/admin/lib/hooks/use-super-admin";
import { useAuthStore } from "@/admin/lib/stores/auth-store";
import { FormField } from "@/admin/components/shared/forms/form-field";
import { CustomSelect } from "@/admin/components/shared/forms/custom-select";
import { SlideDrawer } from "@/admin/components/shared/feedback/slide-drawer";
import { Skeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { cn } from "@/admin/lib/utils/cn";
import type { PlatformSettings } from "@/admin/lib/api/types/super-admin.types";

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

const EMAIL_TEMPLATES = [
  { id: "welcome", label: "Welcome / Onboarding", desc: "Sent when a new tenant is created.", subject: "Welcome to Glimmora — Your admin account is ready", body: "Dear {{admin_name}},\n\nWelcome to Glimmora! Your university account has been created.\n\nLogin URL: {{login_url}}\nEmail: {{admin_email}}\nTemporary Password: {{temp_password}}\n\nPlease change your password on first login.\n\nBest regards,\nGlimmora Team" },
  { id: "password_reset", label: "Password Reset", desc: "Sent when a password reset is requested.", subject: "Reset your Glimmora password", body: "Dear {{admin_name}},\n\nWe received a request to reset your password.\n\nClick the link below to set a new password:\n{{reset_url}}\n\nThis link expires in 24 hours.\n\nBest regards,\nGlimmora Team" },
  { id: "suspension", label: "Account Suspension", desc: "Sent when a tenant is suspended.", subject: "Your Glimmora account has been suspended", body: "Dear {{admin_name}},\n\nYour university account ({{university_name}}) has been suspended by the platform administrator.\n\nAll users under your institution will lose access until the account is reactivated.\n\nIf you believe this is an error, please contact support.\n\nBest regards,\nGlimmora Team" },
  { id: "reactivation", label: "Account Reactivation", desc: "Sent when a tenant is reactivated.", subject: "Your Glimmora account has been reactivated", body: "Dear {{admin_name}},\n\nGreat news! Your university account ({{university_name}}) has been reactivated.\n\nAll users can now access the platform as usual.\n\nBest regards,\nGlimmora Team" },
];

/* ── Email Template Editor Drawer ──────────────────────────────────────── */

function TemplateEditorDrawer({ template, open, onClose }: {
  template: typeof EMAIL_TEMPLATES[0] | null; open: boolean; onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (template) { setSubject(template.subject); setBody(template.body); }
  }, [template]);

  const handleSave = () => {
    toast.success(`${template?.label} template saved`);
    onClose();
  };

  return (
    <SlideDrawer open={open} onClose={onClose} title={`Edit: ${template?.label ?? ""}`} description="Customize the email content" width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600">Save Template</button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium">Subject Line</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            className="mt-2 flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <label className="text-sm font-medium">Email Body</label>
          <p className="mt-0.5 text-xs text-muted-foreground">Use {"{{variable}}"} for dynamic content</p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
            className="mt-2 flex w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Available variables</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["admin_name", "admin_email", "university_name", "login_url", "temp_password", "reset_url"].map((v) => (
              <span key={v} className="rounded bg-primary-50 px-2 py-0.5 font-mono text-xs text-primary-700">{`{{${v}}}`}</span>
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
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isDirty, setIsDirty] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
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

      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Personal Information</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Update your name and email address</p>
        <div className="mt-5 space-y-4">
          <FormField label="Full Name" value={name} onChange={(e) => { setName(e.target.value); setIsDirty(true); }} />
          <FormField label="Email Address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setIsDirty(true); }} />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button disabled={!isDirty} onClick={() => { setIsDirty(false); toast.success("Profile updated"); }}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50 disabled:hover:translate-y-0">
            Save Profile
          </button>
          {isDirty && <span className="text-xs font-medium text-warning">Unsaved changes</span>}
        </div>
      </div>

      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Security</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Manage your password</p>
        <div className="mt-5 space-y-4">
          <FormField label="Current Password" type="password" placeholder="Enter current password" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="New Password" type="password" placeholder="Enter new password" />
            <FormField label="Confirm Password" type="password" placeholder="Confirm new password" />
          </div>
        </div>
        <button onClick={() => toast.success("Password updated")}
          className="mt-5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600">
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
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
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

      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Limits</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Platform capacity constraints</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Max Universities" type="number" value={String(form.maxUniversities)} onChange={(e) => onChange("maxUniversities", Number(e.target.value))} />
          <FormField label="Max Users per University" type="number" value={String(form.maxUsersPerUniversity)} onChange={(e) => onChange("maxUsersPerUniversity", Number(e.target.value))} />
        </div>
      </div>

      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Feature Flags</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Enable or disable platform features</p>
        <div className="mt-5 divide-y divide-border/30">
          {[
            { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "All users see a maintenance page." },
            { key: "allowNewRegistrations" as const, label: "Allow New Registrations", desc: "When disabled, no new accounts can be created." },
            { key: "emailNotifications" as const, label: "Email Notifications", desc: "Send emails for account events." },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="mr-4">
                <p className="text-sm font-medium">{toggle.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{toggle.desc}</p>
              </div>
              <button onClick={() => onChange(toggle.key, !form[toggle.key])}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form[toggle.key] ? "bg-primary-500" : "bg-muted-foreground/30"}`}>
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form[toggle.key] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Integrations</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">External service connections</p>
        <div className="mt-5">
          <FormField label="Slack Webhook URL" placeholder="https://hooks.slack.com/services/..." value={form.slackWebhookUrl} onChange={(e) => onChange("slackWebhookUrl", e.target.value)} />
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

function EmailTemplatesTab() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<typeof EMAIL_TEMPLATES[0] | null>(null);

  return (
    <div className="">
      <div className="rounded-lg bg-card p-6 shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
        <h3 className="text-sm font-semibold">Email Templates</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Customize emails sent during onboarding and status changes</p>
        <div className="mt-5 divide-y divide-border/30">
          {EMAIL_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
              <div className="mr-4 min-w-0 flex-1">
                <p className="text-sm font-medium">{tpl.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{tpl.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">Subject: <span className="font-mono font-medium text-foreground">{tpl.subject}</span></p>
              </div>
              <button onClick={() => { setEditingTemplate(tpl); setEditorOpen(true); }}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-500 hover:bg-primary-50 hover:text-primary-700">Edit</button>
            </div>
          ))}
        </div>
      </div>
      <TemplateEditorDrawer template={editingTemplate} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingTemplate(null); }} />
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
  const tabParam = searchParams.get("tab") ?? "platform";
  const [activeTab, setActiveTab] = useState(tabParam);

  const { data, isLoading, isError, refetch } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);
  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);

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
          {activeTab === "emails" && <EmailTemplatesTab />}
        </div>
      </div>
    </div>
  );
}
