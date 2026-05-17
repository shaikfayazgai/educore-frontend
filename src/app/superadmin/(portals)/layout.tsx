"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/superadmin/lib/stores/auth-store";
import { PORTALS, getPortalFromPath } from "@/superadmin/config/portals";

const SESSION_RECHECK_INTERVAL_MS = 30_000;

export default function PortalsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    isInitialized,
    user,
    initialize,
    validateSession,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    let validating = false;
    const recheckSession = () => {
      if (validating) return;
      validating = true;
      void validateSession().finally(() => {
        validating = false;
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) recheckSession();
    };

    window.addEventListener("focus", recheckSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(recheckSession, SESSION_RECHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", recheckSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isInitialized, isAuthenticated, validateSession]);

  useEffect(() => {
    if (!isInitialized) return;

    // Not authenticated — redirect to login
    if (!isAuthenticated || !user) {
      router.replace("/superadmin/login");
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

  return <div data-portal={portalRole}>{children}</div>;
}
