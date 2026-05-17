"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bug, X, LogIn } from "lucide-react";
import { useAuthStore } from "@/admin/lib/stores/auth-store";
import { PORTALS, PORTAL_ROLES, type PortalRole } from "@/admin/config/portals";
import { cn } from "@/admin/lib/utils/cn";

const DEV_ACCOUNTS: Record<PortalRole, { email: string; password: string; name: string }> = {
  student: { email: "student@glimmora.dev", password: "glimmora123", name: "Alex Rivera" },
  faculty: { email: "faculty@glimmora.dev", password: "glimmora123", name: "Dr. Sarah Chen" },
  admin: { email: "admin@glimmora.dev", password: "glimmora123", name: "James Mitchell" },
  placement: { email: "placement@glimmora.dev", password: "glimmora123", name: "Maria Santos" },
  super_admin: { email: "superadmin@glimmora.dev", password: "glimmora123", name: "Platform Admin" },
};

export function DevRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<PortalRole | null>(null);
  const router = useRouter();
  const { user, login, logout } = useAuthStore();

  if (process.env.NEXT_PUBLIC_MSW_ENABLED !== "true") return null;

  const handleSwitch = async (role: PortalRole) => {
    if (user?.role === role) return;
    setSwitching(role);
    try {
      await logout();
      const account = DEV_ACCOUNTS[role];
      await login({ email: account.email, password: account.password });
      router.push(`${PORTALS[role].basePath}/dashboard`);
    } catch {
      // Error handled by store
    } finally {
      setSwitching(null);
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-64 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Switch Role
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-2">
            {PORTAL_ROLES.map((role) => {
              const portal = PORTALS[role];
              const Icon = portal.icon;
              const isActive = user?.role === role;
              const isSwitching = switching === role;

              return (
                <button
                  key={role}
                  onClick={() => handleSwitch(role)}
                  disabled={isActive || !!switching}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-portal-accent-light text-portal-accent font-medium"
                      : "text-foreground hover:bg-muted",
                    "disabled:opacity-50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{portal.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {DEV_ACCOUNTS[role].name}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-xs font-medium text-portal-accent">Active</span>
                  )}
                  {isSwitching && (
                    <LogIn className="h-3.5 w-3.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110"
          title="Dev Role Switcher"
        >
          <Bug className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}
