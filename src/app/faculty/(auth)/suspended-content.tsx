"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertOctagon, ExternalLink, Phone, Mail, ArrowLeft } from "lucide-react";

import { api, ApiError, sessionStore } from "@/faculty/lib/api/client";

interface SuspendedInfo {
  universityName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactPhoneAlt: string | null;
  contactEmail: string | null;
  supportUrl?: string | null;
  suspensionReason: string | null;
  status: string;
}

export default function SuspendedContent() {
  const router = useRouter();
  const params = useSearchParams();
  const scope = params.get("scope") ?? "tenant";

  const [info, setInfo] = useState<SuspendedInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStore.lockoutToken;
    const stashed = sessionStore.readSuspendedPayload();
    const stashedMessage =
      typeof stashed?.message === "string" ? stashed.message : null;
    const fallbackMessage: string =
      stashedMessage ??
      (scope === "account"
        ? "Your account has been suspended or deactivated by the platform administrator."
        : "Your university has been suspended or deactivated by the platform administrator.");

    async function load() {
      setLoading(true);
      try {
        const url = token
          ? `/api/faculty/auth/suspended-info?token=${encodeURIComponent(token)}`
          : "/api/faculty/auth/suspended-info";
        const res = await api.get<SuspendedInfo>(url);
        setInfo(res.data);
      } catch (err) {
        // Even when the lookup fails we still render a useful fallback.
        const msg: string =
          err instanceof ApiError ? err.message : "Unable to load suspension details.";
        setInfo({
          universityName: null,
          contactName: null,
          contactPhone: null,
          contactPhoneAlt: null,
          contactEmail: null,
          suspensionReason: msg || fallbackMessage,
          status: scope === "account" ? "suspended" : "suspended",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scope]);

  function tryAgain() {
    sessionStore.clearLockout();
    router.replace("/faculty/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-light text-danger">
          <AlertOctagon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Access restricted</h1>
          <p className="text-sm text-muted-foreground">
            {scope === "account" ? "Account-level lock" : "University-level lock"}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading details…</p>
      ) : (
        <>
          {info?.suspensionReason && (
            <div className="rounded-lg border border-danger/20 bg-danger-light p-3">
              <p className="text-sm text-danger">{info.suspensionReason}</p>
            </div>
          )}

          <section className="space-y-1">
            <h2 className="text-sm font-medium">Contact your management</h2>
            <p className="text-xs text-muted-foreground">
              Reach out to the people below to restore access. Your faculty, student,
              and placement teammates from the same university have also been signed
              out automatically.
            </p>
          </section>

          <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
            <Row label="University" value={info?.universityName} />
            <Row label="Contact name" value={info?.contactName} />
            <Row
              label="Phone"
              value={info?.contactPhone}
              href={info?.contactPhone ? `tel:${info.contactPhone}` : undefined}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
            <Row
              label="Alternative phone"
              value={info?.contactPhoneAlt}
              href={info?.contactPhoneAlt ? `tel:${info.contactPhoneAlt}` : undefined}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
            <Row
              label="Email"
              value={info?.contactEmail}
              href={info?.contactEmail ? `mailto:${info.contactEmail}` : undefined}
              icon={<Mail className="h-3.5 w-3.5" />}
            />
            {info?.supportUrl && (
              <Row
                label="Support"
                value={info.supportUrl}
                href={info.supportUrl}
                icon={<ExternalLink className="h-3.5 w-3.5" />}
              />
            )}
          </div>

          <button
            type="button"
            onClick={tryAgain}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Try signing in again
          </button>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value?: string | null;
  href?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border py-1.5 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {value ? (
        href ? (
          <a className="flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline" href={href}>
            {icon}
            {value}
          </a>
        ) : (
          <span className="text-sm text-foreground">{value}</span>
        )
      ) : (
        <span className="text-sm italic text-muted-foreground">Not provided</span>
      )}
    </div>
  );
}
