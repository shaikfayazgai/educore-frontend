"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/faculty/lib/utils/cn";

interface RadarChartDisplayProps {
  title?: string;
  data: { subject: string; value: number; benchmark?: number }[];
  height?: number;
  className?: string;
}

const ACCENT_COLOR = "#2563eb";
const BENCHMARK_COLOR = "#9ca3af";

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
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}:</span>
            <span className="text-sm font-semibold text-foreground">
              {entry.value}
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
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function RadarChartDisplay({
  title,
  data,
  height = 320,
  className,
}: RadarChartDisplayProps) {
  const hasBenchmark = data.some(
    (d) => d.benchmark !== undefined && d.benchmark !== null,
  );

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-6",
          className,
        )}
      >
        {title && (
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        )}
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
      {title && (
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <PolarRadiusAxis
            angle={90}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
          />

          {hasBenchmark && (
            <Radar
              name="Program Average"
              dataKey="benchmark"
              stroke={BENCHMARK_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill={BENCHMARK_COLOR}
              fillOpacity={0.05}
            />
          )}

          <Radar
            name="Score"
            dataKey="value"
            stroke={ACCENT_COLOR}
            strokeWidth={2}
            fill={ACCENT_COLOR}
            fillOpacity={0.15}
          />

          <Tooltip content={<CustomTooltip />} />
          {hasBenchmark && <Legend content={<CustomLegend />} />}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
