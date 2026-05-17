"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, PanelLeftClose, PanelLeft } from "lucide-react";
import { useUiStore } from "@/faculty/lib/stores/ui-store";
import { useAuthStore } from "@/faculty/lib/stores/auth-store";
import { cn } from "@/faculty/lib/utils/cn";
import type { NavSection } from "@/faculty/config/navigation";

interface SidebarProps {
  portalName: string;
  sections: NavSection[];
}

export function Sidebar({ portalName, sections }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { user } = useAuthStore();

  // Pick the single most-specific nav item that matches the current path so
  // a parent link (e.g. /admin/compliance) doesn't also highlight when the
  // user is on a deeper sibling (e.g. /admin/compliance/audit-trail). The
  // longest-prefix match wins; ties are impossible because hrefs are unique.
  const activeHref = (() => {
    const matches = sections
      .flatMap((s) => s.items)
      .map((i) => i.href)
      .filter((href) => pathname === href || pathname.startsWith(href + "/"));
    if (matches.length === 0) return null;
    return matches.reduce((longest, h) => (h.length > longest.length ? h : longest));
  })();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border bg-card transition-[width] duration-200",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Brand block */}
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 px-4",
          sidebarCollapsed && "justify-center px-0",
        )}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background:
              "linear-gradient(135deg, #7B5EE8 0%, #4A3ABA 55%, #302586 100%)",
          }}
        >
          <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.4} />
        </div>
        {!sidebarCollapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <Image
              src="/glimmora-logo.png"
              alt="Glimmora Educore"
              width={110}
              height={24}
              priority
              style={{ height: "22px", width: "auto", display: "block" }}
            />
            <span className="truncate text-[11px] text-muted-foreground">
              {portalName.replace(" Portal", "")}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-border/70" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === activeHref;
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                          sidebarCollapsed && "justify-center px-0",
                          isActive
                            ? "bg-primary-50 text-primary-700"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[17px] w-[17px] shrink-0 transition-colors",
                            isActive
                              ? "text-primary-600"
                              : "text-muted-foreground/70 group-hover:text-foreground",
                          )}
                          strokeWidth={isActive ? 2.2 : 1.9}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer: profile + collapse toggle */}
      <div className="border-t border-border p-3">
        {!sidebarCollapsed && user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #7B5EE8 0%, #4A3ABA 100%)",
              }}
            >
              {user.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight">
                {user.name}
              </p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center gap-2 rounded-lg text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            sidebarCollapsed
              ? "mx-auto h-9 w-9 justify-center"
              : "w-full px-2.5 py-2",
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-3.5 w-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
