"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import {
  usePlacementSettings,
  useUpdatePlacementSettings,
} from "@/admin/lib/hooks/use-placement";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { FormSection } from "@/admin/components/shared/forms/form-section";
import { DashboardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { cn } from "@/admin/lib/utils/cn";
import type { PlacementSettings } from "@/admin/lib/api/types/placement.types";

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

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-semibold">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-portal-accent disabled:opacity-50"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function PlacementSettingsPage() {
  const { data: settings, isLoading, isError, refetch } =
    usePlacementSettings();
  const updateSettings = useUpdatePlacementSettings();

  const [formData, setFormData] = useState<PlacementSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setIsDirty(false);
    }
  }, [settings]);

  const update = useCallback(
    (
      section: keyof PlacementSettings,
      field: string,
      value: number | boolean
    ) => {
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      });
      setIsDirty(true);
    },
    []
  );

  const handleSave = async () => {
    if (!formData) return;
    try {
      await updateSettings.mutateAsync(formData);
      setFeedback({
        type: "success",
        message: "Settings saved successfully.",
      });
      setIsDirty(false);
      setTimeout(() => setFeedback(null), 4000);
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
          description="Matching preferences and configuration"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !settings || !formData) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Matching preferences and configuration"
        />
        <ErrorState
          title="Failed to load settings"
          message="Could not retrieve placement settings. Please try again."
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
        description="Matching preferences and configuration"
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

      <div className="space-y-8">
        {/* Matching Preferences */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Matching Preferences"
            description="Configure AI matching engine parameters"
          >
            <div className="space-y-6">
              <SliderInput
                label="Minimum Match Score"
                value={formData.matchingPreferences.minMatchScore}
                onChange={(v) =>
                  update("matchingPreferences", "minMatchScore", v)
                }
                min={0}
                max={100}
                unit="%"
                disabled={updateSettings.isPending}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Results Per Run
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={formData.matchingPreferences.maxResultsPerRun}
                  onChange={(e) =>
                    update(
                      "matchingPreferences",
                      "maxResultsPerRun",
                      parseInt(e.target.value) || 50
                    )
                  }
                  disabled={updateSettings.isPending}
                  className="flex h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 disabled:opacity-50"
                />
              </div>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Include Internships"
                  description="Match students with internship positions"
                  checked={formData.matchingPreferences.includeInternships}
                  onChange={(v) =>
                    update("matchingPreferences", "includeInternships", v)
                  }
                  disabled={updateSettings.isPending}
                />
                <ToggleSwitch
                  label="Include Part-Time"
                  description="Match students with part-time positions"
                  checked={formData.matchingPreferences.includePartTime}
                  onChange={(v) =>
                    update("matchingPreferences", "includePartTime", v)
                  }
                  disabled={updateSettings.isPending}
                />
              </div>

              {/* Weight Sliders */}
              <div className="border-t border-border pt-4">
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Matching Weight Distribution
                </p>
                <div className="space-y-4">
                  <SliderInput
                    label="GPA Weight"
                    value={formData.matchingPreferences.weightGpa}
                    onChange={(v) =>
                      update("matchingPreferences", "weightGpa", v)
                    }
                    min={0}
                    max={100}
                    unit="%"
                    disabled={updateSettings.isPending}
                  />
                  <SliderInput
                    label="Skills Weight"
                    value={formData.matchingPreferences.weightSkills}
                    onChange={(v) =>
                      update("matchingPreferences", "weightSkills", v)
                    }
                    min={0}
                    max={100}
                    unit="%"
                    disabled={updateSettings.isPending}
                  />
                  <SliderInput
                    label="Experience Weight"
                    value={formData.matchingPreferences.weightExperience}
                    onChange={(v) =>
                      update("matchingPreferences", "weightExperience", v)
                    }
                    min={0}
                    max={100}
                    unit="%"
                    disabled={updateSettings.isPending}
                  />
                  {(() => {
                    const total =
                      formData.matchingPreferences.weightGpa +
                      formData.matchingPreferences.weightSkills +
                      formData.matchingPreferences.weightExperience;
                    if (total !== 100) {
                      return (
                        <p className="text-xs font-medium text-warning">
                          Weights sum to {total}% (should be 100%)
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        {/* Equity Parameters */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Equity Parameters"
            description="Configure diversity and equity monitoring"
          >
            <div className="space-y-4">
              <ToggleSwitch
                label="Enable Equity Check"
                description="Flag matches that may impact diversity targets"
                checked={formData.equityParameters.enableEquityCheck}
                onChange={(v) =>
                  update("equityParameters", "enableEquityCheck", v)
                }
                disabled={updateSettings.isPending}
              />
              {formData.equityParameters.enableEquityCheck && (
                <>
                  <SliderInput
                    label="Target Diversity Rate"
                    value={formData.equityParameters.targetDiversityRate}
                    onChange={(v) =>
                      update("equityParameters", "targetDiversityRate", v)
                    }
                    min={0}
                    max={100}
                    unit="%"
                    disabled={updateSettings.isPending}
                  />
                  <SliderInput
                    label="Flag Threshold"
                    value={formData.equityParameters.flagThreshold}
                    onChange={(v) =>
                      update("equityParameters", "flagThreshold", v)
                    }
                    min={0}
                    max={100}
                    unit="%"
                    disabled={updateSettings.isPending}
                  />
                </>
              )}
            </div>
          </FormSection>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Notifications"
            description="Control which notifications you receive"
          >
            <div className="space-y-4">
              <ToggleSwitch
                label="New Matches"
                description="Get notified when new match results are available"
                checked={formData.notifications.newMatches}
                onChange={(v) => update("notifications", "newMatches", v)}
                disabled={updateSettings.isPending}
              />
              <ToggleSwitch
                label="Employer Messages"
                description="Receive notifications from employers"
                checked={formData.notifications.employerMessages}
                onChange={(v) =>
                  update("notifications", "employerMessages", v)
                }
                disabled={updateSettings.isPending}
              />
              <ToggleSwitch
                label="Pipeline Updates"
                description="Get notified when pipeline items change stages"
                checked={formData.notifications.pipelineUpdates}
                onChange={(v) =>
                  update("notifications", "pipelineUpdates", v)
                }
                disabled={updateSettings.isPending}
              />
              <ToggleSwitch
                label="Weekly Digest"
                description="Receive a weekly summary email"
                checked={formData.notifications.weeklyDigest}
                onChange={(v) => update("notifications", "weeklyDigest", v)}
                disabled={updateSettings.isPending}
              />
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
    </div>
  );
}
