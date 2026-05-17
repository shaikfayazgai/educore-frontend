"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { api, ApiError } from "@/placement/lib/api/client";
import { useAuthStore } from "@/placement/lib/stores/auth-store";

/**
 * Two paths into this page:
 *
 *  1. Forgot-password / first-time-via-OTP: user lands here from
 *     /placement/forgot-password with an `?email=` param. They request an
 *     OTP, type it in, and choose a new password.
 *
 *  2. Forced default-password change: user logs in with the temp password
 *     the admin emailed. The login response has `mustChangePassword=true`
 *     so the auth-store / login page redirects here. They confirm the
 *     current (default) password and pick a new one. No OTP required —
 *     they already proved they own the account by logging in.
 *
 * Mirror of student/(auth)/setup-password-content.tsx so the two flows
 * stay in lockstep; only the imports and post-success redirect differ.
 */
export default function SetupPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const initialEmail = params?.get("email") ?? user?.email ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // `forced` = logged in AND backend says mustChangePassword. Drives both
  // the heading copy and which form fields render below.
  const forced = !!(isAuthenticated && user?.mustChangePassword);
  const [stage, setStage] = useState<"request" | "verify">(initialEmail ? "verify" : "request");
  useEffect(() => { if (forced) setStage("verify"); }, [forced]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true); setError(null); setInfo(null);
    try {
      await api.post("/api/auth/request-otp", { email });
      setInfo("OTP sent. Check your email (also try spam).");
      setStage("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally { setBusy(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (newPassword !== confirm) return setError("Passwords do not match.");
    setBusy(true); setError(null); setInfo(null);
    try {
      if (forced) {
        await api.post("/api/auth/change-password", {
          currentPassword, newPassword, confirmPassword: confirm,
        });
        await initialize();
        router.push("/placement/dashboard");
        return;
      }
      await api.post("/api/auth/setup-password", { email, otp, newPassword });
      setInfo("Password set. Redirecting to login...");
      setTimeout(() => router.push("/placement/login"), 1000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save password");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-portal-accent">
          <KeyRound className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {forced ? "Change default password" : "Setup / reset password"}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {forced ? "Welcome — let's set a personal password" : "Set up your password"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {forced
            ? "Your placement officer account is using the default onboarding password. Pick a private one before continuing."
            : "We'll email a 6-digit OTP. Use it once and choose a new password."}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-light p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {info && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{info}</span>
        </div>
      )}

      {!forced && stage === "request" && (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email"
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-portal-accent" />
          </div>
          <button type="submit" disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background disabled:opacity-50">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send OTP"}
          </button>
        </form>
      )}

      {(forced || stage === "verify") && (
        <form onSubmit={submit} className="space-y-4">
          {!forced && (
            <>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email"
                  className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-portal-accent" />
              </div>
              <div>
                <label className="text-sm font-medium">OTP</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} inputMode="numeric"
                  className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-center tracking-[0.5em] text-base outline-none focus:ring-2 focus:ring-portal-accent" />
                <button type="button" onClick={() => sendOtp()}
                  className="mt-1 text-xs text-portal-accent hover:underline">Resend OTP</button>
              </div>
            </>
          )}
          {forced && (
            <div>
              <label className="text-sm font-medium">Current (default) password</label>
              <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required type="password"
                className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-portal-accent" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">New password</label>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required type="password" minLength={8}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-portal-accent" />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} required type="password" minLength={8}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-portal-accent" />
          </div>
          <button type="submit" disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background disabled:opacity-50">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : forced ? "Save and continue" : "Set password"}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Have your password? <Link href="/placement/login" className="text-portal-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
