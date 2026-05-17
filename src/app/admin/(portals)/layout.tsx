"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/admin/lib/stores/auth-store";
import { api } from "@/admin/lib/api/client";
import { PORTALS, getPortalFromPath, type PortalRole } from "@/admin/config/portals";
import { CommandPalette } from "@/admin/components/layout/command-palette";

const SESSION_HEARTBEAT_MS = 20_000;

export default function PortalsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Session heartbeat — pings /api/auth/me every 20s. If the tenant gets
  // suspended/inactive while the user sits idle on a page, the 403 fires
  // the global redirect in api/client.ts and the user lands on
  // /account-suspended without needing to manually refresh.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const tick = () => { api.get("/api/auth/me").catch(() => { /* handled by client.ts */ }); };
    const id = window.setInterval(tick, SESSION_HEARTBEAT_MS);
    // Also check once when the tab regains focus — covers the "user came back
    // to a stale tab" case immediately rather than waiting up to 20s.
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isInitialized) return;

    // Not authenticated — redirect to login
    if (!isAuthenticated || !user) {
      router.replace("/admin/login");
      return;
    }

    // Newly-provisioned account holding a temp password → force change.
    // Applies to every role (admin, faculty, student, placement, research).
    if (user.mustChangePassword) {
      router.replace("/admin/change-password");
      return;
    }

    // Check if user is accessing the correct portal
    const currentPortal = getPortalFromPath(pathname);
    if (currentPortal && currentPortal !== user.role) {
      // Redirect to their own portal
      const correctPortal = PORTALS[user.role];
      router.replace(`${correctPortal.basePath}/dashboard`);
    }
  }, [isInitialized, isAuthenticated, user, pathname, router]);

  // Loading state while initializing auth
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Set portal data attribute for accent colors
  const portalRole = getPortalFromPath(pathname) || user.role;

  return (
    <div data-portal={portalRole}>
      {children}
      <CommandPalette />
    </div>
  );
}
