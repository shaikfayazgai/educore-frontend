"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, ShieldBan, X } from "lucide-react";

import { cn } from "@/superadmin/lib/utils/cn";

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityName: string;
  /** Called with the trimmed comment text. Only fires when the comment is non-empty. */
  onConfirm: (comment: string) => Promise<void> | void;
  loading?: boolean;
}

/**
 * Suspend a university with a mandatory reason/comment.
 * The Confirm button stays disabled until at least one non-whitespace character
 * is in the textarea (server-side also enforces).
 */
export function SuspendDialog({
  open, onOpenChange, universityName, onConfirm, loading,
}: SuspendDialogProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setComment("");
      setSubmitting(false);
    }
  }, [open]);

  const isValid = comment.trim().length > 0;
  const isPending = submitting || !!loading;

  const handleConfirm = async () => {
    if (!isValid || isPending) return;
    setSubmitting(true);
    try {
      await onConfirm(comment.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 shadow-2xl ring-1 ring-border/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                <ShieldBan className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold">
                  Suspend University
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Suspending <span className="font-medium text-foreground">{universityName}</span>{" "}
                  blocks all of its users from signing in until reactivated. Tenant data is kept.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-5 space-y-1.5">
            <label className="block text-sm font-medium">
              Reason / comment <span className="text-danger">*</span>
            </label>
            <textarea
              autoFocus
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Non-payment of subscription dues — review by 2026-06-01"
              className={cn(
                "w-full resize-none rounded-lg border bg-card px-3 py-2 text-sm shadow-sm",
                "transition-colors hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300",
                "border-border/60",
              )}
            />
            <p className="text-xs text-muted-foreground">
              This reason is logged to the audit trail and stored on the tenant record.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || isPending}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-lg shadow-danger/25 transition-all",
                "hover:-translate-y-0.5 hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Suspend
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
