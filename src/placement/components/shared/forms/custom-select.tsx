"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/placement/lib/utils/cn";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function CustomSelect({ value, onChange, options, className }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-2 rounded-lg bg-card pl-4 pr-10 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 transition-all focus:outline-none focus:ring-1 focus:ring-primary-400"
      >
        <span className="whitespace-nowrap">{selectedLabel}</span>
        <ChevronDown className={cn("absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-full overflow-hidden rounded-lg bg-card py-1 shadow-2xl ring-1 ring-border/30">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-primary-50/40",
                value === option.value ? "font-medium text-primary-700" : "text-foreground",
              )}
            >
              {value === option.value && <Check className="h-3.5 w-3.5 text-primary-500" />}
              <span className={value !== option.value ? "pl-5.5" : ""}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
