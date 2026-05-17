"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, GraduationCap, Users, LayoutDashboard, Sparkles, Settings } from "lucide-react";
import { useUiStore } from "@/faculty/lib/stores/ui-store";
import { cn } from "@/faculty/lib/utils/cn";
import { useFacultyCourses, useFacultyStudents } from "@/faculty/lib/hooks/use-faculty";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ReactNode;
  group: string;
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/faculty/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, group: "Navigation" },
  { id: "briefings", label: "AI Briefings", href: "/faculty/briefings", icon: <Sparkles className="h-4 w-4" />, group: "Navigation" },
  { id: "students", label: "My Students", href: "/faculty/students", icon: <Users className="h-4 w-4" />, group: "Navigation" },
  { id: "courses", label: "Courses", href: "/faculty/courses", icon: <GraduationCap className="h-4 w-4" />, group: "Navigation" },
  { id: "settings", label: "Settings", href: "/faculty/settings", icon: <Settings className="h-4 w-4" />, group: "Navigation" },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const coursesQuery = useFacultyCourses();
  const studentsQuery = useFacultyStudents({ search: query || undefined, pageSize: 5 });

  const courses = (coursesQuery.data || []) as Array<{ id: string; code: string; name: string }>;
  const students = (studentsQuery.data?.students || []) as Array<{ id: string; name: string; studentId: string }>;

  const courseItems: PaletteItem[] = courses
    .filter((c) => !query || `${c.code} ${c.name}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)
    .map((c) => ({
      id: `course-${c.id}`,
      label: c.name,
      sublabel: c.code,
      href: `/faculty/courses/${c.id}`,
      icon: <GraduationCap className="h-4 w-4" />,
      group: "Courses",
    }));

  const studentItems: PaletteItem[] = students.slice(0, 4).map((s) => ({
    id: `student-${s.id}`,
    label: s.name,
    sublabel: s.studentId,
    href: `/faculty/students/${s.id}`,
    icon: <Users className="h-4 w-4" />,
    group: "Students",
  }));

  const staticItems = query
    ? STATIC_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : STATIC_ITEMS;

  const allItems = [...staticItems, ...courseItems, ...studentItems];

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const navigate = useCallback((item: PaletteItem) => {
    router.push(item.href);
    setCommandPaletteOpen(false);
  }, [router, setCommandPaletteOpen]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && allItems[selected]) navigate(allItems[selected]);
    if (e.key === "Escape") setCommandPaletteOpen(false);
  }

  if (!commandPaletteOpen) return null;

  const groups = [...new Set(allItems.map((i) => i.group))];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-[520px] mx-4 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{ boxShadow: "0 32px 64px -16px rgba(0,0,0,0.35)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search courses, students, pages…"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="rounded border border-border bg-muted px-1.5 py-[2px] font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">No results found</p>
          ) : (
            groups.map((group) => {
              const groupItems = allItems.filter((i) => i.group === group);
              if (groupItems.length === 0) return null;
              const flatIndex = (item: PaletteItem) => allItems.indexOf(item);
              return (
                <div key={group}>
                  <p className="px-4 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group}
                  </p>
                  {groupItems.map((item) => {
                    const idx = flatIndex(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setSelected(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          idx === selected ? "bg-primary-50 text-primary-700" : "text-foreground hover:bg-muted/50",
                        )}
                      >
                        <span className={cn("shrink-0", idx === selected ? "text-primary-600" : "text-muted-foreground")}>
                          {item.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{item.label}</p>
                          {item.sublabel && (
                            <p className="truncate text-[11px] text-muted-foreground">{item.sublabel}</p>
                          )}
                        </div>
                        {idx === selected && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center gap-4 text-[10.5px] text-muted-foreground">
          <span><kbd className="rounded border border-border bg-background px-1 font-mono text-[9px]">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-border bg-background px-1 font-mono text-[9px]">↵</kbd> open</span>
          <span><kbd className="rounded border border-border bg-background px-1 font-mono text-[9px]">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
