"use client";

import { QueryProvider } from "@/admin/lib/providers/query-provider";
import { ThemeProvider } from "@/admin/lib/providers/theme-provider";
import { MswProvider } from "@/admin/lib/providers/msw-provider";
import { Toaster } from "sonner";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
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
