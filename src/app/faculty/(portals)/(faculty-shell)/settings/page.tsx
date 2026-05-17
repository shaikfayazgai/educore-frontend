"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Check,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  useFacultyProfile,
  useUpdateFacultyProfile,
  useFacultyNotificationPreferences,
  useUpdateFacultyNotificationPreferences,
} from "@/faculty/lib/hooks/use-faculty";
import { PageHeader } from "@/faculty/components/shared/misc/page-header";
import { FormField, FormTextarea } from "@/faculty/components/shared/forms/form-field";
import { FormSection } from "@/faculty/components/shared/forms/form-section";
import { DashboardSkeleton } from "@/faculty/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/faculty/components/shared/feedback/error-state";
import { cn } from "@/faculty/lib/utils/cn";
import type { FacultyProfile, FacultyNotificationPreferences } from "@/faculty/lib/api/types/faculty.types";

type TabId = "profile" | "preferences";

export default function FacultySettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const profileQuery = useFacultyProfile();

  if (profileQuery.isLoading) return <DashboardSkeleton />;
  if (profileQuery.isError) return <ErrorState onRetry={() => profileQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your profile and preferences"
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <TabButton
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          icon={User}
        >
          Profile
        </TabButton>
        <TabButton
          active={activeTab === "preferences"}
          onClick={() => setActiveTab("preferences")}
          icon={Bell}
        >
          Preferences
        </TabButton>
      </div>

      {activeTab === "profile" && profileQuery.data && (
        <ProfileTab profile={profileQuery.data} />
      )}

      {activeTab === "preferences" && <PreferencesTab />}
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

// === Profile Tab ===

interface ProfileFormData {
  name: string;
  phone: string;
  bio: string;
  officeHours: string;
  office: string;
  expertise: string;
}

function ProfileTab({ profile }: { profile: FacultyProfile }) {
  const updateProfile = useUpdateFacultyProfile();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile.name,
      phone: profile.phone || "",
      bio: profile.bio || "",
      officeHours: profile.officeHours || "",
      office: profile.office || "",
      expertise: profile.expertise.join(", "),
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaveSuccess(false);
    await updateProfile.mutateAsync({
      name: data.name,
      phone: data.phone || undefined,
      bio: data.bio || undefined,
      officeHours: data.officeHours || undefined,
      office: data.office || undefined,
      expertise: data.expertise
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      socialLinks,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: "", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <FormSection title="Personal Information" description="Update your personal details">
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
          label="Faculty ID"
          value={profile.facultyId}
          disabled
        />
        <FormField
          label="Specialization"
          value={profile.department}
          disabled
        />
        <FormField
          label="Title"
          value={profile.title}
          disabled
        />
        <FormField
          label="Phone"
          type="tel"
          {...register("phone")}
          placeholder="+1 (555) 000-0000"
        />
        <FormTextarea
          label="Bio"
          {...register("bio")}
          placeholder="Tell us about your academic background..."
          rows={4}
        />
      </FormSection>

      <FormSection title="Office" description="Your office location and hours">
        <FormField
          label="Office"
          {...register("office")}
          placeholder="Building A, Room 301"
        />
        <FormField
          label="Office Hours"
          {...register("officeHours")}
          placeholder="Mon/Wed 2:00-4:00 PM"
        />
      </FormSection>

      <FormSection title="Expertise" description="Add your areas of expertise as comma-separated values">
        <FormField
          label="Expertise"
          {...register("expertise")}
          placeholder="Deep Learning, Statistical Analysis, Python (comma-separated)"
          hint="Comma-separated list of expertise areas"
        />
      </FormSection>

      <FormSection title="Academic Details" description="Information set by your institution — contact admin to update">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {profile.dateOfJoining && (
            <FormField
              label="Date of Joining"
              value={new Date(profile.dateOfJoining).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              disabled
            />
          )}
          {profile.orcid && (
            <FormField
              label="ORCID"
              value={profile.orcid}
              disabled
              hint="Your researcher identifier"
            />
          )}
        </div>
        {profile.qualifications && profile.qualifications.length > 0 && (
          <div>
            <p className="mb-1 block text-sm font-medium">Qualifications</p>
            <div className="flex flex-wrap gap-2">
              {profile.qualifications.map((q, i) => (
                <span key={i} className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">{q}</span>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Social Links" description="Add links to your professional profiles">
        <div className="space-y-3">
          {socialLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.platform}
                onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                placeholder="Platform (e.g., Google Scholar)"
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
          <p className="text-xs text-muted-foreground mt-2">
            Social links help colleagues find your professional profiles.
          </p>
        </div>
      </FormSection>

      {/* Save result */}
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

      {/* Actions */}
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

// === Preferences Tab ===

interface NotifToggleItem {
  key: keyof FacultyNotificationPreferences;
  label: string;
  description: string;
}

const notifToggles: NotifToggleItem[] = [
  { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
  { key: "push", label: "Push Notifications", description: "Receive push notifications in browser" },
  { key: "studentRiskAlerts", label: "Student Risk Alerts", description: "Get notified when student risk levels change" },
  { key: "briefingReady", label: "Briefing Ready", description: "Notification when AI briefings are ready" },
];

function PreferencesTab() {
  const prefsQuery = useFacultyNotificationPreferences();
  const updatePrefs = useUpdateFacultyNotificationPreferences();
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  if (prefsQuery.isLoading) return <DashboardSkeleton />;
  if (prefsQuery.isError) return <ErrorState onRetry={() => prefsQuery.refetch()} />;

  const prefs = prefsQuery.data as FacultyNotificationPreferences;

  const handleToggle = async (key: keyof FacultyNotificationPreferences) => {
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
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {notifToggles.map((toggle, index) => {
          const isSaving = updatePrefs.isPending && updatePrefs.variables?.[toggle.key] !== undefined;
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
                {isSaving && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
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
                      "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
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
