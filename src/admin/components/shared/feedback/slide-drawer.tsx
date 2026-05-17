"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/admin/lib/utils/cn";

interface SlideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg" | "xl" | "2xl";
}

export function SlideDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "lg",
}: SlideDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: "sa-fade-in 200ms ease-out" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "absolute right-0 top-0 flex h-full flex-col border-l border-border bg-background shadow-xl",
          width === "md" && "w-full max-w-md",
          width === "lg" && "w-full max-w-lg",
          width === "xl" && "w-full max-w-xl",
          width === "2xl" && "w-full max-w-2xl",
        )}
        style={{
          animation:
            "sa-slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {/* Footer — sticky bottom */}
        {footer && (
          <div className="shrink-0 border-t border-border bg-background px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
