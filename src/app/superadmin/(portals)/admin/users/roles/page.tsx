"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react";
import { useRoles, useTogglePermission } from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { cn } from "@/superadmin/lib/utils/cn";
import type { RoleDefinition, Permission } from "@/superadmin/lib/api/types/admin.types";

function PermissionMatrix({
  role,
  permissions,
  userCount,
  roleLabel,
}: {
  role: string;
  permissions: Permission[];
  userCount: number;
  roleLabel: string;
}) {
  const togglePermission = useTogglePermission();
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{
    module: string;
    action: string;
    key: string;
  } | null>(null);

  const handleToggle = useCallback(
    (module: string, action: string) => {
      const key = `${module}:${action}`;
      setPendingToggle({ module, action, key });
    },
    []
  );

  const confirmToggle = useCallback(async () => {
    if (!pendingToggle) return;
    const { module, action, key } = pendingToggle;
    setPendingToggle(null);
    setTogglingKey(key);
    try {
      await togglePermission.mutateAsync({ role, module, action });
    } catch {
      // error is handled by mutation state
    } finally {
      setTogglingKey(null);
    }
  }, [pendingToggle, role, togglePermission]);

  const cancelToggle = useCallback(() => {
    setPendingToggle(null);
  }, []);

  if (permissions.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground">
        No permissions defined for this role.
      </p>
    );
  }

  // Collect all unique actions
  const allActions = Array.from(
    new Set(permissions.flatMap((p) => p.actions.map((a) => a.name)))
  );

  return (
    <div className="overflow-x-auto">
      {pendingToggle && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-warning-light px-4 py-3">
          <p className="text-sm text-foreground">
            This change affects all <span className="font-semibold">{userCount}</span> users with the <span className="font-semibold">{roleLabel}</span> role. Proceed?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelToggle}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={confirmToggle}
              className="rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Module
            </th>
            {allActions.map((action) => (
              <th
                key={action}
                className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((perm) => (
            <tr
              key={perm.module}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-4 py-3 text-sm font-medium">{perm.module}</td>
              {allActions.map((actionName) => {
                const actionDef = perm.actions.find(
                  (a) => a.name === actionName
                );
                const isAllowed = actionDef?.allowed ?? false;
                const toggleKey = `${perm.module}:${actionName}`;
                const isToggling = togglingKey === toggleKey;
                const isPending = pendingToggle?.key === toggleKey;

                return (
                  <td key={actionName} className="px-4 py-3 text-center">
                    {actionDef ? (
                      <button
                        onClick={() => handleToggle(perm.module, actionName)}
                        disabled={isToggling || !!pendingToggle}
                        className={cn(
                          "inline-flex items-center justify-center",
                          isPending && "ring-2 ring-portal-accent ring-offset-1 rounded"
                        )}
                      >
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 transition-colors",
                              isAllowed
                                ? "border-success bg-success"
                                : "border-border bg-background hover:border-muted-foreground"
                            )}
                          >
                            {isAllowed && (
                              <svg
                                className="h-full w-full text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleCard({ role }: { role: RoleDefinition }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-4">
          {expanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{role.label}</h3>
              <StatusBadge variant="default">{role.role}</StatusBadge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {role.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{role.userCount}</span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border">
          <PermissionMatrix
            role={role.role}
            permissions={role.permissions}
            userCount={role.userCount}
            roleLabel={role.label}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminRolesPage() {
  const { data: roles, isLoading, isError, refetch } = useRoles();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Users
        </Link>
        <PageHeader
          icon={Shield}
          title="Roles & Permissions"
          description="Manage role-based access control"
        />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !roles) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Users
        </Link>
        <PageHeader
          icon={Shield}
          title="Roles & Permissions"
          description="Manage role-based access control"
        />
        <ErrorState
          title="Failed to load roles"
          message="Could not retrieve role definitions. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Users
        </Link>
        <PageHeader
          icon={Shield}
          title="Roles & Permissions"
          description="Manage role-based access control across all modules"
        />
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <RoleCard key={role.role} role={role} />
        ))}
      </div>
    </div>
  );
}
