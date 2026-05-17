"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronDown, User as UserIcon, Settings as SettingsIcon, Search, Menu } from "lucide-react";
import { NotificationBell } from "@/superadmin/components/layout/notification-bell";
import { useAuthStore } from "@/superadmin/lib/stores/auth-store";
import { useUiStore } from "@/superadmin/lib/stores/ui-store";
import { cn } from "@/superadmin/lib/utils/cn";

export function SuperAdminHeader() {
  const { setSidebarMobileOpen } = useUiStore();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/30 bg-background/80 px-8 backdrop-blur-md lg:px-10">
      {/* Left: mobile menu */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => useUiStore.getState().setCommandPaletteOpen(true)}
          aria-label="Open global search"
          className="hidden items-center gap-2 rounded-lg bg-muted/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-3 rounded-lg bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">Ctrl K</kbd>
        </button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);

  const handleLogout = async () => { setOpen(false); await logout(); router.push("/superadmin/login"); };
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 transition-colors",
          open ? "bg-muted" : "hover:bg-muted/60",
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
          {initial}
        </div>
        <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
        <ChevronDown className={cn("hidden h-4 w-4 text-muted-foreground transition-transform sm:block", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg bg-card shadow-2xl ring-1 ring-border/50">
          <div className="px-4 py-4">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="border-t border-border/50 py-1">
            <Link href="/superadmin/settings?tab=profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted">
              <UserIcon className="h-4 w-4 text-muted-foreground" /> Profile
            </Link>
            <Link href="/superadmin/settings?tab=platform" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" /> Settings
            </Link>
          </div>
          <div className="border-t border-border/50 py-1">
            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger-light">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
