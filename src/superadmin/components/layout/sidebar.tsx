"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useUiStore } from "@/superadmin/lib/stores/ui-store";
import { cn } from "@/superadmin/lib/utils/cn";
import type { NavSection } from "@/superadmin/config/navigation";

interface SidebarProps {
  portalName: string;
  sections: NavSection[];
}

export function Sidebar({ portalName, sections }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-portal-accent">
          <GraduationCap className="h-4.5 w-4.5 text-portal-accent-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <Image
              src="/glimmora-logo.png"
              alt="Glimmora Educore"
              width={110}
              height={24}
              priority
              style={{ height: "22px", width: "auto", display: "block" }}
            />
            <span className="truncate text-xs text-muted-foreground">
              {portalName}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(item.href) &&
                      item.href !== pathname.split("/").slice(0, 3).join("/") + "/dashboard" &&
                      item.href.split("/").length > 3);
                  const isExactActive = pathname === item.href;

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        isExactActive || isActive
                          ? "bg-portal-accent-light text-portal-accent"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
