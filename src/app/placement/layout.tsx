"use client";

import { QueryProvider } from "@/placement/lib/providers/query-provider";
import { ThemeProvider } from "@/placement/lib/providers/theme-provider";
import { Toaster } from "sonner";

export default function PlacementRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{ className: "bg-card text-card-foreground border-border" }}
        />
      </QueryProvider>
    </ThemeProvider>
  );
}
