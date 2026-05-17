/**
 * Hook for the public `/api/system/status` flag readout (super-admin
 * frontend mirror). Lets buttons / forms disable themselves BEFORE the
 * user clicks during a maintenance window.
 *
 * Polls every 30s so a super-admin flipping the flag in Settings sees
 * other open tabs/components update within ~30s.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";

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
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 2,
  });
}

/** "Should this create-action be blocked?" with a clear reason + tooltip.
 *  Default while loading is "allow" — fails OPEN so we don't briefly
 *  disable every button on first paint. */
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
        "New registrations are disabled platform-wide. Re-enable in Settings → Feature Flags before onboarding.",
    };
  }
  return { blocked: false, reason: null, tooltip: "" };
}
