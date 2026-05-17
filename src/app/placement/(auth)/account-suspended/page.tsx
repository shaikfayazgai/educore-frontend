"use client";

import { Suspense } from "react";
import AccountSuspendedContent from "../account-suspended-content";

// Wrapped in Suspense because the content reads URL params via
// useSearchParams() — same boundary requirement as the superadmin login.
export default function AccountSuspendedPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <AccountSuspendedContent />
    </Suspense>
  );
}
