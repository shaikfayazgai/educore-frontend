"use client";

import { AlertTriangle, AlertCircle, CheckCircle2, Minus } from "lucide-react";
import { cn } from "@/superadmin/lib/utils/cn";
import type { RiskLevel } from "@/superadmin/lib/api/types/common.types";

interface RiskIndicatorProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const config: Record<
  RiskLevel,
  { icon: typeof AlertTriangle; label: string; color: string; bg: string }
> = {
  high: {
    icon: AlertTriangle,
    label: "High Risk",
    color: "text-danger",
    bg: "bg-danger-light",
  },
  medium: {
    icon: AlertCircle,
    label: "Medium Risk",
    color: "text-warning",
    bg: "bg-warning-light",
  },
  low: {
    icon: CheckCircle2,
    label: "Low Risk",
    color: "text-success",
    bg: "bg-success-light",
  },
  none: {
    icon: Minus,
    label: "No Risk",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

export function RiskIndicator({
  level,
  showLabel = true,
  size = "sm",
}: RiskIndicatorProps) {
  const { icon: Icon, label, color, bg } = config[level];

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          bg,
          size === "sm" ? "h-5 w-5" : "h-6 w-6"
        )}
      >
        <Icon
          className={cn(
            color,
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
          )}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "font-medium",
            color,
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
