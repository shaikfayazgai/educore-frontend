"use client";

import { cn } from "@/placement/lib/utils/cn";

interface AiConfidenceIndicatorProps {
  confidence: number; // 0-1
  showLabel?: boolean;
  size?: "sm" | "md";
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.8) return { label: "High", color: "text-success", bg: "bg-success", barBg: "bg-success" };
  if (confidence >= 0.5) return { label: "Medium", color: "text-warning", bg: "bg-warning", barBg: "bg-warning" };
  return { label: "Low", color: "text-danger", bg: "bg-danger", barBg: "bg-danger" };
}

export function AiConfidenceIndicator({
  confidence,
  showLabel = true,
  size = "sm",
}: AiConfidenceIndicatorProps) {
  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2">
      {/* Bar */}
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5 w-16" : "h-2 w-24"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", level.barBg)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Label */}
      {showLabel && (
        <span className={cn("font-medium", level.color, size === "sm" ? "text-xs" : "text-sm")}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
