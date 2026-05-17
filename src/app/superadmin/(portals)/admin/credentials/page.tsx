"use client";

import { useState, useCallback } from "react";
import {
  BadgeCheck,
  Plus,
  Loader2,
  X,
  Ban,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useAdminCredentials,
  useIssueCredential,
  useRevokeCredential,
} from "@/superadmin/lib/hooks/use-admin";
import {
  issueCredentialSchema,
  revokeCredentialSchema,
  type IssueCredentialFormData,
  type RevokeCredentialFormData,
} from "@/superadmin/lib/schemas/admin.schema";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DataTable } from "@/superadmin/components/shared/data-table";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { FormField, FormSelect, FormTextarea } from "@/superadmin/components/shared/forms/form-field";
import { formatDate } from "@/superadmin/lib/utils/format";
import type { AdminCredential } from "@/superadmin/lib/api/types/admin.types";

const TYPE_OPTIONS = [
  { value: "degree", label: "Degree" },
  { value: "certificate", label: "Certificate" },
  { value: "badge", label: "Badge" },
  { value: "transcript", label: "Transcript" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  ...TYPE_OPTIONS,
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
  { value: "pending_verification", label: "Pending Verification" },
];

function getCredentialStatusVariant(
  status: AdminCredential["status"]
): "success" | "danger" | "warning" | "muted" {
  const map = {
    active: "success" as const,
    revoked: "danger" as const,
    expired: "muted" as const,
    pending_verification: "warning" as const,
  };
  return map[status];
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  revoked: "Revoked",
  expired: "Expired",
  pending_verification: "Pending",
};

function IssueCredentialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const issueCredential = useIssueCredential();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueCredentialFormData>({
    resolver: zodResolver(issueCredentialSchema),
    defaultValues: {
      studentId: "",
      title: "",
      type: "degree",
      description: "",
    },
  });

  const onSubmit = useCallback(
    async (data: IssueCredentialFormData) => {
      try {
        await issueCredential.mutateAsync(data);
        setSuccessMsg("Credential issued successfully. The student will be notified and the credential will appear in their digital wallet.");
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 2500);
      } catch {
        // error shown via mutation state
      }
    },
    [issueCredential, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Issue Credential
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Issue a new verifiable credential to a student.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              label="Student ID"
              placeholder="e.g. STU-001"
              error={errors.studentId?.message}
              required
              {...register("studentId")}
            />
            <FormField
              label="Title"
              placeholder="e.g. Bachelor of Science"
              error={errors.title?.message}
              required
              {...register("title")}
            />
            <FormSelect
              label="Type"
              options={TYPE_OPTIONS}
              error={errors.type?.message}
              required
              {...register("type")}
            />
            <FormTextarea
              label="Description"
              placeholder="Describe the credential being issued..."
              error={errors.description?.message}
              required
              {...register("description")}
            />

            {issueCredential.isError && (
              <p className="text-xs text-danger">
                Failed to issue credential. Please try again.
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-success">{successMsg}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={issueCredential.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {issueCredential.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Issue Credential
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RevokeCredentialDialog({
  open,
  onOpenChange,
  credentialId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialId: string;
}) {
  const revokeCredential = useRevokeCredential();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RevokeCredentialFormData>({
    resolver: zodResolver(revokeCredentialSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = useCallback(
    async (data: RevokeCredentialFormData) => {
      try {
        await revokeCredential.mutateAsync({
          id: credentialId,
          reason: data.reason,
        });
        setSuccessMsg("Credential revoked. The student has been notified and the verification status has been updated.");
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 2500);
      } catch {
        // error shown via mutation state
      }
    },
    [credentialId, revokeCredential, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-danger">
              Revoke Credential
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            This action cannot be undone. Please provide a reason for revoking
            this credential.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormTextarea
              label="Reason"
              placeholder="Explain why this credential is being revoked..."
              error={errors.reason?.message}
              required
              {...register("reason")}
            />

            {revokeCredential.isError && (
              <p className="text-xs text-danger">
                Failed to revoke credential. Please try again.
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-success">{successMsg}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={revokeCredential.isPending}
                className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {revokeCredential.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Revoke
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function AdminCredentialsPage() {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    credentialId: string;
  }>({ open: false, credentialId: "" });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAdminCredentials({
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const credentialColumns: ColumnDef<AdminCredential, unknown>[] = [
    { accessorKey: "studentName", header: "Student" },
    {
      accessorKey: "studentId",
      header: "Student ID",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue() as string}</span>
      ),
    },
    { accessorKey: "title", header: "Title" },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => (
        <StatusBadge variant="default">{getValue() as string}</StatusBadge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as AdminCredential["status"];
        return (
          <StatusBadge variant={getCredentialStatusVariant(status)} dot>
            {STATUS_LABELS[status] || status}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "issuedDate",
      header: "Issued",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const cred = row.original;
        if (cred.status !== "active") return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRevokeDialog({ open: true, credentialId: cred.id });
            }}
            className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
          >
            <Ban className="h-3 w-3" />
            Revoke
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BadgeCheck}
        title="Credentials"
        description="Issue, manage, and verify student credentials"
        actions={
          <button
            onClick={() => setIssueDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Issue Credential
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search credentials..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load credentials"
          message="Could not retrieve credential data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={credentialColumns}
            data={data?.credentials ?? []}
            showSearch={false}
            showPagination={false}
            emptyTitle="No credentials found"
            emptyDescription="Try adjusting your search or filters, or issue a new credential."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} (
                {data.meta.total} credentials)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage(Math.min(data.meta.totalPages, page + 1))
                  }
                  disabled={page >= data.meta.totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <IssueCredentialDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
      />
      <RevokeCredentialDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog((prev) => ({ ...prev, open }))}
        credentialId={revokeDialog.credentialId}
      />
    </div>
  );
}
