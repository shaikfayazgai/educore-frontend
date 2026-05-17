"use client";

import Link from "next/link";
import { cn } from "@/student/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  linkUrl?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotVariants = {
  default: "bg-border",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const variant = item.variant || "default";
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
            )}

            {/* Dot / Icon */}
            <div className="relative z-10 flex-shrink-0">
              {Icon ? (
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    variant === "default" ? "bg-muted" : `bg-${variant}-light`
                  )}
                >
                  <Icon className="h-3 w-3" />
                </div>
              ) : (
                <div
                  className={cn(
                    "mt-1.5 h-3 w-3 rounded-full border-2 border-background",
                    dotVariants[variant]
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0">
              {item.linkUrl ? (
                <Link
                  href={item.linkUrl}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {item.title}
                </Link>
              ) : (
                <p className="text-sm font-medium">{item.title}</p>
              )}
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
