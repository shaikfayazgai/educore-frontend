"use client";

import { cn } from "@/placement/lib/utils/cn";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-portal-accent-light text-portal-accent",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  muted: "bg-muted text-muted-foreground",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-portal-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-muted-foreground",
};

export function StatusBadge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])}
        />
      )}
      {children}
    </span>
  );
}

// Helper to map common statuses to variants
export function getRiskVariant(
  level: "high" | "medium" | "low" | "none"
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    high: "danger",
    medium: "warning",
    low: "success",
    none: "muted",
  };
  return map[level] || "muted";
}

export function getComplianceVariant(
  status: "compliant" | "at_risk" | "non_compliant"
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    compliant: "success",
    at_risk: "warning",
    non_compliant: "danger",
  };
  return map[status] || "muted";
}

export function getHealthVariant(
  health: "healthy" | "degraded" | "down"
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    healthy: "success",
    degraded: "warning",
    down: "danger",
  };
  return map[health] || "muted";
}
