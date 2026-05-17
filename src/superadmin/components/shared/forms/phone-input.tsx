"use client";

import { forwardRef, useMemo, useState } from "react";
import { Country } from "country-state-city";
import { ChevronDown, Search } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

import { cn } from "@/superadmin/lib/utils/cn";

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  /** Selected dial code, e.g. "+91". Independent from the university's country. */
  dialCode?: string;
  /** Fired when the user picks a different code from the dropdown. */
  onDialCodeChange?: (dialCode: string) => void;
  required?: boolean;
  error?: string;
}

/**
 * Phone number input. The left chip is a clickable, searchable dial-code
 * picker (independent from any other country selection on the same form).
 * The text input on the right takes the local digits only.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput({
    label, dialCode, onDialCodeChange, required, error, className, ...rest
  }, ref) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Build a deduped list of {dialCode, name, flag, isoCode} sorted by code.
    const codes = useMemo(() => {
      const seen = new Set<string>();
      const out: { dial: string; name: string; flag: string; iso: string }[] = [];
      for (const c of Country.getAllCountries()) {
        const dial = c.phonecode ? `+${c.phonecode.replace(/^\+/, "")}` : "";
        if (!dial) continue;
        const key = `${dial}::${c.isoCode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ dial, name: c.name, flag: c.flag, iso: c.isoCode });
      }
      // Sort by numeric dial code first, then alphabetically by country name.
      return out.sort((a, b) => {
        const na = parseInt(a.dial.replace("+", ""), 10);
        const nb = parseInt(b.dial.replace("+", ""), 10);
        if (na !== nb) return na - nb;
        return a.name.localeCompare(b.name);
      });
    }, []);

    const filtered = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return codes;
      return codes.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.dial.includes(q) ||
          c.iso.toLowerCase().includes(q)
      );
    }, [search, codes]);

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
        <div
          className={cn(
            "flex h-10 w-full items-stretch overflow-hidden rounded-lg border bg-card shadow-sm",
            "focus-within:ring-2 focus-within:ring-primary-300",
            error ? "border-danger" : "border-border/60",
          )}
        >
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 border-r border-border/60 bg-muted/40 px-3 text-sm font-mono transition-colors hover:bg-muted",
                  dialCode ? "text-foreground" : "text-muted-foreground/60",
                )}
                title="Select country dial code"
              >
                {dialCode || "+--"}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={6}
                className="z-50 w-[300px] overflow-hidden rounded-lg bg-card shadow-2xl ring-1 ring-border/30"
              >
                <div className="border-b border-border/30 px-3 py-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search code or country..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 w-full rounded-md bg-muted/30 pl-8 pr-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-300"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No match
                    </p>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={`${c.iso}-${c.dial}`}
                        type="button"
                        onClick={() => {
                          onDialCodeChange?.(c.dial);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                          dialCode === c.dial && "bg-primary-50/60",
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{c.dial}</span>
                      </button>
                    ))
                  )}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            className={cn(
              "flex-1 bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none",
              className,
            )}
            {...rest}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
