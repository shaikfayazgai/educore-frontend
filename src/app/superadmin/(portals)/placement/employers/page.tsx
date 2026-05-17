"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  usePlacementEmployers,
  useCreateEmployer,
} from "@/superadmin/lib/hooks/use-placement";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { DataTable } from "@/superadmin/components/shared/data-table/data-table";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { formatNumber } from "@/superadmin/lib/utils/format";
import { cn } from "@/superadmin/lib/utils/cn";
import type { ColumnDef } from "@tanstack/react-table";
import type { Employer } from "@/superadmin/lib/api/types/placement.types";

const INDUSTRIES = [
  { value: "", label: "All Industries" },
  { value: "Technology", label: "Technology" },
  { value: "Finance", label: "Finance" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Education", label: "Education" },
  { value: "Consulting", label: "Consulting" },
  { value: "Retail", label: "Retail" },
];

function getSizeVariant(size: string) {
  const map: Record<string, "default" | "info" | "warning" | "success" | "muted"> = {
    startup: "warning",
    small: "muted",
    medium: "info",
    large: "default",
    enterprise: "success",
  };
  return map[size] || "muted";
}

export default function PlacementEmployersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data, isLoading, isError, refetch } = usePlacementEmployers({
    search: search || undefined,
    industry: industry || undefined,
    pageSize: 50,
  });

  const createEmployer = useCreateEmployer();

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const employers = data?.employers ?? [];

  // Form state for new employer
  const [form, setForm] = useState({
    name: "",
    industry: "",
    size: "medium" as Employer["size"],
    contactName: "",
    contactEmail: "",
    website: "",
    description: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      industry: "",
      size: "medium",
      contactName: "",
      contactEmail: "",
      website: "",
      description: "",
    });
  };

  const handleCreateEmployer = async () => {
    if (!form.name || !form.industry || !form.contactEmail) return;
    try {
      await createEmployer.mutateAsync(form);
      setFormFeedback({
        type: "success",
        message: `${form.name} has been added successfully.`,
      });
      setDialogOpen(false);
      resetForm();
      setTimeout(() => setFormFeedback(null), 4000);
    } catch {
      setFormFeedback({
        type: "error",
        message: "Failed to add employer. Please try again.",
      });
      setTimeout(() => setFormFeedback(null), 5000);
    }
  };

  const columns: ColumnDef<Employer, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Employer",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.industry}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => (
          <StatusBadge variant={getSizeVariant(row.original.size)}>
            {row.original.size}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "activeJobPostings",
        header: "Active Postings",
        cell: ({ row }) => (
          <span className="text-sm font-semibold">
            {row.original.activeJobPostings}
          </span>
        ),
      },
      {
        accessorKey: "totalHires",
        header: "Total Hires",
        cell: ({ row }) => (
          <span className="text-sm">
            {formatNumber(row.original.totalHires)}
          </span>
        ),
      },
      {
        accessorKey: "engagementScore",
        header: "Engagement",
        cell: ({ row }) => {
          const score = row.original.engagementScore;
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    score >= 80
                      ? "bg-success"
                      : score >= 50
                        ? "bg-warning"
                        : "bg-danger"
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-medium">{score}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "contactEmail",
        header: "Contact",
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{row.original.contactName}</p>
            <a
              href={`mailto:${row.original.contactEmail}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-portal-accent hover:underline"
            >
              {row.original.contactEmail}
            </a>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Employers"
        description="Employer directory and engagement tracking"
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Add Employer
          </button>
        }
      />

      {/* Feedback Banner */}
      {formFeedback && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            formFeedback.type === "success"
              ? "bg-success-light text-success"
              : "bg-danger-light text-danger"
          )}
        >
          {formFeedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search employers..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {INDUSTRIES.map((ind) => (
            <option key={ind.value} value={ind.value}>
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load employers"
          message="Could not retrieve employer data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={employers}
          showSearch={false}
          emptyTitle="No employers found"
          emptyDescription="Try adjusting your search or add a new employer."
          onRowClick={(row) =>
            router.push(`/placement/employers/${row.id}`)
          }
        />
      )}

      {/* Add Employer Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Add Employer
              </Dialog.Title>
              <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Enter the employer details below.
            </Dialog.Description>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Company Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Industry <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, industry: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                    placeholder="e.g. Technology"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Size</label>
                  <select
                    value={form.size}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        size: e.target.value as Employer["size"],
                      }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                  >
                    <option value="startup">Startup</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, website: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Name</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, contactName: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                    placeholder="Contact person"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Contact Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        contactEmail: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                  placeholder="Brief company description..."
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </Dialog.Close>
              <button
                onClick={handleCreateEmployer}
                disabled={
                  createEmployer.isPending ||
                  !form.name ||
                  !form.industry ||
                  !form.contactEmail
                }
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {createEmployer.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Add Employer
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
