"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, PanelLeftClose, PanelLeft } from "lucide-react";
import { useUiStore } from "@/admin/lib/stores/ui-store";
import { cn } from "@/admin/lib/utils/cn";
import { PORTAL_NAVIGATION } from "@/admin/config/navigation";

const sections = PORTAL_NAVIGATION.super_admin;

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col bg-background transition-[width] duration-300",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]",
      )}
      style={{ boxShadow: "inset -1px 0 0 var(--border)" }}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 px-6 py-6",
          sidebarCollapsed && "justify-center px-0 py-5",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-base font-bold tracking-tight text-foreground">Glimmora</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section, si) => (
          <div key={section.label} className={cn(si > 0 && "mt-8")}>
            {!sidebarCollapsed && (
              <p className="mb-3 px-4 text-xs font-medium tracking-wide text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname.startsWith(item.href + "/") && !item.href.endsWith("/dashboard"));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200",
                      sidebarCollapsed && "justify-center rounded-lg px-0 py-2.5",
                      isActive
                        ? "bg-primary-100/80 font-semibold text-primary-800"
                        : "text-muted-foreground hover:bg-primary-50/60 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-primary-600" : "group-hover:text-primary-500",
                      )}
                      strokeWidth={isActive ? 2.2 : 1.7}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse */}
      <div className="shrink-0 px-3 pb-4">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
            sidebarCollapsed && "justify-center px-0",
          )}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
