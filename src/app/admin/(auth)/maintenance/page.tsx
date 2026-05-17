"use client";

import { useEffect, useState, useCallback } from "react";
import { Wrench, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";

/**
 * Maintenance lockout page.
 *
 * The api-client bounces here whenever any request to UniBackend returns
 * `503 MAINTENANCE_MODE`. The platform team flips the `maintenanceMode`
 * flag in super-admin Settings → Feature Flags before doing a freeze
 * window (DB migration, version cutover, infra change). While the flag
 * is on, every university admin / faculty / student / placement request
 * is rejected with that 503, the client bounces here, and the user sees
 * this page until the freeze ends.
 *
 * The "Retry now" button does a soft re-fetch of a cheap endpoint
 * (`/api/auth/me`) — when that succeeds, the platform is back and we
 * route the user to wherever they came from. While we wait, we also
 * auto-poll every 30s so the page recovers on its own if the user
 * leaves the tab open across a short maintenance window.
 *
 * NOT a place to display sensitive context — the user might not be the
 * one who triggered the freeze (e.g. their browser opened a stale tab
 * mid-maintenance), so copy stays generic.
 */
export default function MaintenancePage() {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const probe = useCallback(async () => {
    setChecking(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const res = await fetch(`${base}/health`, { cache: "no-store" });
      // Backend returns 503 with MAINTENANCE_MODE while frozen. Anything
      // 2xx means the freeze is over and we can route the user back.
      if (res.ok) {
        // Pick a safe default — admins / faculty / students all land on
        // their portal's own root which then routes them per role.
        window.location.replace("/");
        return;
      }
    } catch {
      // Network error — backend still genuinely unreachable. Stay here.
    } finally {
      setChecking(false);
      setLastChecked(new Date());
    }
  }, []);

  // Auto-poll every 30s so the page recovers without user interaction
  // once the platform comes back. 30s is a balance: short enough that a
  // 1-minute freeze recovers ~quickly; long enough that we don't hammer
  // the backend when the freeze stretches to 30+ minutes.
  useEffect(() => {
    const id = window.setInterval(() => { void probe(); }, 30_000);
    return () => window.clearInterval(id);
  }, [probe]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-light text-warning">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Down for maintenance
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The Glimmora platform is undergoing scheduled maintenance. We&apos;ll be back shortly — your data and sign-in are unaffected.
        </p>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void probe()}
            disabled={checking}
            className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Retry now"}
          </button>
          {lastChecked && (
            <p className="text-[11px] text-muted-foreground">
              Last checked at {lastChecked.toLocaleTimeString()} · auto-retrying every 30s
            </p>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            Urgent? Reach out to your institution&apos;s admin.
          </p>
          <Link
            href="/admin/login"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
          >
            <Mail className="h-3 w-3" /> Back to sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}
