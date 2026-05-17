"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Loader2, Plus, X } from "lucide-react";
import { useResearchProfile, useUpdateResearchProfile } from "@/superadmin/lib/hooks/use-research";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { FormSection } from "@/superadmin/components/shared/forms/form-section";
import { FormField, FormTextarea } from "@/superadmin/components/shared/forms/form-field";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-portal-accent-light px-2.5 py-1 text-xs font-medium text-portal-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="hover:text-danger disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={disabled || !inputValue.trim()}
          className="flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

function SocialLinksEditor({
  links,
  onChange,
  disabled,
}: {
  links: { platform: string; url: string }[];
  onChange: (links: { platform: string; url: string }[]) => void;
  disabled?: boolean;
}) {
  const addLink = () => {
    onChange([...links, { platform: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const updateLink = (
    index: number,
    field: "platform" | "url",
    value: string
  ) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none">Social Links</label>
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={link.platform}
            onChange={(e) => updateLink(i, "platform", e.target.value)}
            placeholder="Platform (e.g. Twitter)"
            disabled={disabled}
            className={cn(
              "flex h-10 w-36 rounded-lg border border-input bg-background px-3 text-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <input
            type="url"
            value={link.url}
            onChange={(e) => updateLink(i, "url", e.target.value)}
            placeholder="https://..."
            disabled={disabled}
            className={cn(
              "flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <button
            type="button"
            onClick={() => removeLink(i)}
            disabled={disabled}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-danger disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLink}
        disabled={disabled}
        className="flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Social Link
      </button>
    </div>
  );
}

export default function ResearchSettingsPage() {
  const { data: profile, isLoading, isError, refetch } = useResearchProfile();
  const updateProfile = useUpdateResearchProfile();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    institution: "",
    department: "",
    researchInterests: [] as string[],
    expertise: [] as string[],
    orcid: "",
    googleScholar: "",
    socialLinks: [] as { platform: string; url: string }[],
  });
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        institution: profile.institution || "",
        department: profile.department || "",
        researchInterests: profile.researchInterests || [],
        expertise: profile.expertise || [],
        orcid: profile.orcid || "",
        googleScholar: profile.googleScholar || "",
        socialLinks: profile.socialLinks || [],
      });
      setIsDirty(false);
    }
  }, [profile]);

  const updateField = useCallback(
    (field: string, value: string | string[] | { platform: string; url: string }[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        researchInterests: formData.researchInterests,
        expertise: formData.expertise,
        orcid: formData.orcid || undefined,
        googleScholar: formData.googleScholar || undefined,
        socialLinks: formData.socialLinks.filter((l) => l.platform && l.url),
      });
      setFeedback({ type: "success", message: "Profile saved successfully." });
      setIsDirty(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to save profile. Please try again.",
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
          description="Profile and research interests"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title="Settings"
          description="Profile and research interests"
        />
        <ErrorState
          title="Failed to load profile"
          message="Could not retrieve your research profile. Please try again."
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
        description="Profile and research interests"
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

      {/* Profile Form */}
      <div className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Basic Information"
            description="Your personal and institutional details"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                disabled={updateProfile.isPending}
              />
              <FormField
                label="Phone"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Optional"
                disabled={updateProfile.isPending}
              />
              <FormField
                label="Institution"
                value={formData.institution}
                readOnly
                disabled
                hint="Contact admin to change"
              />
              <FormField
                label="Department"
                value={formData.department}
                readOnly
                disabled
                hint="Contact admin to change"
              />
            </div>
            <FormTextarea
              label="Bio"
              value={formData.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Brief description of your research focus..."
              disabled={updateProfile.isPending}
              rows={3}
            />
          </FormSection>
        </div>

        {/* Research Interests & Expertise */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Research Focus"
            description="Your areas of interest and expertise"
          >
            <TagInput
              label="Research Interests"
              tags={formData.researchInterests}
              onChange={(tags) => updateField("researchInterests", tags)}
              placeholder="Add a research interest..."
              disabled={updateProfile.isPending}
            />
            <TagInput
              label="Expertise"
              tags={formData.expertise}
              onChange={(tags) => updateField("expertise", tags)}
              placeholder="Add an expertise area..."
              disabled={updateProfile.isPending}
            />
          </FormSection>
        </div>

        {/* Academic Profiles */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Academic Profiles"
            description="Link your external research identifiers"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="ORCID"
                value={formData.orcid}
                onChange={(e) => updateField("orcid", e.target.value)}
                placeholder="0000-0000-0000-0000"
                disabled={updateProfile.isPending}
              />
              <FormField
                label="Google Scholar"
                value={formData.googleScholar}
                onChange={(e) => updateField("googleScholar", e.target.value)}
                placeholder="Google Scholar profile URL or ID"
                disabled={updateProfile.isPending}
              />
            </div>
          </FormSection>
        </div>

        {/* Social Links */}
        <div className="rounded-xl border border-border bg-card p-6">
          <FormSection
            title="Social Links"
            description="Add links to your professional profiles"
          >
            <SocialLinksEditor
              links={formData.socialLinks}
              onChange={(links) => updateField("socialLinks", links)}
              disabled={updateProfile.isPending}
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
            disabled={updateProfile.isPending || !isDirty}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
