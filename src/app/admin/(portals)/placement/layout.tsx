"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/admin/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/admin/config/navigation";

export default function PlacementLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Placement Portal" sections={PORTAL_NAVIGATION.placement}>
      {children}
    </PortalShell>
  );
}
