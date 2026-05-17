"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/student/lib/stores/auth-store";
import { ApiError, api } from "@/student/lib/api/client";

/** Suspension watchdog + forced-first-login + login-bounce. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(async () => {
      try {
        await api.get("/api/auth/me");
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.code === "ACCOUNT_SUSPENDED" || e.code === "ACCOUNT_DEACTIVATED") {
            await useAuthStore.getState().logout({ silent: true });
            router.replace(`/student/account-suspended?code=${e.code}`);
          } else if (e.status === 401) {
            await useAuthStore.getState().logout({ silent: true });
            router.replace("/student/login");
          }
        }
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isInitialized) return;
    const p = pathname || "/";
    const isPublic =
      p === "/student/login" ||
      p === "/student/setup-password" ||
      p === "/student/forgot-password" ||
      p.startsWith("/student/account-suspended");

    if (!isAuthenticated && !isPublic) {
      router.replace("/student/login");
      return;
    }
    if (isAuthenticated && user?.mustChangePassword && p !== "/student/setup-password") {
      router.replace("/student/setup-password");
      return;
    }
    if (isAuthenticated && (p === "/student/login" || p === "/")) {
      router.replace("/student/dashboard");
    }
  }, [isInitialized, isAuthenticated, user, pathname, router]);

  return <>{children}</>;
}
