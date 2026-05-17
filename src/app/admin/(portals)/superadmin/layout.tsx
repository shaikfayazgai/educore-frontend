import { DM_Sans } from "next/font/google";
import { SuperAdminShell } from "@/admin/components/layout/super-admin-shell";
import type { ReactNode } from "react";

const dmSans = DM_Sans({
  variable: "--font-sa",
  subsets: ["latin"],
});

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={dmSans.variable} data-portal="super-admin">
      <SuperAdminShell>{children}</SuperAdminShell>
    </div>
  );
}
