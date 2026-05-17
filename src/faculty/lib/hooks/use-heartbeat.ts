"use client";

import { useEffect } from "react";

import { api } from "@/faculty/lib/api/client";

const DEFAULT_INTERVAL_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_HEARTBEAT_INTERVAL_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 5_000 ? n : 30_000;
})();

/**
 * Polls /api/auth/heartbeat. Steady-state success is a no-op. The cascade
 * interceptor in the API client takes care of redirecting to /suspended or
 * /login when the response is 403/401, so this hook only needs to fire the
 * request.
 */
export function useHeartbeat(intervalMs: number = DEFAULT_INTERVAL_MS) {
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      if (cancelled) return;
      try {
        await api.get("/api/auth/heartbeat");
      } catch {
        // The interceptor already redirected; stop polling for this page load.
        cancelled = true;
      }
    }
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);
}
