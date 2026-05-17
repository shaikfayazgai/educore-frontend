"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Loader2, Save } from "lucide-react";
import {
  useMinistrySettings,
  useUpdateMinistrySettings,
} from "@/superadmin/lib/hooks/use-ministry";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { FormSection } from "@/superadmin/components/shared/forms/form-section";
import { FormField, FormSelect } from "@/superadmin/components/shared/forms/form-field";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import type { MinistrySettings } from "@/superadmin/lib/api/types/ministry.types";

const VIEW_OPTIONS = [
  { value: "overview", label: "Overview" },
  { value: "compliance", label: "Compliance" },
  { value: "budget", label: "Budget" },
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

export default function MinistrySettingsPage() {
  const { data: settings, isLoading, isError, refetch } = useMinistrySettings();
  const updateSettings = useUpdateMinistrySettings();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isDirty, setIsDirty] = useState(false);

  // Local form state
  const [defaultView, setDefaultView] = useState<string>("overview");
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [showAllInstitutions, setShowAllInstitutions] = useState(true);

  const [anonymizeStudentData, setAnonymizeStudentData] = useState(false);
  const [requireApprovalForExport, setRequireApprovalForExport] =
    useState(false);
  const [dataRetentionYears, setDataRetentionYears] = useState<number>(7);

  const [complianceAlerts, setComplianceAlerts] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [institutionUpdates, setInstitutionUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setDefaultView(settings.dashboardPreferences.defaultView);
      setRefreshInterval(settings.dashboardPreferences.refreshInterval);
      setShowAllInstitutions(
        settings.dashboardPreferences.showAllInstitutions
      );
      setAnonymizeStudentData(settings.dataAccess.anonymizeStudentData);
      setRequireApprovalForExport(
        settings.dataAccess.requireApprovalForExport
      );
      setDataRetentionYears(settings.dataAccess.dataRetentionYears);
      setComplianceAlerts(settings.notifications.complianceAlerts);
      setBudgetAlerts(settings.notifications.budgetAlerts);
      setInstitutionUpdates(settings.notifications.institutionUpdates);
      setWeeklyDigest(settings.notifications.weeklyDigest);
      setIsDirty(false);
    }
  }, [settings]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleSave = async () => {
    const payload: Partial<MinistrySettings> = {
      dashboardPreferences: {
        defaultView: defaultView as "overview" | "compliance" | "budget",
        refreshInterval,
        showAllInstitutions,
      },
      dataAccess: {
        anonymizeStudentData,
        requireApprovalForExport,
        dataRetentionYears,
      },
      notifications: {
        complianceAlerts,
        budgetAlerts,
        institutionUpdates,
        weeklyDigest,
      },
    };

    try {
      await updateSettings.mutateAsync(payload);
      setFeedback({
        type: "success",
        message: "Settings saved successfully.",
      });
      setIsDirty(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to save settings. Please try again.",
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Ministry portal configuration and preferences"
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
          description="Ministry portal configuration and preferences"
        />
        <ErrorState
          title="Failed to load settings"
          message="Could not retrieve ministry settings. Please try again."
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
        description="Ministry portal configuration and preferences"
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

      {/* Dashboard Preferences */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection
          title="Dashboard Preferences"
          description="Configure your default dashboard experience"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect
              label="Default View"
              options={VIEW_OPTIONS}
              value={defaultView}
              onChange={(e) => {
                setDefaultView(e.target.value);
                markDirty();
              }}
            />
            <FormField
              label="Refresh Interval"
              type="number"
              min={5}
              max={300}
              value={refreshInterval}
              onChange={(e) => {
                setRefreshInterval(Number(e.target.value));
                markDirty();
              }}
              hint="Seconds between dashboard data refreshes"
            />
          </div>
          <ToggleSwitch
            label="Show All Institutions"
            description="Display all institutions in dashboard views instead of top performers"
            checked={showAllInstitutions}
            onChange={(checked) => {
              setShowAllInstitutions(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
        </FormSection>
      </div>

      {/* Data Access */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection
          title="Data Access"
          description="Control data privacy and export settings"
        >
          <ToggleSwitch
            label="Anonymize Student Data"
            description="Mask personally identifiable information in reports"
            checked={anonymizeStudentData}
            onChange={(checked) => {
              setAnonymizeStudentData(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
          <ToggleSwitch
            label="Require Approval for Export"
            description="Require manager approval before exporting data"
            checked={requireApprovalForExport}
            onChange={(checked) => {
              setRequireApprovalForExport(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
          <FormField
            label="Data Retention"
            type="number"
            min={1}
            max={99}
            value={dataRetentionYears}
            onChange={(e) => {
              setDataRetentionYears(Number(e.target.value));
              markDirty();
            }}
            hint="Number of years to retain historical data"
          />
        </FormSection>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection
          title="Notifications"
          description="Configure alert and notification preferences"
        >
          <ToggleSwitch
            label="Compliance Alerts"
            description="Receive alerts when institutions fall below compliance thresholds"
            checked={complianceAlerts}
            onChange={(checked) => {
              setComplianceAlerts(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
          <ToggleSwitch
            label="Budget Alerts"
            description="Receive alerts on budget overruns and utilization anomalies"
            checked={budgetAlerts}
            onChange={(checked) => {
              setBudgetAlerts(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
          <ToggleSwitch
            label="Institution Updates"
            description="Receive notifications when institutions submit new data"
            checked={institutionUpdates}
            onChange={(checked) => {
              setInstitutionUpdates(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
          <ToggleSwitch
            label="Weekly Digest"
            description="Receive a weekly summary of key metrics and changes"
            checked={weeklyDigest}
            onChange={(checked) => {
              setWeeklyDigest(checked);
              markDirty();
            }}
            disabled={updateSettings.isPending}
          />
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
          onClick={handleSave}
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
    </div>
  );
}
