"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Plus, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import { useAdminUsers, useCreateUser } from "@/superadmin/lib/hooks/use-admin";
import {
  createUserSchema,
  type CreateUserFormData,
} from "@/superadmin/lib/schemas/admin.schema";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DataTable } from "@/superadmin/components/shared/data-table";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { SearchInput } from "@/superadmin/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/superadmin/components/shared/forms/form-field";
import { formatDate, formatRelative } from "@/superadmin/lib/utils/format";
import type { AdminUser } from "@/superadmin/lib/api/types/admin.types";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "research", label: "Research" },
  { value: "placement", label: "Placement" },
  { value: "ministry", label: "Ministry" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  ...ROLE_OPTIONS,
];

function getStatusVariant(
  status: "active" | "inactive" | "suspended"
): "success" | "muted" | "danger" {
  const map = { active: "success" as const, inactive: "muted" as const, suspended: "danger" as const };
  return map[status];
}

const userColumns: ColumnDef<AdminUser, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => (
      <StatusBadge variant="default">{getValue() as string}</StatusBadge>
    ),
  },
  { accessorKey: "department", header: "Department" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as AdminUser["status"];
      return (
        <StatusBadge variant={getStatusVariant(status)} dot>
          {status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      return (
        <span className="text-xs text-muted-foreground">
          {val ? formatRelative(val) : "Never"}
        </span>
      );
    },
  },
];

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", name: "", role: "student", department: "" },
  });

  const onSubmit = useCallback(
    async (data: CreateUserFormData) => {
      try {
        const email = data.email;
        await createUser.mutateAsync(data);
        setSuccessMsg(`User created successfully. An activation email has been sent to ${email}.`);
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 1500);
      } catch {
        // error shown via mutation state
      }
    },
    [createUser, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Create User
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Add a new user to the institution.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              label="Email"
              type="email"
              placeholder="user@institution.edu"
              error={errors.email?.message}
              required
              {...register("email")}
            />
            <FormField
              label="Name"
              placeholder="Full name"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <FormSelect
              label="Role"
              options={ROLE_OPTIONS}
              error={errors.role?.message}
              required
              {...register("role")}
            />
            <FormField
              label="Department"
              placeholder="e.g. Computer Science"
              error={errors.department?.message}
              required
              {...register("department")}
            />

            {createUser.isError && (
              <p className="text-xs text-danger">
                Failed to create user. Please check the details and try again.
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
                disabled={createUser.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {createUser.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create User
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRowClick = useCallback(
    (user: AdminUser) => {
      router.push(`/admin/users/${user.id}`);
    },
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        title="Users"
        description="Manage users, roles, and access across the institution"
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search users..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
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
          {STATUS_OPTIONS.map((opt) => (
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
          title="Failed to load users"
          message="Could not retrieve user data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={userColumns}
            data={data?.users ?? []}
            showSearch={false}
            showPagination={false}
            onRowClick={handleRowClick}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your search or filters, or create a new user."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} users)
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
                  onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
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

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
