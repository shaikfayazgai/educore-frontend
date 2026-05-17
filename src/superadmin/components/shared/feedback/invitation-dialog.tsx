"use client";

/**
 * Send Invitation dialog. Single screen, three controls:
 *
 *   1. The OTP input is always visible but DISABLED until the user clicks
 *      "Send OTP" in this dialog session. (We don't pre-flip to "Resend"
 *      based on server state — every fresh open starts at "Send OTP".)
 *   2. The "Send OTP" button becomes "Resend OTP" only after a successful
 *      send. The Resend button stays disabled for 60 seconds and shows a
 *      live countdown.
 *   3. The "Verify" button is disabled until an OTP has been sent AND the
 *      user has typed 6 digits.
 *
 * The previously-issued OTP stays valid on the server for 10 minutes — so
 * re-opening the dialog and clicking Send OTP again is non-destructive.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mail, Send, ShieldCheck, X } from "lucide-react";
import { ApiError } from "@/superadmin/lib/api/client";

const RESEND_COOLDOWN_SECONDS = 60;

export function InvitationDialog({
  open,
  onOpenChange,
  universityName,
  adminEmail,
  onSendOtp,
  onVerifyOtp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityName: string;
  adminEmail: string;
  onSendOtp: () => Promise<void>;
  onVerifyOtp: (otp: string) => Promise<void>;
}) {
  /** Has the user clicked "Send OTP" in THIS dialog session? */
  const [hasSentInSession, setHasSentInSession] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset the entire dialog every time it opens — the user always starts at "Send OTP".
  useEffect(() => {
    if (!open) return;
    setHasSentInSession(false);
    setOtp("");
    setErrorMsg("");
    setSecondsRemaining(0);
    setSending(false);
    setVerifying(false);
  }, [open]);

  // Drive the cooldown timer.
  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (secondsRemaining > 0) {
      tickRef.current = setInterval(() => {
        setSecondsRemaining((s) => {
          if (s <= 1) {
            if (tickRef.current) clearInterval(tickRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [secondsRemaining]);

  const handleSend = useCallback(async () => {
    setSending(true);
    setErrorMsg("");
    try {
      await onSendOtp();
      setHasSentInSession(true);
      setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
      setOtp("");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to send OTP.");
    } finally {
      setSending(false);
    }
  }, [onSendOtp]);

  const handleVerify = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const digits = otp.replace(/\D/g, "").slice(0, 6);
      if (digits.length !== 6) {
        setErrorMsg("Enter the 6-digit OTP from the invitation email.");
        return;
      }
      setVerifying(true);
      setErrorMsg("");
      try {
        await onVerifyOtp(digits);
        onOpenChange(false);
      } catch (err) {
        setErrorMsg(err instanceof ApiError ? err.message : "Verification failed.");
      } finally {
        setVerifying(false);
      }
    },
    [otp, onVerifyOtp, onOpenChange]
  );

  const sendButtonLabel = (() => {
    if (sending) return hasSentInSession ? "Resending..." : "Sending...";
    if (!hasSentInSession) return "Send OTP";
    if (secondsRemaining > 0) return `Resend in ${secondsRemaining}s`;
    return "Resend OTP";
  })();

  const sendButtonDisabled = sending || (hasSentInSession && secondsRemaining > 0);

  const otpInputDisabled = !hasSentInSession;
  const verifyDisabled = !hasSentInSession || verifying || otp.length < 6;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold">Send invitation</Dialog.Title>
            <Dialog.Close
              type="button"
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {hasSentInSession
              ? `OTP sent. Enter the 6-digit code from the email to verify ${universityName}. The code is valid for 10 minutes.`
              : `An OTP will be emailed to the admin so they can confirm ownership of the inbox for ${universityName}.`}
          </Dialog.Description>

          {/* Email card */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
            <Mail className="h-4 w-4 shrink-0 text-primary-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{adminEmail}</p>
              <p className="text-xs text-muted-foreground">Admin email of {universityName}</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="mt-5 space-y-4">
            {/* OTP input — always visible, disabled until sent */}
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
                disabled={otpInputDisabled}
                placeholder={otpInputDisabled ? "" : "000000"}
                className="mt-2 flex h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-lg tracking-[0.35em] focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Send / Resend button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={sendButtonDisabled}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                title={
                  !hasSentInSession
                    ? "Send the verification OTP to the admin"
                    : secondsRemaining > 0
                      ? `Available in ${secondsRemaining}s`
                      : "Send another OTP"
                }
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sendButtonLabel}
              </button>

              <div className="flex gap-3">
                <Dialog.Close
                  type="button"
                  disabled={verifying}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={verifyDisabled}
                  className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 disabled:opacity-50"
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
