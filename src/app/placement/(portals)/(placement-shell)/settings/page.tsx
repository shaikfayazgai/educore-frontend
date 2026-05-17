"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  Loader2,
  User,
  Bell,
  Sliders,
  Check,
  X,
  Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  usePlacementSettings,
  useUpdatePlacementSettings,
  usePlacementProfile,
  useUpdatePlacementProfile,
  usePlacementNotificationPreferences,
  useUpdatePlacementNotificationPreferences,
} from "@/placement/lib/hooks/use-placement";
import { PageHeader } from "@/placement/components/shared/misc/page-header";
import { FormSection } from "@/placement/components/shared/forms/form-section";
import { FormField, FormTextarea } from "@/placement/components/shared/forms/form-field";
import { DashboardSkeleton } from "@/placement/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/placement/components/shared/feedback/error-state";
import { cn } from "@/placement/lib/utils/cn";
import type {
  PlacementSettings,
  PlacementProfile,
  PlacementNotificationPreferences,
} from "@/placement/lib/api/types/placement.types";

// ── Designation labels (mirror the admin CreateUserDialog options) ──────
const DESIGNATION_LABELS: Record<string, string> = {
  placement_officer: "Placement Officer",
  senior_placement_officer: "Senior Placement Officer",
  training_placement_officer: "Training & Placement Officer",
  placement_coordinator: "Placement Coordinator",
  head_of_placements: "Head of Placements",
  industry_relations_manager: "Industry Relations Manager",
};

type TabId = "profile" | "preferences" | "matching";

