"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X } from "lucide-react";
import { useUiStore } from "@/admin/lib/stores/ui-store";
import { useAuthStore } from "@/admin/lib/stores/auth-store";
import { PORTAL_NAVIGATION } from "@/admin/config/navigation";
import { cn } from "@/admin/lib/utils/cn";

/**
 * Global command palette. The header's search button (and Cmd+K / Ctrl+K)
 * sets `commandPaletteOpen` in the ui store; this component renders the
 * actual UI. Items are sourced from the role's PORTAL_NAVIGATION so it
 * always reflects what's actually navigable from the sidebar.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const role = useAuthStore((s) => s.user?.role);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K toggle, Esc close — bound globally.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandPaletteOpen);
      } else if (e.key === "Escape" && useUiStore.getState().commandPaletteOpen) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Focus the input after the modal mounts.
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const sections = useMemo(() => {
    if (!role) return [];
    return PORTAL_NAVIGATION[role] || [];
  }, [role]);

  // Sub-options the palette should know about — tabs, sub-pages, settings
  // panels — keyed by parent href. These are static because Next.js routes
  // are static; we re-index when nav config changes. Sub-options open the
  // parent route but with a deep-link param so the page can scroll/select
  // the right tab (?tab=catalog, ?tab=offerings, ?section=support, etc.).
  const SUB_OPTIONS: Record<string, { label: string; suffix?: string; keywords?: string[] }[]> = {
    "/admin/courses": [
      { label: "Course Catalog", suffix: "?tab=catalog", keywords: ["master", "design", "syllabus"] },
      { label: "Section Offerings", suffix: "?tab=offerings", keywords: ["term", "section", "schedule"] },
    ],
    "/admin/users": [
      { label: "Onboarded users", suffix: "?onboarded=true", keywords: ["welcomed", "active"] },
      { label: "Not onboarded users", suffix: "?onboarded=false", keywords: ["pending", "invitation"] },
      { label: "Bulk import users", suffix: "?action=import", keywords: ["csv", "upload"] },
      { label: "Send onboarding emails", suffix: "?action=onboarding", keywords: ["credentials", "welcome", "email"] },
    ],
    "/admin/programs": [
      { label: "Active programs", suffix: "?status=active" },
      { label: "Inactive programs", suffix: "?status=inactive" },
      { label: "Create new program", suffix: "?action=create" },
    ],
    "/admin/compliance": [
      { label: "Audit Trail", suffix: "/audit-trail", keywords: ["log", "history"] },
    ],
    "/admin/settings": [
      { label: "University information", suffix: "?section=institution", keywords: ["name", "domain"] },
      { label: "Support contact (lockout)", suffix: "?section=support-contact", keywords: ["help", "phone"] },
      { label: "Theme & appearance", suffix: "?section=appearance", keywords: ["dark", "light"] },
      { label: "Notifications", suffix: "?section=notifications", keywords: ["alerts", "email"] },
    ],
    "/admin/semesters": [
      { label: "Academic years", suffix: "?tab=years" },
      { label: "Active semesters", suffix: "?tab=semesters" },
    ],
    "/admin/reports": [
      { label: "Compliance reports", suffix: "?category=compliance" },
      { label: "Enrollment reports", suffix: "?category=enrollment" },
      { label: "Financial reports", suffix: "?category=financial" },
    ],
  };

  // Flat list of all searchable items for the role (top-level nav + each
  // sub-option for filtering across deep destinations). Sub-options inherit
  // the parent icon so result rows look consistent.
  const items = useMemo(() => {
    const all: {
      sectionLabel: string;
      label: string;
      href: string;
      keywords: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];
    for (const sec of sections) {
      for (const item of sec.items) {
        all.push({
          sectionLabel: sec.label,
          label: item.label,
          href: item.href,
          keywords: "",
          icon: item.icon,
        });
        // Append every registered sub-option as its own searchable row.
        const subs = SUB_OPTIONS[item.href] || [];
        for (const sub of subs) {
          const suffix = sub.suffix || "";
          const href = suffix.startsWith("/")
            ? `${item.href}${suffix}`
            : `${item.href}${suffix}`;
          all.push({
            sectionLabel: item.label,
            label: sub.label,
            href,
            keywords: (sub.keywords || []).join(" "),
            icon: item.icon,
          });
        }
      }
    }
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((i) =>
      i.label.toLowerCase().includes(q) ||
      i.sectionLabel.toLowerCase().includes(q) ||
      i.href.toLowerCase().includes(q) ||
      i.keywords.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, query]);

  // Reset active row when filtered list changes.
  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and quick navigation"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="mt-[12vh] w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(items.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const target = items[active];
                if (target) go(target.href);
              }
            }}
            placeholder="Search pages, settings, users…"
            className="flex h-12 w-full bg-transparent px-1 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-[1px] font-mono text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-1">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No matches for <span className="font-medium text-foreground">"{query}"</span>
            </div>
          ) : (
            (() => {
              // Render items grouped by section, but keep a flat active index.
              const grouped: Record<string, typeof items> = {};
              const order: string[] = [];
              items.forEach((it) => {
                if (!grouped[it.sectionLabel]) {
                  grouped[it.sectionLabel] = [];
                  order.push(it.sectionLabel);
                }
                grouped[it.sectionLabel].push(it);
              });
              let runningIdx = 0;
              return order.map((sectionLabel) => (
                <div key={sectionLabel} className="px-1 pb-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {sectionLabel}
                  </p>
                  {grouped[sectionLabel].map((it) => {
                    const idx = runningIdx++;
                    const isActive = idx === active;
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.href}
                        type="button"
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(it.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate text-foreground">{it.label}</span>
                        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">{it.href}</span>
                        {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="mr-1 rounded border border-border bg-background px-1 font-mono">↑↓</kbd>
            navigate
            <kbd className="mx-1 ml-2 rounded border border-border bg-background px-1 font-mono">⏎</kbd>
            select
          </span>
          <span>
            <kbd className="rounded border border-border bg-background px-1 font-mono">⌘K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
