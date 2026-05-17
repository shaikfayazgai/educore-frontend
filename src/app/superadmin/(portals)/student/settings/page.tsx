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
  Shield,
  Download,
  Briefcase,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  useStudentProfile,
  useUpdateProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/superadmin/lib/hooks/use-student";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { FormField, FormTextarea } from "@/superadmin/components/shared/forms/form-field";
import { FormSection } from "@/superadmin/components/shared/forms/form-section";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import type { WorkExperience } from "@/superadmin/lib/api/types/student.types";

type TabId = "profile" | "notifications" | "security";

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const profileQuery = useStudentProfile();
  const notifQuery = useNotificationPreferences();

  const isLoading = profileQuery.isLoading || notifQuery.isLoading;
  const isError = profileQuery.isError || notifQuery.isError;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return (
      <ErrorState
        onRetry={() => {
          profileQuery.refetch();
          notifQuery.refetch();
        }}
      />
    );
  }

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
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          icon={Bell}
        >
          Notifications
        </TabButton>
        <TabButton
          active={activeTab === "security"}
          onClick={() => setActiveTab("security")}
          icon={Shield}
        >
          Security
        </TabButton>
      </div>

      {activeTab === "profile" && profileQuery.data && (
        <ProfileTab profile={profileQuery.data} />
      )}

      {activeTab === "notifications" && notifQuery.data && (
        <NotificationsTab preferences={notifQuery.data} />
      )}

      {activeTab === "security" && <SecurityTab />}
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
  personalEmail: string;
  phone: string;
  bio: string;
  interests: string;
  socialLinks: { platform: string; url: string }[];
}

