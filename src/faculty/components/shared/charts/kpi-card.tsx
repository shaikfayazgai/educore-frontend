"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/faculty/lib/utils/cn";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label?: string };
  sparklineData?: { value: number }[];
  className?: string;
}

const COLORS = {
  success: "#059669",
  danger: "#dc2626",
  muted: "#9ca3af",
} as const;

export function KpiCard({
  label,
  value,
  change,
  sparklineData,
  className,
}: KpiCardProps) {
  const trend =
    change && change.value > 0
      ? "up"
      : change && change.value < 0
        ? "down"
        : "neutral";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const sparkColor =
    trend === "up"
      ? COLORS.success
      : trend === "down"
        ? COLORS.danger
        : COLORS.muted;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-danger",
                  trend === "neutral" && "text-muted-foreground",
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

        {sparklineData && sparklineData.length > 1 && (
          <div className="h-8 w-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`spark-fill-${label.replace(/\s+/g, "-")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor={sparkColor}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-fill-${label.replace(/\s+/g, "-")})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
