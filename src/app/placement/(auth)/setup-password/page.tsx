"use client";

import { Suspense } from "react";
import SetupPasswordContent from "../setup-password-content";

// Wrapped in Suspense because the content reads URL params via
// useSearchParams() — Next.js 15+ requires the boundary or `next build`
// fails the prerender step.
export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SetupPasswordContent />
    </Suspense>
  );
}
