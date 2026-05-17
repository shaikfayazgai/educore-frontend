"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/faculty/lib/utils/cn";

interface SpecializationOption {
  value: string;
  label: string;
}

interface SpecializationSelectProps {
  label: string;
  /** Pre-defined specializations (typically from master data). */
  options: SpecializationOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Visible placeholder when nothing is selected. */
  placeholder?: string;
  /**
   * Optional first option in the dropdown — e.g. "No owning specialization"
   * for cross-cutting course catalog entries. Selecting this clears `value`.
   */
  prependOption?: SpecializationOption;
  disabled?: boolean;
}

// Sentinel for the "Other" choice — purely a UI signal, never persisted.
const OTHER_VALUE = "__other__";

/**
 * Dropdown of pre-defined specializations with an "Other (specify)" choice
 * that reveals a freeform text input. Useful when the master list is a
 * good starting point but admins occasionally need to enter a new value
 * (e.g. a niche specialization that hasn't been onboarded as master data
 * yet). The committed value is always a plain string — either one of the
 * option values or whatever the admin typed.
 */
export function SpecializationSelect({
  label,
  options,
  value,
  onChange,
  required,
  error,
  hint,
  placeholder = "Select a specialization",
  prependOption,
  disabled,
}: SpecializationSelectProps) {
  const id = useId();

  // The current value is "custom" when it's a non-empty string that isn't
  // any of the known dropdown options. That can happen because:
  //   - the caller seeded a value that was typed via Other previously, OR
  //   - the admin has just chosen Other and started typing.
  const knownValues = new Set<string>([
    ...(prependOption ? [prependOption.value] : []),
    ...options.map((o) => o.value),
  ]);
  const isCustom = value !== "" && !knownValues.has(value);
  const [showFreeform, setShowFreeform] = useState(isCustom);

  // Re-sync if the value is reset externally (e.g. drawer reopen).
  useEffect(() => {
    setShowFreeform(isCustom);
  }, [isCustom]);

  const dropdownValue = showFreeform || isCustom ? OTHER_VALUE : value;

  const handleSelect = (next: string) => {
    if (next === OTHER_VALUE) {
      setShowFreeform(true);
      // Clear so the freeform input starts blank; admin will type the new value.
      onChange("");
    } else {
      setShowFreeform(false);
      onChange(next);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          value={dropdownValue}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border bg-background pl-3 pr-9 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus:ring-danger"
              : "border-input hover:border-muted-foreground",
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {prependOption && (
            <option value={prependOption.value}>{prependOption.label}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other (specify)…</option>
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {showFreeform && (
        <input
          type="text"
          autoFocus
          placeholder="Type the specialization name…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus:ring-danger"
              : "border-input hover:border-muted-foreground",
          )}
        />
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
