"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/admin/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/admin/config/navigation";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Student Portal" sections={PORTAL_NAVIGATION.student}>
      {children}
    </PortalShell>
  );
}
