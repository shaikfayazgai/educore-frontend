"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/admin/lib/utils/cn";

interface ApproveDismissActionsProps {
  onApprove: () => void | Promise<void>;
  onDismiss: (reason: string) => void | Promise<void>;
  approveLabel?: string;
  dismissLabel?: string;
  dismissReasons?: string[];
  disabled?: boolean;
  size?: "sm" | "md";
}

const DEFAULT_DISMISS_REASONS = [
  "Not relevant to me",
  "Already addressed",
  "Incorrect suggestion",
  "Will revisit later",
  "Other",
];

export function ApproveDismissActions({
  onApprove,
  onDismiss,
  approveLabel = "Approve",
  dismissLabel = "Dismiss",
  dismissReasons = DEFAULT_DISMISS_REASONS,
  disabled = false,
  size = "sm",
}: ApproveDismissActionsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleDismiss = async (reason: string) => {
    setIsDismissing(true);
    setDismissOpen(false);
    try {
      await onDismiss(reason);
    } finally {
      setIsDismissing(false);
    }
  };

  const btnClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div className="flex items-center gap-2">
      {/* Approve */}
      <button
        onClick={handleApprove}
        disabled={disabled || isApproving || isDismissing}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors",
          "bg-success text-success-foreground hover:bg-success/90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          btnClass
        )}
      >
        {isApproving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {approveLabel}
      </button>

      {/* Dismiss with reason */}
      <Popover.Root open={dismissOpen} onOpenChange={setDismissOpen}>
        <Popover.Trigger asChild>
          <button
            disabled={disabled || isApproving || isDismissing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-border font-medium transition-colors",
              "hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              btnClass
            )}
          >
            {isDismissing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {dismissLabel}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="top"
            align="end"
            sideOffset={8}
            className="z-50 w-56 rounded-xl border border-border bg-card p-2 shadow-lg"
          >
            <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
              Reason for dismissing
            </p>
            {dismissReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => handleDismiss(reason)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              >
                {reason}
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
