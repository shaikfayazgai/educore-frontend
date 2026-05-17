"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Calendar, Loader2, X } from "lucide-react";

import { cn } from "@/superadmin/lib/utils/cn";

interface ExtendDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityName: string;
  /** Current permanentDeleteAt as ISO string (used to pre-fill the date picker). */
  currentDate?: string;
  /**
   * Called with an ISO datetime string for the new permanent_delete_at.
   * Should reject if the value is in the past.
   */
  onConfirm: (isoDate: string) => Promise<void> | void;
}

function toInputDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // yyyy-MM-dd in local timezone
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function ExtendDeletionDialog({
  open, onOpenChange, universityName, currentDate, onConfirm,
}: ExtendDeletionDialogProps) {
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(toInputDate(currentDate));
      setSubmitting(false);
    }
  }, [open, currentDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().slice(0, 10);

  const isValid = date && new Date(date) > today;

  const handleConfirm = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      // Convert the picked date to end-of-day UTC ISO so the server has a clear cutoff.
      const iso = new Date(`${date}T23:59:59Z`).toISOString();
      await onConfirm(iso);
      onOpenChange(false);
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold">
                  Extend deletion date
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Push the permanent deletion of <span className="font-medium text-foreground">{universityName}</span>{" "}
                  to a later date.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-5 space-y-1.5">
            <label className="block text-sm font-medium">
              New deletion date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(
                "h-10 w-full rounded-lg border border-border/60 bg-card px-3 text-sm shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-300",
              )}
            />
            <p className="text-xs text-muted-foreground">
              The tenant will be permanently deleted at end-of-day UTC on this date unless restored.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || submitting}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all",
                "hover:-translate-y-0.5 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
