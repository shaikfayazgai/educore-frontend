"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Brain, Database, Clock } from "lucide-react";
import { cn } from "@/superadmin/lib/utils/cn";

interface ExplanationFactor {
  name: string;
  value: string | number;
  weight: number; // 0-1
  direction: "positive" | "negative" | "neutral";
}

interface ExplainabilityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  factors: ExplanationFactor[];
  dataSources: string[];
  modelVersion: string;
  generatedAt: string;
}

export function ExplainabilityDrawer({
  open,
  onOpenChange,
  title,
  summary,
  factors,
  dataSources,
  modelVersion,
  generatedAt,
}: ExplainabilityDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                <Brain className="h-4 w-4 text-portal-accent" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold">
                  AI Explanation
                </Dialog.Title>
                <p className="text-xs text-muted-foreground">{title}</p>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </h3>
              <p className="mt-2 text-sm leading-relaxed">{summary}</p>
            </div>

            {/* Contributing Factors */}
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contributing Factors
              </h3>
              <div className="mt-3 space-y-3">
                {factors.map((factor) => (
                  <div
                    key={factor.name}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          factor.direction === "positive" && "text-success",
                          factor.direction === "negative" && "text-danger",
                          factor.direction === "neutral" && "text-muted-foreground"
                        )}
                      >
                        {factor.direction === "positive"
                          ? "+"
                          : factor.direction === "negative"
                          ? "-"
                          : ""}
                        {typeof factor.value === "number"
                          ? factor.value
                          : factor.value}
                      </span>
                    </div>
                    {/* Weight bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            factor.direction === "positive" && "bg-success",
                            factor.direction === "negative" && "bg-danger",
                            factor.direction === "neutral" && "bg-muted-foreground"
                          )}
                          style={{ width: `${factor.weight * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(factor.weight * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Database className="h-3 w-3" />
                Data Sources
              </h3>
              <ul className="mt-2 space-y-1">
                {dataSources.map((source) => (
                  <li
                    key={source}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer — Model info */}
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Model: {modelVersion}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {generatedAt}
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
