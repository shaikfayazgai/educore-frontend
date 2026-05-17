"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/faculty/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/faculty/config/navigation";

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Faculty Portal" sections={PORTAL_NAVIGATION.faculty}>
      {children}
    </PortalShell>
  );
}
