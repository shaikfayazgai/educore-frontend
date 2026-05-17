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
import { cn } from "@/admin/lib/utils/cn";

interface AreaTrendProps {
  title: string;
  data: { label: string; value: number; [key: string]: string | number }[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
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
}: AreaTrendProps) {
  const gradientId = `area-gradient-${title.replace(/\s+/g, "-")}`;

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
