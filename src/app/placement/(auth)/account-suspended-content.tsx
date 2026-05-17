"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Mail, Phone, User as UserIcon } from "lucide-react";

export default function AccountSuspendedContent() {
  const params = useSearchParams();
  // Two callers feed this page:
  //   1. Login response 403 — sends `code=ACCOUNT_SUSPENDED|ACCOUNT_DEACTIVATED`
  //   2. Mid-session API client bounce (lib/api/client.ts) — sends
  //      `variant=suspended|deactivated` + reason/email/role
  // Accept both shapes so we don't have to fork the page per caller.
  const code = params?.get("code") ?? "ACCOUNT_SUSPENDED";
  const variant = params?.get("variant") ?? "";
  const email = params?.get("email") ?? "";
  const inactive =
    code === "ACCOUNT_DEACTIVATED" || variant === "deactivated";

  const contactName = params?.get("contactName") || "";
  const contactEmail = params?.get("contactEmail") || "";
  const contactPhone = params?.get("contactPhone") || "";
  const contactAlt = params?.get("contactAlt") || "";
  const helpText = params?.get("helpText") || "";

  const hasContact = contactEmail || contactPhone;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-light">
          <ShieldAlert className="h-6 w-6 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {inactive ? "Account inactive" : "Account suspended"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {inactive
              ? "Your placement officer account is currently inactive. Contact your university administration to reactivate it."
              : "Your placement officer account has been suspended. Contact your university administration for next steps."}
          </p>
        </div>
      </div>

      {email && (
        <p className="text-sm text-muted-foreground">
          Sign-in email: <span className="font-medium text-foreground">{email}</span>
        </p>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h2 className="text-sm font-semibold">Please contact your administration</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {helpText || "Share your full name, registered email, phone number, and an alternate phone number."}
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span>{contactName || "University Admin / Registrar"}</span>
          </div>
          {contactEmail ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${contactEmail}`} className="text-portal-accent hover:underline">{contactEmail}</a>
            </div>
          ) : !hasContact && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Contact your institution directly</span>
            </div>
          )}
          {contactPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${contactPhone}`} className="text-portal-accent hover:underline">{contactPhone}</a>
            </div>
          )}
          {contactAlt && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Alternate: {contactAlt}</span>
            </div>
          )}
        </div>
      </div>

      <Link href="/placement/login" className="inline-block rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
        Back to login
      </Link>
    </div>
  );
}
