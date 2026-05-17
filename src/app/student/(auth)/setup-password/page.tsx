"use client";

import { Suspense } from "react";
import SetupPasswordContent from "../setup-password-content";

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SetupPasswordContent />
    </Suspense>
  );
}
