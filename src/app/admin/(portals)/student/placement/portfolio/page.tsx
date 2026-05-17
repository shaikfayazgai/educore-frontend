"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Globe,
  Lock,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { usePortfolio, useAddPortfolioItem, useEditPortfolioItem, useDeletePortfolioItem } from "@/admin/lib/hooks/use-student";
import { PageHeader } from "@/admin/components/shared/misc/page-header";
import { StatusBadge } from "@/admin/components/shared/feedback/status-badge";
import { FormField, FormTextarea, FormSelect } from "@/admin/components/shared/forms/form-field";
import { ConfirmDialog } from "@/admin/components/shared/feedback/confirm-dialog";
import { CardSkeleton } from "@/admin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/admin/components/shared/feedback/error-state";
import { EmptyState } from "@/admin/components/shared/feedback/empty-state";
import { cn } from "@/admin/lib/utils/cn";
import { formatDate } from "@/admin/lib/utils/format";
import type { PortfolioItem } from "@/admin/lib/api/types/student.types";

const portfolioSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["project", "paper", "certification", "award", "other"]),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  skills: z.string(),
  isPublic: z.boolean(),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

const typeOptions = [
  { value: "project", label: "Project" },
  { value: "paper", label: "Paper" },
  { value: "certification", label: "Certification" },
  { value: "award", label: "Award" },
  { value: "other", label: "Other" },
];

export default function StudentPlacementPortfolioPage() {
  const { data: items, isLoading, isError, refetch } = usePortfolio();
  const addMutation = useAddPortfolioItem();
  const editMutation = useEditPortfolioItem();
  const deleteMutation = useDeletePortfolioItem();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PortfolioFormData>({
    defaultValues: {
      title: "",
      description: "",
      type: "project",
      url: "",
      skills: "",
      isPublic: true,
    },
  });

  // When editingItem changes, reset form with item values and open dialog
  useEffect(() => {
    if (editingItem) {
      reset({
        title: editingItem.title,
        description: editingItem.description,
        type: editingItem.type,
        url: editingItem.url || "",
        skills: editingItem.skills.join(", "),
        isPublic: editingItem.isPublic,
      });
      setDialogOpen(true);
    }
  }, [editingItem, reset]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      title: "",
      description: "",
      type: "project",
      url: "",
      skills: "",
      isPublic: true,
    });
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingItem(null);
      reset({
        title: "",
        description: "",
        type: "project",
        url: "",
        skills: "",
        isPublic: true,
      });
    }
    setDialogOpen(open);
  };

  const onSubmit = async (formData: PortfolioFormData) => {
    const payload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      url: formData.url || undefined,
      skills: formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isPublic: formData.isPublic,
    };

    if (editingItem) {
      await editMutation.mutateAsync({
        itemId: editingItem.id,
        data: payload,
      });
    } else {
      await addMutation.mutateAsync(payload);
    }

    reset();
    setEditingItem(null);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const isMutating = addMutation.isPending || editMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/placement"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Placement
        </Link>
        <PageHeader icon={FileText} title="Evidence Portfolio" description="Showcase your work and achievements" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <Link
        href="/student/placement"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Placement
      </Link>

      <PageHeader
        icon={FileText}
        title="Evidence Portfolio"
        description="Showcase your work and achievements"
        actions={
          <Dialog.Root open={dialogOpen} onOpenChange={handleDialogClose}>
            <Dialog.Trigger asChild>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">
                    {editingItem ? "Edit Portfolio Item" : "Add Portfolio Item"}
                  </Dialog.Title>
                  <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  <FormField
                    label="Title"
                    required
                    {...register("title", { required: "Title is required" })}
                    error={errors.title?.message}
                    placeholder="My Awesome Project"
                  />
                  <FormTextarea
                    label="Description"
                    required
                    {...register("description", { required: "Description is required" })}
                    error={errors.description?.message}
                    placeholder="Brief description of the item..."
                  />
                  <FormSelect
                    label="Type"
                    required
                    options={typeOptions}
                    {...register("type")}
                  />
                  <FormField
                    label="URL"
                    {...register("url")}
                    error={errors.url?.message}
                    placeholder="https://..."
                    type="url"
                  />
                  <FormField
                    label="Skills"
                    {...register("skills")}
                    placeholder="React, TypeScript, Python (comma-separated)"
                    hint="Comma-separated list of skills"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      {...register("isPublic")}
                      className="h-4 w-4 rounded border-input text-portal-accent focus:ring-portal-accent"
                    />
                    <label htmlFor="isPublic" className="text-sm font-medium">
                      Make this item public
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={isMutating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
                    >
                      {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {editingItem ? "Save Changes" : "Add Item"}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        }
      />

      {/* Portfolio Grid */}
      {(items ?? []).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No portfolio items"
          description="Add your projects, papers, and achievements to build your portfolio."
          action={{
            label: "Add Item",
            onClick: () => handleOpenAdd(),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge variant="default">{item.type}</StatusBadge>
                  {item.isPublic ? (
                    <Globe className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                    aria-label="Edit item"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-danger-light hover:text-danger group-hover:opacity-100"
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.description}
              </p>
              {item.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.skills.map((s) => (
                    <StatusBadge key={s} variant="muted" size="sm">
                      {s}
                    </StatusBadge>
                  ))}
                </div>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-portal-accent hover:underline"
                >
                  View project <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Added {formatDate(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Portfolio Item"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
