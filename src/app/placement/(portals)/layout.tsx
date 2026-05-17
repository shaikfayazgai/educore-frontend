"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/placement/lib/stores/auth-store";
import { CommandPalette } from "@/placement/components/layout/command-palette";

export default function PortalsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !user) {
      router.replace("/placement/login");
      return;
    }
    if (user.role !== "placement" && user.role !== "admin") {
      router.replace("/placement/login?error=role_not_allowed");
    }
  }, [isInitialized, isAuthenticated, user, router]);

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

  if (!isAuthenticated || !user) return null;

  return (
    <div data-portal="placement">
      {children}
      {/* Global command palette — header search button + Cmd/Ctrl+K open it.
          Mounted at the portal layout level so it's available on every
          placement route without each page re-mounting it. */}
      <CommandPalette />
    </div>
  );
}
