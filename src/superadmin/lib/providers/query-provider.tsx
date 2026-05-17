"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AUTH_EXPIRED_EVENT } from "@/superadmin/lib/api/client";

/** Fullscreen overlay that takes over the moment the api client
 *  detects a 401 and starts the bounce to /login. Without this, the
 *  page that triggered the 401 would render its ErrorState ("Failed
 *  to fetch — Try again") for a tick before the navigation lands,
 *  which is alarming and misleading — the user is being signed out,
 *  not hitting a server failure. The overlay sits at z-[100] so it
 *  covers slide-drawers, sticky bars, everything. */
function AuthExpiredOverlay() {
  const [showing, setShowing] = useState(false);
  useEffect(() => {
    const onExpired = () => setShowing(true);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);
  if (!showing) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-xl">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          <div>
            <p className="text-sm font-semibold">Session expired</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Signing you out…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AuthExpiredOverlay />
    </QueryClientProvider>
  );
}
