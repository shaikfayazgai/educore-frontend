"use client";

import type { ReactNode } from "react";
import { SuperAdminSidebar } from "./super-admin-sidebar";
import { SuperAdminHeader } from "./super-admin-header";
import { SuperAdminCommandPalette } from "./super-admin-command-palette";
import { useUiStore } from "@/superadmin/lib/stores/ui-store";
import { cn } from "@/superadmin/lib/utils/cn";

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <SuperAdminSidebar />
      </div>
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]",
        )}
      >
        <SuperAdminHeader />
        <main>{children}</main>
      </div>
      <SuperAdminCommandPalette />
    </div>
  );
}
