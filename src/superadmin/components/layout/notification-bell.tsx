"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, AlertTriangle, Info, ShieldBan } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/superadmin/lib/api/client";
import type { ApiResponse } from "@/superadmin/lib/api/types/common.types";
import { cn } from "@/superadmin/lib/utils/cn";

interface SuperAdminNotification {
  id: string;
  type: "trash_deletion_warning" | "tenant_suspended" | "tenant_created" | string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  createdAt: string;
  tenantId: string;
  tenantName: string;
  universityCode: string;
}

function timeAgo(iso: string): string {
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return "";
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function severityStyles(sev: string): { ring: string; text: string; bg: string; Icon: typeof AlertTriangle } {
  switch (sev) {
    case "critical": return { ring: "ring-danger/40", text: "text-danger", bg: "bg-danger/10", Icon: AlertTriangle };
    case "warning":  return { ring: "ring-amber-400/40", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100/60 dark:bg-amber-500/10", Icon: ShieldBan };
    default:         return { ring: "ring-border", text: "text-muted-foreground", bg: "bg-muted/40", Icon: Info };
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["super-admin", "notifications"],
    queryFn: () => api.get<SuperAdminNotification[]>("/api/super-admin/notifications"),
    refetchInterval: 60_000,         // refetch every 60s
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    select: (res: ApiResponse<SuperAdminNotification[]>) => ({
      items: res.data ?? [],
      unread: (res.meta as { unreadCount?: number } | undefined)?.unreadCount ?? (res.data?.length ?? 0),
    }),
  });

  // Both mutations use OPTIMISTIC updates so the popover reflects the change
  // instantly — without waiting for the server round-trip + refetch.
  const dismiss = useMutation({
    mutationFn: (id: string) => api.post(`/api/super-admin/notifications/${id}/dismiss`),
    // Snapshot prev cache, remove the item locally, restore on error.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["super-admin", "notifications"] });
      const prev = qc.getQueryData<ApiResponse<SuperAdminNotification[]>>(
        ["super-admin", "notifications"],
      );
      if (prev) {
        const nextData = (prev.data ?? []).filter((n) => n.id !== id);
        // Cast through unknown — the notifications meta carries unreadCount /
        // generatedAt which aren't in the shared PaginationMeta type.
        qc.setQueryData(
          ["super-admin", "notifications"],
          {
            ...prev,
            data: nextData,
            meta: { ...(prev.meta ?? {}), unreadCount: nextData.length },
          } as unknown as ApiResponse<SuperAdminNotification[]>,
        );
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["super-admin", "notifications"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["super-admin", "notifications"] }),
  });

  const dismissAll = useMutation({
    mutationFn: () => api.post(`/api/super-admin/notifications/dismiss-all`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["super-admin", "notifications"] });
      const prev = qc.getQueryData<ApiResponse<SuperAdminNotification[]>>(
        ["super-admin", "notifications"],
      );
      qc.setQueryData(
        ["super-admin", "notifications"],
        {
          data: [],
          meta: { unreadCount: 0, generatedAt: new Date().toISOString() },
        } as unknown as ApiResponse<SuperAdminNotification[]>,
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["super-admin", "notifications"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["super-admin", "notifications"] }),
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  const handleAction = (n: SuperAdminNotification) => {
    // Navigate FIRST so the route change starts before the popover unmount
    // (otherwise Radix can swallow the click in some flows).
    router.push(n.actionHref);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[380px] overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border/30"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => dismissAll.mutate()}
                disabled={dismissAll.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[460px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  We&apos;ll show alerts here when something needs your attention.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {items.map((n) => {
                  const s = severityStyles(n.severity);
                  return (
                    <li key={n.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleAction(n)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                          s.bg, s.ring,
                        )}>
                          <s.Icon className={cn("h-4 w-4", s.text)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.message}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[11px]">
                            <span className="text-primary-600 font-medium">{n.actionLabel} →</span>
                            <span className="text-muted-foreground">{timeAgo(n.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        title="Dismiss"
                        aria-label="Dismiss notification"
                        onClick={(e) => { e.stopPropagation(); dismiss.mutate(n.id); }}
                        className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t border-border/30 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
              Refreshed every 60s · Real-time data from your platform
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