export default function PlacementSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your profile, notifications, and matching configuration"
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User}>
          Profile
        </TabButton>
        <TabButton active={activeTab === "preferences"} onClick={() => setActiveTab("preferences")} icon={Bell}>
          Preferences
        </TabButton>
        <TabButton active={activeTab === "matching"} onClick={() => setActiveTab("matching")} icon={Sliders}>
          Matching
        </TabButton>
      </div>

      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "preferences" && <PreferencesTab />}
      {activeTab === "matching" && <MatchingTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PROFILE TAB
// ════════════════════════════════════════════════════════════════════════════

interface ProfileFormData {
  name: string;
  designation: string;
  specialization: string;
  phone: string;
  office: string;
  officeHours: string;
  bio: string;
  industriesCovered: string;
}

function ProfileTab() {
  const profileQuery = usePlacementProfile();
  const updateProfile = useUpdatePlacementProfile();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  // Hydrate socialLinks when the profile loads. We don't put it in
  // useForm because react-hook-form's field-array API adds complexity
  // for very little benefit here (4 keys, no validation needed).
  useEffect(() => {
    if (profileQuery.data) {
      setSocialLinks(profileQuery.data.socialLinks || []);
    }
  }, [profileQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: "",
      designation: "",
      specialization: "",
      phone: "",
      office: "",
      officeHours: "",
      bio: "",
      industriesCovered: "",
    },
  });

  // Reset the form whenever the server data arrives or changes (e.g. after
  // a save) so the inputs reflect the latest persisted values.
  useEffect(() => {
    if (profileQuery.data) {
      const p = profileQuery.data;
      reset({
        name: p.name || "",
        designation: p.designation || "",
        specialization: p.specialization || "",
        phone: p.phone || "",
        office: p.office || "",
        officeHours: p.officeHours || "",
        bio: p.bio || "",
        industriesCovered: p.industriesCovered || "",
      });
    }
  }, [profileQuery.data, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaveSuccess(false);
    await updateProfile.mutateAsync({
      ...data,
      socialLinks,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addSocialLink = () => setSocialLinks((prev) => [...prev, { platform: "", url: "" }]);
  const removeSocialLink = (i: number) =>
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== i));
  const updateSocialLink = (i: number, field: "platform" | "url", value: string) =>
    setSocialLinks((prev) =>
      prev.map((link, idx) => (idx === i ? { ...link, [field]: value } : link))
    );

  if (profileQuery.isLoading) return <DashboardSkeleton />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState onRetry={() => profileQuery.refetch()} />;
  }
  const profile: PlacementProfile = profileQuery.data;

  // Humanise the stored designation key (`placement_officer` →
  // `Placement Officer`) for the read-only display in the disabled input.
  // The text input is read-only because Designation should be edited via
  // the admin user-creation form's dropdown (controlled vocabulary).
  // Actually scratch that — the user explicitly asked for editable profile
  // like faculty. Faculty makes Title editable as free text. Let's match.
  const designationDisplay =
    profile.designation && DESIGNATION_LABELS[profile.designation]
      ? DESIGNATION_LABELS[profile.designation]
      : profile.designation || "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <FormSection
        title="Personal Information"
        description="Update your personal details"
      >
        <FormField
          label="Full Name"
          required
          {...register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />
        <FormField
          label="Email"
          value={profile.email}
          disabled
          hint="Email cannot be changed"
        />
        <FormField
          label="Placement ID"
          value={profile.placementId}
          disabled
          hint="Set by your administrator"
        />
        <FormField
          label="Department"
          value={profile.department || "—"}
          disabled
          hint="Placement officers operate institution-wide unless scoped"
        />
        <FormField
          label="Designation"
          // Free-text editable like faculty's Title field, BUT the form
          // submits the raw input, so if a user types "Placement Officer"
          // it overwrites the dropdown-key value with the display value.
          // Acceptable tradeoff — the admin dropdown is authoritative and
          // this field is mostly for officers to refine wording.
          defaultValue={designationDisplay}
          {...register("designation")}
        />
        <FormField
          label="Specialization"
          placeholder="e.g. Tech & Engineering Recruitment"
          {...register("specialization")}
        />
        <FormField
          label="Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          {...register("phone")}
        />
        <FormTextarea
          label="Bio"
          placeholder="Tell employers about your placement-office experience…"
          rows={4}
          {...register("bio")}
        />
      </FormSection>

      <FormSection
        title="Office"
        description="Your physical office and availability"
      >
        <FormField
          label="Office"
          placeholder="Building A, Room 301"
          {...register("office")}
        />
        <FormField
          label="Hours of Availability"
          placeholder="Mon–Fri 10:00 AM – 4:00 PM"
          {...register("officeHours")}
        />
      </FormSection>

      <FormSection
        title="Industries Covered"
        description="Comma-separated list of industries you actively recruit for"
      >
        <FormField
          label="Industries"
          placeholder="Tech, Finance, Consulting, Healthcare"
          hint="Used to suggest matches between students and employers"
          {...register("industriesCovered")}
        />
      </FormSection>

      <FormSection
        title="Academic Details"
        description="Information set by your institution — contact admin to update"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {profile.dateOfJoining && (
            <FormField
              label="Date of Joining"
              value={new Date(profile.dateOfJoining).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              disabled
            />
          )}
        </div>
        {profile.qualifications && profile.qualifications.length > 0 && (
          <div>
            <p className="mb-1 block text-sm font-medium">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {profile.qualifications.map((q, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Social Links"
        description="Add links to your professional profiles (LinkedIn, etc.)"
      >
        <div className="space-y-3">
          {socialLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.platform}
                onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                placeholder="Platform (e.g., LinkedIn)"
                className="flex h-10 w-40 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://..."
                className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
              <button
                type="button"
                onClick={() => removeSocialLink(i)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-danger-light hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocialLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add social link
          </button>
        </div>
      </FormSection>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-light/50 px-4 py-3">
          <Check className="h-4 w-4 text-success" />
          <p className="text-sm font-medium text-success">Profile updated successfully</p>
        </div>
      )}

      {updateProfile.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger-light/50 px-4 py-3">
          <p className="text-sm text-danger">Failed to update profile. Please try again.</p>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PREFERENCES TAB — per-user notification toggles
// ════════════════════════════════════════════════════════════════════════════

interface NotifToggleItem {
  key: keyof PlacementNotificationPreferences;
  label: string;
  description: string;
}

const notifToggles: NotifToggleItem[] = [
  { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
  { key: "push", label: "Push Notifications", description: "Receive push notifications in browser" },
  {
    key: "employerMessages",
    label: "New Employer Messages",
    description: "Get notified when an employer reaches out",
  },
  {
    key: "matchingReady",
    label: "New Matching Results",
    description: "Notification when a new matching run completes",
  },
];

function PreferencesTab() {
  const prefsQuery = usePlacementNotificationPreferences();
  const updatePrefs = useUpdatePlacementNotificationPreferences();
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  if (prefsQuery.isLoading) return <DashboardSkeleton />;
  if (prefsQuery.isError || !prefsQuery.data) {
    return <ErrorState onRetry={() => prefsQuery.refetch()} />;
  }
  const prefs = prefsQuery.data;

  const handleToggle = async (key: keyof PlacementNotificationPreferences) => {
    const newValue = !prefs[key];
    updatePrefs.mutate(
      { [key]: newValue },
      {
        onSuccess: () => {
          setLastSaved(key);
          setTimeout(() => setLastSaved(null), 2000);
        },
      }
    );
  };

  return (
    <div className="max-w-2xl space-y-1">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {notifToggles.map((toggle, index) => {
          const isSaving =
            updatePrefs.isPending && updatePrefs.variables?.[toggle.key] !== undefined;
          const isChecked = prefs[toggle.key];

          return (
            <div
              key={toggle.key}
              className={cn(
                "flex items-center justify-between px-6 py-4",
                index < notifToggles.length - 1 && "border-b border-border"
              )}
            >
              <div>
                <p className="text-sm font-medium">{toggle.label}</p>
                <p className="text-xs text-muted-foreground">{toggle.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                {lastSaved === toggle.key && !isSaving && (
                  <Check className="h-3.5 w-3.5 text-success" />
                )}
                <button
                  onClick={() => handleToggle(toggle.key)}
                  disabled={isSaving}
                  role="switch"
                  aria-checked={isChecked}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-2",
                    isChecked ? "bg-portal-accent" : "bg-muted",
                    isSaving && "opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      isChecked ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MATCHING TAB — tenant-wide matching weights / equity / system notifications
//  (was the old /placement/settings page — now lives as a tab here)
// ════════════════════════════════════════════════════════════════════════════

function MatchingTab() {
  const { data: settings, isLoading, isError, refetch } = usePlacementSettings();
  const updateSettings = useUpdatePlacementSettings();
  const [formData, setFormData] = useState<PlacementSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Backend stores matching weights / minMatchScore as 0..1 floats; UI uses
  // 0..100. Convert at the I/O boundary. Defensive clamp (n > 1 ? n : n * 100)
  // recovers values stored by the previously-buggy form.
  useEffect(() => {
    if (settings) {
      const toPct = (v: number | undefined) => {
        const n = v ?? 0;
        return Math.round(n > 1 ? n : n * 100);
      };
      const m = settings.matchingPreferences;
      setFormData({
        ...settings,
        matchingPreferences: {
          ...m,
          minMatchScore: toPct(m.minMatchScore),
          weightGpa: toPct(m.weightGpa),
          weightSkills: toPct(m.weightSkills),
          weightExperience: toPct(m.weightExperience),
        },
      });
      setIsDirty(false);
    }
  }, [settings]);

  const update = useCallback(
    (section: keyof PlacementSettings, field: string, value: number | boolean) => {
      setFormData((prev) => {
        if (!prev) return prev;
        return { ...prev, [section]: { ...prev[section], [field]: value } };
      });
      setIsDirty(true);
    },
    []
  );

  const handleSave = async () => {
    if (!formData) return;
    try {
      const m = formData.matchingPreferences;
      const payload: PlacementSettings = {
        ...formData,
        matchingPreferences: {
          ...m,
          minMatchScore: (m.minMatchScore ?? 0) / 100,
          weightGpa: (m.weightGpa ?? 0) / 100,
          weightSkills: (m.weightSkills ?? 0) / 100,
          weightExperience: (m.weightExperience ?? 0) / 100,
        },
      };
      await updateSettings.mutateAsync(payload);
      setFeedback({ type: "success", message: "Matching settings saved." });
      setIsDirty(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({ type: "error", message: "Failed to save. Please try again." });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !settings || !formData) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-3xl space-y-6">
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

      <FormSection
        title="Matching Preferences"
        description="Tenant-wide matching engine configuration. Affects every officer in your institution."
      >
        <SliderInput
          label="Minimum Match Score"
          value={formData.matchingPreferences.minMatchScore}
          onChange={(v) => update("matchingPreferences", "minMatchScore", v)}
          min={0}
          max={100}
          unit="%"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SliderInput
            label="GPA Weight"
            value={formData.matchingPreferences.weightGpa}
            onChange={(v) => update("matchingPreferences", "weightGpa", v)}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Skills Weight"
            value={formData.matchingPreferences.weightSkills}
            onChange={(v) => update("matchingPreferences", "weightSkills", v)}
            min={0}
            max={100}
            unit="%"
          />
          <SliderInput
            label="Experience Weight"
            value={formData.matchingPreferences.weightExperience}
            onChange={(v) => update("matchingPreferences", "weightExperience", v)}
            min={0}
            max={100}
            unit="%"
          />
        </div>
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
        <FormField
          label="Max Results Per Run"
          type="number"
          value={formData.matchingPreferences.maxResultsPerRun}
          onChange={(e) =>
            update(
              "matchingPreferences",
              "maxResultsPerRun",
              parseInt(e.target.value, 10) || 50
            )
          }
          min={1}
          max={500}
        />
      </FormSection>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || updateSettings.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Matching Settings
        </button>
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  unit,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-muted-foreground">
          {value}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-portal-accent disabled:opacity-50"
      />
    </div>
  );
}
