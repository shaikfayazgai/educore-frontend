"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/student/lib/utils/cn";
import { DEBOUNCE_MS } from "@/student/lib/utils/constants";

interface SearchInputProps {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  onSearch,
  placeholder = "Search...",
  debounceMs = DEBOUNCE_MS,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue || "");

  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
          "hover:border-muted-foreground"
        )}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
