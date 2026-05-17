"use client";

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/superadmin/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
  };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  className,
}: StatCardProps) {
  const trend =
    change && change.value > 0
      ? "up"
      : change && change.value < 0
      ? "down"
      : "neutral";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
            <Icon className="h-4 w-4 text-portal-accent" />
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {change && (
        <div className="mt-2 flex items-center gap-1.5">
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-danger",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
          </div>
          {change.label && (
            <span className="text-xs text-muted-foreground">
              {change.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
