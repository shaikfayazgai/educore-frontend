"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { ApiError } from "@/superadmin/lib/api/client";

export function InviteOtpVerifyDialog({
  open,
  onOpenChange,
  universityName,
  adminEmail,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityName: string;
  adminEmail: string;
  onSubmit: (otp: string) => Promise<void>;
}) {
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
    if (!open) {
      setOtp("");
      setLocalErr("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = otp.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) {
      setLocalErr("Enter the 6-digit code from the invitation email.");
      return;
    }
    setPending(true);
    setLocalErr("");
    try {
      await onSubmit(digits);
      onOpenChange(false);
    } catch (err) {
      setLocalErr(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold">Verify admin email</Dialog.Title>
            <Dialog.Close
              type="button"
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit OTP sent to <span className="font-medium text-foreground">{adminEmail}</span> for{" "}
            <span className="font-medium text-foreground">{universityName}</span>. Ask the university admin for the code
            if you do not have access to that inbox.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="invite-otp" className="text-sm font-medium">
                One-time code
              </label>
              <input
                id="invite-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="mt-2 flex h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-lg tracking-[0.35em] focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            {localErr && <p className="text-sm text-danger">{localErr}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <Dialog.Close
                type="button"
                disabled={pending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={pending || otp.length < 6}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
