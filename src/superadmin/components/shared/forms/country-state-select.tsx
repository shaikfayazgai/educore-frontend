"use client";

import { useEffect, useMemo, useState } from "react";
import { Country, State } from "country-state-city";
import { ChevronDown, Search } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

import { cn } from "@/superadmin/lib/utils/cn";

interface BaseProps {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

interface CountrySelectProps extends BaseProps {
  /** Country name selected (e.g. "India"). */
  value?: string;
  onChange: (countryName: string, isoCode: string, dialCode: string) => void;
}

/** Searchable country dropdown — uses country-state-city dataset. */
export function CountrySelect({
  label, value, onChange, required, error, disabled, placeholder = "Select country",
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q) ||
        (c.phonecode || "").includes(q)
    );
  }, [search, countries]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border bg-card px-3 text-left text-sm shadow-sm",
              "transition-colors hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300",
              error ? "border-danger" : "border-border/60",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span className={value ? "" : "text-muted-foreground"}>
              {value || placeholder}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden rounded-lg bg-card shadow-2xl ring-1 ring-border/30"
          >
            <div className="border-b border-border/30 px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-md bg-muted/30 pl-8 pr-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No countries match
                </p>
              ) : (
                filtered.map((c) => {
                  // dial code is captured for the phone-input prefix, but not shown in the country list.
                  const dial = c.phonecode ? `+${c.phonecode.replace(/^\+/, "")}` : "";
                  return (
                    <button
                      key={c.isoCode}
                      type="button"
                      onClick={() => {
                        onChange(c.name, c.isoCode, dial);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        value === c.name && "bg-primary-50/60",
                      )}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface StateSelectProps extends BaseProps {
  /** Country name (used to look up ISO code internally). */
  countryName?: string;
  value?: string;
  onChange: (stateName: string) => void;
}

/** State dropdown filtered by country. Always includes an "Other" option. */
export function StateSelect({
  label, countryName, value, onChange, required, error, disabled, placeholder = "Select state",
}: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const states = useMemo(() => {
    if (!countryName) return [];
    const c = Country.getAllCountries().find((x) => x.name === countryName);
    if (!c) return [];
    return State.getStatesOfCountry(c.isoCode) ?? [];
  }, [countryName]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return states;
    return states.filter((s) => s.name.toLowerCase().includes(q));
  }, [search, states]);

  // Reset value if the country changes and the current state isn't valid for it.
  useEffect(() => {
    if (!countryName || !value) return;
    if (value === "Other") return;
    if (!states.some((s) => s.name === value)) onChange("");
  }, [countryName, states, value, onChange]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled || !countryName}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border bg-card px-3 text-left text-sm shadow-sm",
              "transition-colors hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300",
              error ? "border-danger" : "border-border/60",
              (disabled || !countryName) && "cursor-not-allowed opacity-60",
            )}
          >
            <span className={value ? "" : "text-muted-foreground"}>
              {value || (countryName ? placeholder : "Pick a country first")}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[240px] overflow-hidden rounded-lg bg-card shadow-2xl ring-1 ring-border/30"
          >
            <div className="border-b border-border/30 px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search state..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-md bg-muted/30 pl-8 pr-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {filtered.map((s) => (
                <button
                  key={s.isoCode}
                  type="button"
                  onClick={() => { onChange(s.name); setOpen(false); setSearch(""); }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    value === s.name && "bg-primary-50/60",
                  )}
                >
                  {s.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { onChange("Other"); setOpen(false); setSearch(""); }}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-left text-sm italic text-muted-foreground transition-colors hover:bg-muted",
                  value === "Other" && "bg-primary-50/60",
                )}
              >
                Other
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
