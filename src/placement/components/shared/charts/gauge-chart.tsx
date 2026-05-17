"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/placement/lib/utils/cn";

interface GaugeChartProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const COLORS = {
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
} as const;

const BG_SLICE = "#e5e7eb";

const SIZE_MAP = {
  sm: { height: 120, fontSize: "text-lg" },
  md: { height: 160, fontSize: "text-2xl" },
  lg: { height: 200, fontSize: "text-3xl" },
} as const;

function getAutoColor(value: number, maxValue: number): string {
  const pct = (value / maxValue) * 100;
  if (pct < 40) return COLORS.danger;
  if (pct <= 70) return COLORS.warning;
  return COLORS.success;
}

export function GaugeChart({
  label,
  value,
  maxValue = 100,
  color,
  size = "md",
  className,
}: GaugeChartProps) {
  const clampedValue = Math.max(0, Math.min(value, maxValue));
  const remaining = maxValue - clampedValue;
  const fillColor = color ?? getAutoColor(clampedValue, maxValue);
  const { height, fontSize } = SIZE_MAP[size];

  const pieData = [
    { name: "filled", value: clampedValue },
    { name: "remaining", value: remaining },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6",
        className,
      )}
    >
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>

      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius="65%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
              animationDuration={800}
            >
              <Cell fill={fillColor} />
              <Cell fill={BG_SLICE} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={cn("font-semibold text-foreground", fontSize)}>
            {clampedValue}
          </span>
          {maxValue !== 100 && (
            <span className="text-xs text-muted-foreground">
              / {maxValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
