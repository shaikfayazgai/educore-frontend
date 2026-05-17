"use client";

import { QueryProvider } from "@/superadmin/lib/providers/query-provider";
import { ThemeProvider } from "@/superadmin/lib/providers/theme-provider";
import { MswProvider } from "@/superadmin/lib/providers/msw-provider";
import { Toaster } from "sonner";

export default function SuperAdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MswProvider>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            closeButton
            toastOptions={{ className: "bg-card text-card-foreground border-border" }}
          />
        </QueryProvider>
      </MswProvider>
    </ThemeProvider>
  );
}
