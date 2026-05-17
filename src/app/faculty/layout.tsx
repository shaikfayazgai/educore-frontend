"use client";

import { QueryProvider } from "@/faculty/lib/providers/query-provider";
import { ThemeProvider } from "@/faculty/lib/providers/theme-provider";
import { Toaster } from "sonner";

export default function FacultyRootLayout({ children }: { children: React.ReactNode }) {
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
