"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/faculty/lib/utils/cn";

interface AreaTrendProps {
  title: string;
  data: { label: string; value: number; [key: string]: string | number }[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
  /**
   * Y-axis domain. Defaults to a tight auto-fit around the data so trends
   * read clearly when values are far from zero (e.g. enrollment ~12,000,
   * retention rate 85–90%). Pass `[0, "auto"]` to force a zero-based scale.
   */
  yDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
}

const DEFAULT_COLOR = "#2563eb";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-foreground">
          {typeof entry.value === "number"
            ? entry.value.toLocaleString()
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({
  title,
  data,
  dataKey = "value",
  xKey = "label",
  color = DEFAULT_COLOR,
  height = 280,
  showGrid = true,
  className,
  yDomain,
}: AreaTrendProps) {
  const gradientId = `area-gradient-${title.replace(/\s+/g, "-")}`;

  // Auto-fit: when no explicit domain is given, tighten the y-axis around
  // the actual data with ~5% padding on each side. Otherwise a 0-based
  // recharts default flattens trends whose values sit far above zero.
  const computedDomain: AreaTrendProps["yDomain"] = (() => {
    if (yDomain) return yDomain;
    if (!data || data.length === 0) return [0, "auto"];
    const values = data
      .map((d) => Number(d[dataKey]))
      .filter((v) => Number.isFinite(v));
    if (values.length === 0) return [0, "auto"];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.05);
      return [min - pad, max + pad];
    }
    const range = max - min;
    const pad = Math.max(range * 0.1, Math.abs(max) * 0.02);
    return [Math.max(0, min - pad), max + pad];
  })();

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-6",
          className,
        )}
      >
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div
          className="mt-4 flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6",
        className,
      )}
    >
      <p className="mb-4 text-sm font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -12 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            dx={-4}
            domain={computedDomain}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
