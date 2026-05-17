"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInstitutionSettings, useUpdateSettings } from "@/superadmin/lib/hooks/use-admin";
import {
  institutionSettingsSchema,
  type InstitutionSettingsFormData,
} from "@/superadmin/lib/schemas/admin.schema";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { FormSection } from "@/superadmin/components/shared/forms/form-section";
import { FormField, FormSelect } from "@/superadmin/components/shared/forms/form-field";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";

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
              <FormField
                label="Institution Name"
                error={errors.name?.message}
                required
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

        {/* Data Sharing */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Data Sharing & Visibility"
            description="Control how your institution's data is shared"
          >
            <div className="space-y-4">
              <ToggleSwitch
                label="Share with Ministry"
                description="Allow aggregated data to be shared with the education ministry"
                checked={visibility?.shareWithMinistry ?? false}
                onChange={(checked) =>
                  setValue("visibility.shareWithMinistry", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={updateSettings.isPending}
              />
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
              <ToggleSwitch
                label="Public Profile"
                description="Make institution profile publicly visible"
                checked={visibility?.publicProfile ?? false}
                onChange={(checked) =>
                  setValue("visibility.publicProfile", checked, {
                    shouldDirty: true,
                  })
                }
                disabled={updateSettings.isPending}
              />
            </div>
          </FormSection>
        </div>

        {/* Data Retention */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Data Retention"
            description="Configure how long different data types are retained (in years)"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                label="Student Records"
                type="number"
                min={1}
                error={errors.dataRetention?.studentRecords?.message}
                required
                hint="Years"
                {...register("dataRetention.studentRecords", {
                  valueAsNumber: true,
                })}
              />
              <FormField
                label="Audit Logs"
                type="number"
                min={1}
                error={errors.dataRetention?.auditLogs?.message}
                required
                hint="Years"
                {...register("dataRetention.auditLogs", {
                  valueAsNumber: true,
                })}
              />
              <FormField
                label="Analytics Data"
                type="number"
                min={1}
                error={errors.dataRetention?.analyticsData?.message}
                required
                hint="Years"
                {...register("dataRetention.analyticsData", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
              <p className="text-xs text-warning">
                Changing data retention policies will affect historical data. Records older than the specified period will be permanently archived. Please ensure you have exported any needed data before reducing retention periods.
              </p>
            </div>
          </FormSection>
        </div>

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
    </div>
  );
}
