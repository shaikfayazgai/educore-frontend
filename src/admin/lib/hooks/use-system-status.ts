/**
 * Hook + helper for the public `/api/system/status` flag readout.
 *
 * Purpose: let buttons / forms know BEFORE the user clicks whether the
 * platform is in maintenance mode or has registrations disabled, so the
 * SPA can show disabled-with-tooltip instead of letting the user click,
 * burn a request, and bounce on a 503/403.
 *
 * Polling cadence: 30s `refetchInterval`. The endpoint is single-row,
 * un-authenticated, and cheap (one Postgres lookup), so 30s is fine for
 * "the flag changed in the super-admin Settings page → other tabs
 * notice within half a minute". Stale-while-revalidate keeps the UI
 * stable between polls (no flicker).
 *
 * Returns a single boolean `createsBlocked` from the server — UI
 * consumers don't have to recompute "maintenance OR !registrations"
 * themselves.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/admin/lib/api/client";

export interface SystemStatus {
  maintenanceMode: boolean;
  registrationsEnabled: boolean;
  /** Convenience union: true when either maintenance is on OR
   *  registrations are off. Most consumers care only about this. */
  createsBlocked: boolean;
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system", "status"],
    queryFn: () => api.get<SystemStatus>("/api/system/status"),
    select: (res) => res.data,
    // 30s poll keeps cross-tab updates timely without hammering the
    // backend. `refetchOnWindowFocus` covers the "user comes back to
    // a backgrounded tab" case so a stale flag doesn't linger.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    // Treat as always slightly stale so the next focus/interval fires
    // a fresh fetch. The endpoint is cheap.
    staleTime: 0,
    // Critical-path UI depends on this; let it retry briefly so a
    // single network hiccup doesn't flash "createsBlocked=false" and
    // mislead the user.
    retry: 2,
  });
}

/** Convenience reader for "should this create-action be blocked?" with
 *  a sane default while the query is still loading (treats unknown
 *  state as "allow" — failing closed would briefly disable every
 *  button on first paint, which is worse UX than briefly allowing). */
export function useCreatesBlocked(): {
  blocked: boolean;
  reason: "maintenance" | "registrations-off" | null;
  tooltip: string;
} {
  const { data } = useSystemStatus();
  if (!data) {
    return { blocked: false, reason: null, tooltip: "" };
  }
  if (data.maintenanceMode) {
    return {
      blocked: true,
      reason: "maintenance",
      tooltip:
        "System under maintenance — try again in a few minutes or contact your administrator.",
    };
  }
  if (!data.registrationsEnabled) {
    return {
      blocked: true,
      reason: "registrations-off",
      tooltip:
        "New registrations are disabled platform-wide. Contact the platform team to re-enable.",
    };
  }
  return { blocked: false, reason: null, tooltip: "" };
}
