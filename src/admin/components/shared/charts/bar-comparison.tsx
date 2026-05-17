"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/admin/lib/utils/cn";

interface BarComparisonProps {
  title: string;
  data: { label: string; [key: string]: string | number }[];
  bars: { dataKey: string; label: string; color: string }[];
  height?: number;
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}:</span>
            <span className="text-sm font-semibold text-foreground">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomLegend({
  payload,
}: {
  payload?: { value: string; color: string }[];
}) {
  if (!payload?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BarComparison({
  title,
  data,
  bars,
  height = 300,
  className,
}: BarComparisonProps) {
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
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -12 }}
          barGap={4}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="label"
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
          <Legend content={<CustomLegend />} />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.label}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
