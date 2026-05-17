"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  LogOut,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  User as UserIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/student/lib/stores/auth-store";
import { useUiStore } from "@/student/lib/stores/ui-store";
import { PORTALS, getPortalFromPath, type PortalRole } from "@/student/config/portals";
import { cn } from "@/student/lib/utils/cn";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/student/lib/hooks/use-student";
import { formatRelative } from "@/student/lib/utils/format";
import type { Notification } from "@/student/lib/api/types/student.types";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: { label: string; href: string }[] = [];
  // Match portal from path (handles hyphenated paths like "super-admin")
  const portalRole = getPortalFromPath("/" + segments.join("/"));
  const portal = portalRole ? PORTALS[portalRole] : null;
  if (portal && portalRole) {
    crumbs.push({ label: portal.name, href: `${portal.basePath}/dashboard` });
  }

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    // Skip dynamic route segments (IDs like univ_02, ministry_01, crs_xxx, usr_xxx, UUIDs)
    if (
      segment.startsWith("[") ||
      segment.match(/^[a-f0-9-]{8,}$/) ||
      segment.match(/^(univ|ministry|crs|usr|sem|mod|asn|sub|sess)_/)
    ) continue;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const href = "/" + segments.slice(0, i + 1).join("/");
    crumbs.push({ label, href });
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const { setSidebarMobileOpen } = useUiStore();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = getBreadcrumbs(pathname);
  const isStudentPortal = pathname.startsWith("/student");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-5 backdrop-blur-md lg:px-8">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          onClick={() => setSidebarMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden items-center gap-1.5 text-[13px] sm:flex">
          {breadcrumbs.map((crumb, i) => (
            <div key={`${crumb.href}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              {i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center: search */}
      <div className="flex flex-1 justify-center">
        <button
          onClick={() => useUiStore.getState().setCommandPaletteOpen(true)}
          className="group flex h-9 w-full max-w-[380px] items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 text-[12.5px] text-muted-foreground transition-all hover:border-primary-300 hover:bg-muted/80"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-[1px] font-mono text-[10px] font-medium text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-[17px] w-[17px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[17px] w-[17px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </button>

        {isStudentPortal ? (
          <NotificationDropdown />
        ) : (
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Bell className="h-[17px] w-[17px]" />
          </button>
        )}

        <div className="mx-1 h-5 w-px bg-border" />

        <UserMenu />
      </div>
    </header>
  );
}

// ==========================================================================
// User menu — avatar chip + dropdown
// ==========================================================================

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!isOpen) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/student/login");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors",
          isOpen ? "bg-muted" : "hover:bg-muted/60",
        )}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #7B5EE8 0%, #4A3ABA 100%)",
          }}
        >
          {initial}
        </div>
        <div className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="truncate text-[12.5px] font-semibold leading-tight">
            {user?.name}
          </span>
          <span className="truncate text-[10.5px] leading-tight text-muted-foreground">
            {user?.role?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "hidden h-3 w-3 text-muted-foreground transition-transform sm:block",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card"
          style={{ boxShadow: "0 14px 32px -12px rgba(15, 23, 42, 0.18)" }}
        >
          <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #7B5EE8 0%, #4A3ABA 100%)",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user?.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col py-1">
            <MenuLink
              href={`${user?.role ? PORTALS[user.role].basePath : ""}/settings`}
              icon={UserIcon}
              label="Profile"
              onClick={() => setIsOpen(false)}
            />
            <MenuLink
              href={`${user?.role ? PORTALS[user.role].basePath : ""}/settings`}
              icon={SettingsIcon}
              label="Settings"
              onClick={() => setIsOpen(false)}
            />
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12.5px] font-medium text-danger transition-colors hover:bg-danger-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof UserIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </Link>
  );
}

// ==========================================================================
// Notification dropdown
// ==========================================================================

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const notificationsQuery = useNotifications({ pageSize: 5 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

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

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.linkUrl) router.push(notification.linkUrl);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[17px] w-[17px]" />
        {unreadCount > 0 && (
          <span
            className="absolute right-1.5 top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ring-2 ring-card"
            style={{
              background: "linear-gradient(135deg, #E05A35 0%, #C04628 100%)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-border bg-card"
          style={{ boxShadow: "0 14px 32px -12px rgba(15, 23, 42, 0.18)" }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div>
              <h3 className="text-[13px] font-semibold">Notifications</h3>
              <p className="text-[10.5px] text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-[12px] text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50",
                    !notification.read && "bg-primary-50/40",
                  )}
                >
                  <div className="mt-1 flex-shrink-0">
                    {!notification.read ? (
                      <span className="block h-1.5 w-1.5 rounded-full bg-primary-500" />
                    ) : (
                      <span className="block h-1.5 w-1.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[12.5px] leading-snug",
                        !notification.read
                          ? "font-semibold text-foreground"
                          : "font-medium text-muted-foreground",
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border bg-muted/20 px-4 py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/student/dashboard");
                }}
                className="w-full text-center text-[11.5px] font-semibold text-primary-600 hover:underline"
              >
                View all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
