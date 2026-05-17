"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/superadmin/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/superadmin/config/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Administration" sections={PORTAL_NAVIGATION.admin}>
      {children}
    </PortalShell>
  );
}
