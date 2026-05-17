"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

/**
 * Multi-select dropdown with checkbox rows + optional inline search.
 *
 * Mirrors the UX used by UniBackend admin's offerings filter panel
 * (`admin/courses/_components/drawers.tsx` → CheckboxMultiSelect), so the
 * Faculty portal's filters feel identical to admin's.
 */
export function CheckboxMultiSelect<T extends string>({
  label,
  placeholder,
  options,
  value,
  onChange,
  emptyMessage,
  searchable = true,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  options: { value: T; label: string; hint?: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  emptyMessage?: string;
  /** Hide the in-panel search input for short option lists. */
  searchable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const toggle = (v: T) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, search]);

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((o) => value.includes(o.value));
  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const drop = new Set(filteredOptions.map((o) => o.value));
      onChange(value.filter((v) => !drop.has(v)));
    } else {
      const merged = new Set<T>(value);
      filteredOptions.forEach((o) => merged.add(o.value));
      onChange(Array.from(merged));
    }
  };

  const triggerLabel = useMemo(() => {
    if (value.length === 0) return placeholder;
    const labels = options
      .filter((o) => value.includes(o.value))
      .map((o) => o.label);
    if (labels.length <= 2) return labels.join(", ");
    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
  }, [value, options, placeholder]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium">
        {label}
        {value.length > 0 && (
          <span className="ml-1 rounded-full bg-portal-accent-light px-1.5 py-0.5 text-[10px] font-semibold text-portal-accent">
            {value.length}
          </span>
        )}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title={triggerLabel}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-portal-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={`truncate ${value.length === 0 ? "text-muted-foreground" : ""}`}
        >
          {triggerLabel}
        </span>
        <span className="ml-1 shrink-0 text-muted-foreground">▾</span>
      </button>

      {open && !disabled && (
        <div
          className="absolute left-0 z-30 mt-1 w-full min-w-full max-w-[26rem] overflow-hidden rounded-md border border-border bg-card shadow-lg"
          style={{ width: "max(100%, 22rem)" }}
        >
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs italic text-muted-foreground">
              {emptyMessage || "No options"}
            </p>
          ) : (
            <>
              {searchable && options.length > 4 && (
                <div className="relative border-b border-border bg-background">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="flex h-9 w-full bg-transparent pl-7 pr-2 text-xs focus:outline-none"
                  />
                </div>
              )}
              <div className="max-h-72 overflow-y-auto">
                <button
                  type="button"
                  onClick={toggleAllFiltered}
                  className="flex w-full items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={allFilteredSelected}
                    className="h-3 w-3 accent-portal-accent"
                  />
                  {allFilteredSelected ? "Clear selection" : "Select all"}
                  <span className="ml-auto font-normal">
                    {filteredOptions.length} options
                  </span>
                </button>
                {filteredOptions.length === 0 ? (
                  <p className="px-3 py-3 text-xs italic text-muted-foreground">
                    No matches.
                  </p>
                ) : (
                  filteredOptions.map((o) => {
                    const checked = value.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(o.value)}
                          className="h-3.5 w-3.5 accent-portal-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{o.label}</p>
                          {o.hint && (
                            <p className="truncate text-[10px] text-muted-foreground">
                              {o.hint}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
