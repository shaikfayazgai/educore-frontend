"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useUiStore } from "@/admin/lib/stores/ui-store";
import { cn } from "@/admin/lib/utils/cn";
import type { NavSection } from "@/admin/config/navigation";

interface PortalShellProps {
  portalName: string;
  sections: NavSection[];
  children: ReactNode;
}

export function PortalShell({
  portalName,
  sections,
  children,
}: PortalShellProps) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar portalName={portalName} sections={sections} />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-200",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <Header />
        <main className="px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
