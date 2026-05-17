"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/student/lib/utils/cn";

interface DonutBreakdownProps {
  title: string;
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string | number;
  height?: number;
  className?: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="text-xs text-muted-foreground">{entry.name}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {entry.value.toLocaleString()}
      </p>
    </div>
  );
}

export function DonutBreakdown({
  title,
  data,
  centerLabel,
  centerValue,
  height = 280,
  className,
}: DonutBreakdownProps) {
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

      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {(centerLabel || centerValue !== undefined) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <span className="text-2xl font-semibold text-foreground">
                {typeof centerValue === "number"
                  ? centerValue.toLocaleString()
                  : centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs text-muted-foreground">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.name}
            </span>
            <span className="text-xs font-medium text-foreground">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
