"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Search,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/superadmin/lib/stores/auth-store";
import { useUiStore } from "@/superadmin/lib/stores/ui-store";
import { PORTALS, type PortalRole } from "@/superadmin/config/portals";
import { cn } from "@/superadmin/lib/utils/cn";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/superadmin/lib/hooks/use-student";
import { formatRelative } from "@/superadmin/lib/utils/format";
import type { Notification } from "@/superadmin/lib/api/types/student.types";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: { label: string; href: string }[] = [];

  // First segment is the portal
  const portalRole = segments[0] as PortalRole;
  const portal = PORTALS[portalRole];
  if (portal) {
    crumbs.push({ label: portal.name, href: `/${portalRole}/dashboard` });
  }

  // Remaining segments
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    // Skip IDs (UUIDs or dynamic segments)
    if (segment.startsWith("[") || segment.match(/^[a-f0-9-]{8,}$/)) continue;

    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const href = "/" + segments.slice(0, i + 1).join("/");
    crumbs.push({ label, href });
  }

  return crumbs;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { setSidebarMobileOpen } = useUiStore();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = getBreadcrumbs(pathname);
  const isStudentPortal = pathname.startsWith("/student");

  const handleLogout = async () => {
    await logout();
    router.push("/superadmin/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden"
          onClick={() => setSidebarMobileOpen(true)}
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {breadcrumbs.map((crumb, i) => (
            <div key={`${crumb.href}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  i === breadcrumbs.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
          onClick={() => useUiStore.getState().setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs md:inline">
            ⌘K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </button>

        {/* Notifications */}
        {isStudentPortal ? (
          <NotificationDropdown />
        ) : (
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
          </button>
        )}

        {/* User menu */}
        <div className="flex items-center gap-3 border-l border-border pl-3 ml-1">
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user?.role}
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-portal-accent text-sm font-medium text-portal-accent-foreground">
            {user?.name?.charAt(0) || "?"}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// === Notification Dropdown (Student Portal Only) ===

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const notificationsQuery = useNotifications({ pageSize: 5 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-xs font-medium text-portal-accent hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    "border-b border-border last:border-b-0"
                  )}
                >
                  {/* Unread indicator */}
                  <div className="mt-1.5 flex-shrink-0">
                    {!notification.read ? (
                      <span className="block h-2 w-2 rounded-full bg-portal-accent" />
                    ) : (
                      <span className="block h-2 w-2" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
                        !notification.read ? "font-semibold" : "font-medium text-muted-foreground"
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/student/dashboard");
                }}
                className="w-full text-center text-xs font-medium text-portal-accent hover:underline"
              >
                View all on dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
