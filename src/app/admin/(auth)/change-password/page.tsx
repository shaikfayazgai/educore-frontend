"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/admin/lib/stores/auth-store";
import { api, ApiError } from "@/admin/lib/api/client";
import { cn } from "@/admin/lib/utils/cn";

/**
 * Forced first-login password change. The portal layout redirects here
 * whenever `user.mustChangePassword === true` — applies to every role
 * (admin, faculty, student, placement, research). On success we patch
 * the cached user (mustChangePassword=false) and bounce to the dashboard.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isInitialized, initialize, setUser } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  // If somehow we land here with no need to change, send to dashboard.
  useEffect(() => {
    if (isInitialized && user && !user.mustChangePassword) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [isInitialized, user, router]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation don't match.");
        return;
      }
      if (newPassword === currentPassword) {
        setError("New password must differ from your current one.");
        return;
      }

      setSubmitting(true);
      try {
        await api.post("/api/auth/change-password", {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        setUser({ mustChangePassword: false });
        setSuccess(true);
        setTimeout(() => {
          if (user) router.replace(`/${user.role}/dashboard`);
        }, 1200);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not change password.");
      } finally {
        setSubmitting(false);
      }
    },
    [currentPassword, newPassword, confirmPassword, setUser, user, router],
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
          <GraduationCap className="h-6 w-6 text-background" />
        </div>
        <span className="text-xl font-semibold tracking-tight">Glimmora</span>
      </div>

      <div className="space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100 text-warning-700 ring-1 ring-warning-200 dark:bg-warning-500/15 dark:text-warning-400 dark:ring-warning-500/30">
          <KeyRound className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
          <p className="text-sm text-muted-foreground">
            For security, you need to change the temporary password you were emailed before
            using the portal.
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-success-500/30 bg-success-50 p-3 dark:bg-success-500/10">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-700 dark:text-success-400" />
          <p className="text-sm text-success-800 dark:text-success-200">
            Password updated. Redirecting…
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-light p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <PasswordField
          id="current"
          label="Current (temporary) password"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
        />
        <PasswordField
          id="new"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggleShow={() => setShowNew((v) => !v)}
          hint="At least 8 characters."
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showNew}
          onToggleShow={() => setShowNew((v) => !v)}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-lg font-medium text-sm transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {submitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
          ) : (
            "Set new password"
          )}
        </button>
      </form>
    </div>
  );
}

function PasswordField({
  id, label, value, onChange, show, onToggleShow, hint, autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-background pr-10 pl-3 text-sm transition-colors",
            "placeholder:text-muted-foreground border-input hover:border-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
