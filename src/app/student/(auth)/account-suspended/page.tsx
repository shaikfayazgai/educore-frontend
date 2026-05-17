"use client";

import { Suspense } from "react";
import AccountSuspendedContent from "../account-suspended-content";

export default function AccountSuspendedPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <AccountSuspendedContent />
    </Suspense>
  );
}