function ProfileTab({
  profile,
}: {
  profile: import("@/superadmin/lib/api/types/student.types").StudentProfile;
}) {
  const updateProfile = useUpdateProfile();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks || []);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>(
    profile.workExperience || []
  );
  const [showExpForm, setShowExpForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile.name,
      personalEmail: profile.personalEmail || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
      interests: profile.interests.join(", "),
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaveSuccess(false);
    await updateProfile.mutateAsync({
      name: data.name,
      personalEmail: data.personalEmail || undefined,
      phone: data.phone || undefined,
      bio: data.bio || undefined,
      interests: data.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      socialLinks,
      workExperience,
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

  const removeWorkExperience = (index: number) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
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
          label="Institutional Email"
          value={profile.email}
          disabled
          hint="Institutional email cannot be changed"
        />
        <FormField
          label="Personal Email (for notifications after graduation)"
          type="email"
          {...register("personalEmail")}
          placeholder="your.personal@email.com"
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
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </FormSection>

      <FormSection title="Academic Info" description="These fields are managed by your institution">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Student ID" value={profile.studentId} disabled />
          <FormField label="Department" value={profile.department} disabled />
          <FormField label="Program" value={profile.program} disabled />
          <FormField label="Enrollment Year" value={String(profile.enrollmentYear)} disabled />
          <FormField label="Expected Graduation" value={profile.expectedGraduation} disabled />
        </div>
        <p className="text-xs text-muted-foreground">
          Academic information is managed by the Registrar&apos;s Office. If any details are incorrect, please contact registrar@university.edu
        </p>
      </FormSection>

      <FormSection title="Interests" description="Add your academic and professional interests">
        <FormField
          label="Interests"
          {...register("interests")}
          placeholder="Machine Learning, Data Science, Web Development (comma-separated)"
          hint="Comma-separated list of interests"
        />
      </FormSection>

      <FormSection title="Social Links" description="Add links to your professional profiles">
        <div className="space-y-3">
          {socialLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.platform}
                onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                placeholder="Platform (e.g., LinkedIn)"
                className="flex h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
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
        <p className="text-xs text-muted-foreground">
          These links are visible to employers when you apply for positions through Career Services.
        </p>
      </FormSection>

      <FormSection title="Work Experience" description="Add your professional experience">
        <div className="space-y-4">
          {workExperience.map((exp, i) => (
            <div
              key={exp.id}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{exp.title}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.startDate} &mdash; {exp.current ? "Present" : exp.endDate || "N/A"}
                  </p>
                  {exp.description && (
                    <p className="mt-2 text-sm text-foreground/80">{exp.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeWorkExperience(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-light hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {showExpForm ? (
            <WorkExperienceForm
              onSave={(entry) => {
                setWorkExperience((prev) => [...prev, entry]);
                setShowExpForm(false);
              }}
              onCancel={() => setShowExpForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowExpForm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </button>
          )}
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

// === Work Experience Form ===

function WorkExperienceForm({
  onSave,
  onCancel,
}: {
  onSave: (entry: WorkExperience) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [current, setCurrent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!company.trim()) newErrors.company = "Company is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!current && !endDate) newErrors.endDate = "End date is required unless currently working here";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: crypto.randomUUID(),
      title: title.trim(),
      company: company.trim(),
      startDate,
      endDate: current ? undefined : endDate,
      description: description.trim(),
      current,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Briefcase className="h-4 w-4" />
        Add Work Experience
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title <span className="text-danger">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
            placeholder="Software Engineer"
            className={cn(
              "flex h-10 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent",
              errors.title ? "border-danger" : "border-input"
            )}
          />
          {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company <span className="text-danger">*</span></label>
          <input
            type="text"
            value={company}
            onChange={(e) => { setCompany(e.target.value); setErrors((p) => ({ ...p, company: "" })); }}
            placeholder="Acme Corp"
            className={cn(
              "flex h-10 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent",
              errors.company ? "border-danger" : "border-input"
            )}
          />
          {errors.company && <p className="text-xs text-danger">{errors.company}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date <span className="text-danger">*</span></label>
          <input
            type="month"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: "" })); }}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent",
              errors.startDate ? "border-danger" : "border-input"
            )}
          />
          {errors.startDate && <p className="text-xs text-danger">{errors.startDate}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date {!current && <span className="text-danger">*</span>}</label>
          <input
            type="month"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setErrors((p) => ({ ...p, endDate: "" })); }}
            disabled={current}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent disabled:cursor-not-allowed disabled:opacity-50",
              errors.endDate ? "border-danger" : "border-input"
            )}
          />
          {errors.endDate && <p className="text-xs text-danger">{errors.endDate}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="current-work"
          checked={current}
          onChange={(e) => {
            setCurrent(e.target.checked);
            if (e.target.checked) {
              setEndDate("");
              setErrors((p) => ({ ...p, endDate: "" }));
            }
          }}
          className="h-4 w-4 rounded border-border text-portal-accent focus:ring-portal-accent"
        />
        <label htmlFor="current-work" className="text-sm">Currently working here</label>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your role and responsibilities..."
          rows={3}
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
        >
          <Check className="h-4 w-4" />
          Save Experience
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// === Notifications Tab ===

interface NotifToggleItem {
  key: keyof import("@/superadmin/lib/api/types/student.types").NotificationPreferences;
  label: string;
  description: string;
}

const notifToggles: NotifToggleItem[] = [
  { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
  { key: "push", label: "Push Notifications", description: "Receive push notifications in browser" },
  { key: "riskAlerts", label: "Risk Alerts", description: "Get notified about academic risk changes" },
  { key: "gradeUpdates", label: "Grade Updates", description: "Get notified when grades are posted" },
  { key: "deadlineReminders", label: "Deadline Reminders", description: "Reminders for upcoming deadlines" },
  { key: "jobMatches", label: "Job Matches", description: "Notifications about new job matches" },
  { key: "recommendations", label: "AI Recommendations", description: "New AI-powered recommendations" },
  { key: "appealUpdates", label: "Appeal Updates", description: "Get notified when your appeals are reviewed or resolved" },
  { key: "credentialIssued", label: "Credential Issued", description: "Get notified when new credentials are issued to you" },
  { key: "applicationUpdates", label: "Application Updates", description: "Get notified when your job application status changes" },
];

function NotificationsTab({
  preferences,
}: {
  preferences: import("@/superadmin/lib/api/types/student.types").NotificationPreferences;
}) {
  const updatePrefs = useUpdateNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleToggle = async (key: keyof typeof preferences) => {
    const newValue = !localPrefs[key];
    setLocalPrefs((prev) => ({ ...prev, [key]: newValue }));
    setSavingKey(key);
    try {
      await updatePrefs.mutateAsync({ [key]: newValue });
      setLastSaved(key);
      setTimeout(() => setLastSaved(null), 2000);
    } catch {
      // Revert on error
      setLocalPrefs((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-1">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {notifToggles.map((toggle, index) => (
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
              {savingKey === toggle.key && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {lastSaved === toggle.key && (
                <Check className="h-3.5 w-3.5 text-success" />
              )}
              <button
                onClick={() => handleToggle(toggle.key)}
                disabled={savingKey === toggle.key}
                role="switch"
                aria-checked={localPrefs[toggle.key]}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-2",
                  localPrefs[toggle.key] ? "bg-portal-accent" : "bg-muted",
                  savingKey === toggle.key && "opacity-50"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                    localPrefs[toggle.key] ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Security Tab ===

function DataExportButton() {
  const [requested, setRequested] = useState(false);
  if (requested) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-light px-4 py-2.5 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" />
        Data export requested. You will receive an email when your data is ready.
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setRequested(true)}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
    >
      <Download className="h-4 w-4" />
      Download My Data
    </button>
  );
}

function SecurityTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <FormSection title="Password" description="Manage your account password">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm">
                Your password is managed by your institution&apos;s Single Sign-On (SSO) provider.
                Visit your institution&apos;s identity portal to change it.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Contact your IT department or visit your institution&apos;s SSO portal to update your credentials.
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Privacy & Data" description="Manage your data and privacy settings">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground/80">
              Under GDPR and applicable data protection laws, you have the right to access, export,
              and request deletion of your personal data. Exported data will include your profile,
              academic records, credentials, and activity history.
            </p>
          </div>
          <DataExportButton />
        </div>
      </FormSection>
    </div>
  );
}
