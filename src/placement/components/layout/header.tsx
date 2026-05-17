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
import { useAuthStore } from "@/placement/lib/stores/auth-store";
import { useUiStore } from "@/placement/lib/stores/ui-store";
import { cn } from "@/placement/lib/utils/cn";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const crumbs: { label: string; href: string }[] = [
    { label: "Placement Portal", href: "/placement/dashboard" },
  ];
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    if (
      segment.startsWith("[") ||
      segment.match(/^[a-f0-9-]{8,}$/) ||
      segment.match(/^(emp|run|match|pipe|usr)_/)
    )
      continue;
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

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-5 backdrop-blur-md lg:px-8">
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
                <span className="font-semibold text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

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

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-[17px] w-[17px] rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[17px] w-[17px] rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-[17px] w-[17px]" />
        </button>

        <div className="mx-1 h-5 w-px bg-border" />

        <UserMenu />
      </div>
    </header>
  );
}

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
    router.push("/placement/login");
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors",
          isOpen ? "bg-muted" : "hover:bg-muted/60"
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
            isOpen && "rotate-180"
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
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-col py-1">
            <MenuLink
              href="/placement/settings"
              icon={UserIcon}
              label="Profile"
              onClick={() => setIsOpen(false)}
            />
            <MenuLink
              href="/placement/settings"
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
