"use client";

import { Suspense } from "react";
import SuspendedContent from "../suspended-content";

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SuspendedContent />
    </Suspense>
  );
}
