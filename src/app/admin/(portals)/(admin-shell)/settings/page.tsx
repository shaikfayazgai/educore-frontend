"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInstitutionSettings, useUpdateSettings, useSupportContact, useUpdateSupportContact } from "@/admin/lib/hooks/use-admin";
import { ApiError } from "@/admin/lib/api/client";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import {
  institutionSettingsSchema,
  type InstitutionSettingsFormData,
} from "@/admin/lib/schemas/admin.schema";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { FormSection } from "@/admin/components/shared/forms/form-section";
import { FormField, FormSelect } from "@/admin/components/shared/forms/form-field";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { cn } from "@/admin/lib/utils/cn";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Chicago", label: "US Central" },
  { value: "America/Denver", label: "US Mountain" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];

const LOCALE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-IN", label: "English (India)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "es-ES", label: "Spanish" },
  { value: "ja-JP", label: "Japanese" },
];

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50",
          checked ? "bg-portal-accent" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading, isError, refetch } = useInstitutionSettings();
  const updateSettings = useUpdateSettings();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<InstitutionSettingsFormData>({
    resolver: zodResolver(institutionSettingsSchema),
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        shortName: settings.shortName,
        timezone: settings.timezone,
        locale: settings.locale,
        academicYear: settings.academicYear,
        primaryColor: settings.primaryColor,
        visibility: {
          shareWithMinistry: settings.visibility.shareWithMinistry,
          anonymizeData: settings.visibility.anonymizeData,
          publicProfile: settings.visibility.publicProfile,
        },
        dataRetention: {
          studentRecords: settings.dataRetention.studentRecords,
          auditLogs: settings.dataRetention.auditLogs,
          analyticsData: settings.dataRetention.analyticsData,
        },
      });
    }
  }, [settings, reset]);

  const visibility = watch("visibility");
  const primaryColor = watch("primaryColor");

  const onSubmit = useCallback(
    async (data: InstitutionSettingsFormData) => {
      try {
        await updateSettings.mutateAsync(data);
        setFeedback({
          type: "success",
          message: "Settings saved successfully.",
        });
        setTimeout(() => setFeedback(null), 3000);
      } catch {
        setFeedback({
          type: "error",
          message: "Failed to save settings. Please try again.",
        });
        setTimeout(() => setFeedback(null), 5000);
      }
    },
    [updateSettings]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Institution configuration and preferences"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Institution configuration and preferences"
        />
        <ErrorState
          title="Failed to load settings"
          message="Could not retrieve institution settings. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Institution configuration and preferences"
      />

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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* General Settings */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="General"
            description="Basic institution information and branding"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* University name is owned by the super-admin — appears on
                  transcripts and credentials, so we don't let the uni-admin
                  change it here. Backend also silently drops `name` from the
                  PATCH /api/admin/settings payload.
                  Visually `disabled` (greyed out + not-allowed cursor) so it's
                  obvious; readOnly alone made it look editable. */}
              <FormField
                label="Institution Name"
                error={errors.name?.message}
                hint="Only the Glimmora platform team (super-admin) can change this. Contact support if it's incorrect."
                disabled
                {...register("name")}
              />
              <FormField
                label="Short Name"
                error={errors.shortName?.message}
                required
                {...register("shortName")}
              />
              <FormSelect
                label="Timezone"
                options={TIMEZONE_OPTIONS}
                error={errors.timezone?.message}
                required
                {...register("timezone")}
              />
              <FormSelect
                label="Locale"
                options={LOCALE_OPTIONS}
                error={errors.locale?.message}
                required
                {...register("locale")}
              />
              <FormField
                label="Academic Year"
                placeholder="e.g. 2025-2026"
                error={errors.academicYear?.message}
                required
                {...register("academicYear")}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Primary Color
                  <span className="ml-0.5 text-danger">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-background p-1"
                    {...register("primaryColor")}
                  />
                  <input
                    type="text"
                    value={primaryColor || ""}
                    readOnly
                    className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm"
                  />
                </div>
                {primaryColor && (
                  <div className="flex items-center gap-3 pt-1">
                    <span
                      className="inline-flex h-7 items-center rounded px-3 text-xs font-medium text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Sample
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: primaryColor }}
                    >
                      Sample Text
                    </span>
                  </div>
                )}
                {errors.primaryColor?.message && (
                  <p className="text-xs text-danger">
                    {errors.primaryColor.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>
        </div>

        {/* Data Sharing — Share with Ministry / Public Profile toggles
            removed at admin's request. The underlying form fields (and
            their stored values) are preserved on the schema + defaultValues
            so any existing setting round-trips untouched on save. Only the
            visible-to-admin "Anonymize Data" toggle stays exposed. */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Data Sharing & Visibility"
            description="Control how your institution's data is shared"
          >
            <div className="space-y-4">
              <ToggleSwitch
                label="Anonymize Data"
                description="Anonymize student data in shared reports"
                checked={visibility?.anonymizeData ?? false}
                onChange={(checked) =>
                  setValue("visibility.anonymizeData", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={updateSettings.isPending}
              />
            </div>
          </FormSection>
        </div>

        {/* Data Retention section removed at admin's request. Schema +
            defaultValues retain the studentRecords / auditLogs /
            analyticsData fields so previously-saved retention periods are
            still sent back on submit and the backend keeps them — the
            admin just no longer surfaces a way to change them from this
            screen. */}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {isDirty && (
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
          )}
          <button
            type="submit"
            disabled={updateSettings.isPending || !isDirty}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </button>
        </div>
      </form>

      {/* Support contact card — separate form because it's a different
          backend endpoint and there's no benefit to coupling the two. */}
      <SupportContactCard />
    </div>
  );
}

/** Edits the contact info shown on the lockout page when one of this
 *  tenant's faculty/student/placement users gets suspended/inactive. */
function SupportContactCard() {
  const { data, isLoading } = useSupportContact();
  const update = useUpdateSupportContact();

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [helpText, setHelpText] = useState("");
  const [dirty, setDirty] = useState(false);

  // Sync from server once loaded.
  useEffect(() => {
    if (!data) return;
    setContactName(data.contactName ?? "");
    setEmail(data.email ?? "");
    setPhone(data.phone ?? "");
    setAlternatePhone(data.alternatePhone ?? "");
    setHelpText(data.helpText ?? "");
    setDirty(false);
  }, [data]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ contactName, email, phone, alternatePhone, helpText });
      toast.success("Support contact updated");
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update contact");
    }
  };

  const onChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6">
      <FormSection
        title="Lockout-page support contact"
        description="Shown to faculty / student / placement users when their account is suspended or inactive — so they know who at this university to call."
      >
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Contact name"
              placeholder="e.g. Registrar's Office"
              value={contactName}
              onChange={onChange(setContactName)}
            />
            <FormField
              label="Email"
              type="email"
              placeholder="support@your-uni.edu"
              value={email}
              onChange={onChange(setEmail)}
            />
            <FormField
              label="Phone"
              type="tel"
              placeholder="+91 …"
              value={phone}
              onChange={onChange(setPhone)}
            />
            <FormField
              label="Alternate phone"
              type="tel"
              placeholder="Optional"
              value={alternatePhone}
              onChange={onChange(setAlternatePhone)}
            />
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium leading-none">Help text (one line)</label>
              <textarea
                value={helpText}
                onChange={onChange(setHelpText)}
                placeholder="e.g. Office hours: Mon–Fri, 9 AM – 5 PM IST"
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
              />
            </div>
          </div>
        )}
      </FormSection>

      <div className="mt-6 flex items-center justify-end gap-4">
        {dirty && (
          <p className="text-sm text-muted-foreground">
            <Phone className="mr-1 inline-block h-3.5 w-3.5" /> Unsaved support contact changes
          </p>
        )}
        <button
          type="submit"
          disabled={update.isPending || !dirty}
          className="flex items-center gap-2 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Contact
        </button>
      </div>
    </form>
  );
}
