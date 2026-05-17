"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  GraduationCap,
  Mail,
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  User as UserIcon,
  KeyRound,
  Send,
} from "lucide-react";

import { cn } from "@/admin/lib/utils/cn";

/**
 * Lockout page shown when:
 *   * Login attempt rejected with ACCOUNT_SUSPENDED / ACCOUNT_DEACTIVATED, or
 *   * A mid-session API call returns 403 with one of those codes (handled by
 *     the global API client which redirects here).
 *
 * Polls /api/public/lockout-status every 30s — when the tenant is reactivated
 * by super-admin, we bounce the user to /login automatically.
 *
 * The contact form draft is persisted to sessionStorage so a re-login round
 * trip (when the lockoutToken expires) doesn't make the user retype.
 */

const PLATFORM_API =
  process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

const UNI_API = process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface PlatformErrorBody {
  error?: { code?: string; message?: string };
}

class PlatformError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PLATFORM_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  let body: unknown = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = (body as PlatformErrorBody)?.error;
    throw new PlatformError(
      err?.message || `Request failed (${res.status})`,
      err?.code || "REQUEST_FAILED",
      res.status,
    );
  }
  return body as T;
}

type IssueType = "suspended" | "deactivated" | "activate" | "queries" | "other";

const ISSUE_OPTIONS: { value: IssueType; label: string; description: string }[] = [
  { value: "suspended",   label: "Wrongly suspended",        description: "I believe my university was suspended in error" },
  { value: "deactivated", label: "Reactivate account",       description: "My account is deactivated — please reactivate" },
  { value: "activate",    label: "Activation request",       description: "Request to activate access for my account" },
  { value: "queries",     label: "General query / question", description: "I have a question for the platform team" },
  { value: "other",       label: "Other",                    description: "Doesn't fit any of the above" },
];

interface SupportContact {
  contactName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  helpText: string;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Best-effort base64-url JWT payload decode. Used only for displaying name/email
 *  — signature verification happens server-side at submit time. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (padded.length % 4)) % 4);
    return JSON.parse(atob(padded + padding));
  } catch { return null; }
}

function AccountSuspendedInner() {
  const router = useRouter();
  const params = useSearchParams();

  const message =
    params.get("reason") ||
    "Your account has been suspended by the platform administrator.";
  const variant = params.get("variant") === "deactivated" ? "deactivated" : "suspended";
  const email = params.get("email") || "";
  const isInactive = variant === "deactivated";

  // Role detection — used to switch between two UIs:
  //   * "admin"  → the main university admin (registered by super-admin); they
  //                see the "Contact Glimmora platform team" form because only
  //                Glimmora can lift their suspension.
  //   * other    → faculty / student / placement / research; they see the
  //                "Contact your university administration" card instead,
  //                because their issue is with their own admin, not Glimmora.
  // Source priority: URL ?role= (set by api-client mid-session bounce) →
  // lockout-token role claim (login-rejection path) → access-token role
  // (final fallback if access token still around).
  const [role, setRole] = useState<string>(params.get("role") || "");
  useEffect(() => {
    if (role) return;
    if (typeof window === "undefined") return;
    const lockoutTok = sessionStorage.getItem("glimmora_lockout_token") || "";
    const lockoutPayload = lockoutTok ? decodeJwtPayload(lockoutTok) : null;
    if (lockoutPayload && typeof lockoutPayload.role === "string" && lockoutPayload.role) {
      setRole(lockoutPayload.role);
      return;
    }
    const accessTok = localStorage.getItem("glimmora_access_token") || "";
    const accessPayload = accessTok ? decodeJwtPayload(accessTok) : null;
    if (accessPayload && typeof accessPayload.role === "string" && accessPayload.role) {
      setRole(accessPayload.role);
    }
  }, [role]);
  const isMainAdmin = role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [contact, setContact] = useState<SupportContact | null>(null);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    setNow(new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }));
  }, []);

  // Auto-bounce when super-admin reactivates the tenant. Poll every 30s.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = sessionStorage.getItem("glimmora_lockout_token");
    if (!token) {
      setStatusChecked(true);
      return;
    }
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await platformFetch<{
          data: { status: "active" | "blocked"; variant?: "suspended" | "deactivated" };
        }>("/api/public/lockout-status", {
          method: "POST",
          body: JSON.stringify({ lockoutToken: token }),
        });
        if (cancelled) return;
        if (res.data.status === "active") {
          sessionStorage.removeItem("glimmora_lockout_token");
          localStorage.removeItem("glimmora_access_token");
          localStorage.removeItem("glimmora_refresh_token");
          const reason = encodeURIComponent(
            "Your suspension has been removed by the platform admin. Please sign in to continue.",
          );
          window.location.replace(`/admin/login?reason=${reason}&reactivated=1`);
          return;
        }
        setStatusChecked(true);
      } catch {
        if (!cancelled) setStatusChecked(true);
      }
    };
    ping();
    const id = window.setInterval(ping, 30_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  // Pull the tenant-admin-editable support contact card. Best-effort.
  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined"
      ? sessionStorage.getItem("glimmora_lockout_token") || ""
      : "";
    if (!token) return;
    fetch(`${UNI_API}/api/public/support-contact?lockoutToken=${encodeURIComponent(token)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((body) => { if (!cancelled) setContact(body.data || null); })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  if (!statusChecked) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
          <GraduationCap className="h-6 w-6 text-background" />
        </div>
        <span className="text-xl font-semibold tracking-tight">Glimmora</span>
      </div>

      {/* Hero — gradient ring + soft halo */}
      <div className="text-center">
        <div className="relative mx-auto h-20 w-20">
          <div
            className={cn(
              "absolute inset-0 rounded-full opacity-30 blur-2xl",
              isInactive ? "bg-warning-400" : "bg-danger",
            )}
            aria-hidden
          />
          <div
            className={cn(
              "relative flex h-full w-full items-center justify-center rounded-full ring-8 ring-offset-0",
              isInactive
                ? "bg-warning-500 ring-warning-100 dark:ring-warning-500/20"
                : "bg-danger ring-danger-light dark:ring-danger/20",
            )}
          >
            <Ban className="h-9 w-9 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {isInactive ? "Account Deactivated" : "Account Suspended"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isInactive
            ? "Your university account is currently inactive."
            : "Your university has been suspended by the platform administrator."}
        </p>
      </div>

      {/* Reason / message panel */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4",
          isInactive
            ? "border-warning-500/30 bg-warning-50/80 dark:bg-warning-500/10"
            : "border-danger/20 bg-danger-light",
        )}
      >
        <AlertCircle
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            isInactive ? "text-warning-700 dark:text-warning-400" : "text-danger",
          )}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={cn(
            "text-sm leading-relaxed",
            isInactive ? "text-warning-800 dark:text-warning-200" : "text-danger",
          )}>{message}</p>
          {email && (
            <p className="text-xs text-muted-foreground">
              Account: <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tenant support contact (only when admin has set one) */}
      {contact && (contact.contactName || contact.email || contact.phone) && (
        <div className="space-y-2.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold">Contact your administration</p>
            {contact.helpText && (
              <p className="mt-0.5 text-xs text-muted-foreground">{contact.helpText}</p>
            )}
          </div>
          <div className="grid gap-2 text-xs">
            {contact.contactName && (
              <span className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> {contact.contactName}
              </span>
            )}
            {contact.email && (
              <a className="flex items-center gap-2 text-portal-accent hover:underline" href={`mailto:${contact.email}`}>
                <Mail className="h-3.5 w-3.5" /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a className="flex items-center gap-2 text-portal-accent hover:underline" href={`tel:${contact.phone}`}>
                <Phone className="h-3.5 w-3.5" /> {contact.phone}
              </a>
            )}
            {contact.alternatePhone && (
              <a className="flex items-center gap-2 text-portal-accent hover:underline" href={`tel:${contact.alternatePhone}`}>
                <Phone className="h-3.5 w-3.5" /> {contact.alternatePhone}{" "}
                <span className="text-muted-foreground">(alt)</span>
              </a>
            )}
          </div>
        </div>
      )}

      {isMainAdmin ? (
        // Main university admin — only path that can reach the Glimmora team.
        !showForm ? (
          <>
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">What you can do next</p>
              <ul className="space-y-2.5 text-xs">
                <NextStep Icon={MessageSquarePlus} title="Send a query to the platform team"
                  body="Use the form below to explain your situation. We respond by email." />
                <NextStep Icon={AlertCircle} title="Send as many queries as you need"
                  body="There's no cap — every query reaches the platform team." />
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 rounded-lg font-medium text-sm transition-colors",
                  "bg-foreground text-background hover:bg-foreground/90",
                )}
              >
                <MessageSquarePlus className="h-4 w-4" />
                Contact Glimmora platform team
              </button>
              <button
                type="button"
                onClick={() => router.replace("/admin/login")}
                className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <ContactSupportForm variant={variant} email={email} onClose={() => setShowForm(false)} />
        )
      ) : (
        // Faculty / student / placement / research — they need to talk to
        // their own university admin, NOT Glimmora.
        <>
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">What you can do next</p>
            <ul className="space-y-2.5 text-xs">
              <NextStep Icon={UserIcon} title="Reach out to your university administration"
                body="They can re-enable your account or escalate to Glimmora on your behalf." />
              <NextStep Icon={AlertCircle} title="This page will refresh automatically"
                body="When access is restored, we'll send you back to sign-in." />
            </ul>
          </div>

          {/* Fallback contact card when the admin hasn't set one yet */}
          {!(contact && (contact.contactName || contact.email || contact.phone)) && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">No support contact set yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your university administration hasn&apos;t published a support
                contact. Reach out through your usual department channel.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.replace("/admin/login")}
            className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Back to sign in
          </button>
        </>
      )}

      {now && (
        <p className="text-center text-[11px] text-muted-foreground/70">
          Checked at {now}
        </p>
      )}
    </div>
  );
}

function NextStep({ Icon, title, body }: {
  Icon: typeof Mail;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-portal-accent" strokeWidth={2.25} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium leading-snug">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

/* ── Form draft persistence (so re-login round-trips don't lose typing) ── */

const DRAFT_KEY = "glimmora_lockout_draft_v1";

interface FormDraft {
  name: string;
  issueType: IssueType;
  issueDate: string;
  comment: string;
}

function loadDraft(): FormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as FormDraft) : null;
  } catch { return null; }
}

function saveDraft(d: FormDraft): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* quota */ }
}

function clearDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}

function ContactSupportForm({
  variant, email: initialEmail, onClose,
}: {
  variant: "suspended" | "deactivated";
  email: string;
  onClose: () => void;
}) {
  const initialDraft = typeof window !== "undefined" ? loadDraft() : null;
  const [name, setName] = useState(initialDraft?.name || "");
  const [issueType, setIssueType] = useState<IssueType>(initialDraft?.issueType || variant);
  const [issueDate, setIssueDate] = useState(initialDraft?.issueDate || todayISO());
  const [comment, setComment] = useState(initialDraft?.comment || "");

  // Persist draft on every change so a re-login round-trip preserves it.
  useEffect(() => {
    saveDraft({ name, issueType, issueDate, comment });
  }, [name, issueType, issueDate, comment]);

  const [lockoutToken, setLockoutToken] = useState<string>("");
  const [tokenEmail, setTokenEmail] = useState<string>("");
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = sessionStorage.getItem("glimmora_lockout_token") || "";
    setLockoutToken(t);
    if (t) {
      const payload = decodeJwtPayload(t);
      if (payload) {
        setTokenEmail(typeof payload.sub === "string" ? payload.sub : "");
        setTokenName(typeof payload.name === "string" ? payload.name : "");
        if (typeof payload.exp === "number") {
          setTokenExpired(payload.exp * 1000 <= Date.now());
        }
      } else {
        setTokenExpired(true);
      }
    } else {
      setTokenExpired(true);
    }
  }, []);

  // Fall back to the regular access JWT email when no fresh lockout token.
  const [accessTokenEmail, setAccessTokenEmail] = useState<string>("");
  const [accessTokenName, setAccessTokenName] = useState<string>("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const at = localStorage.getItem("glimmora_access_token") || "";
    if (!at) return;
    const payload = decodeJwtPayload(at);
    if (!payload) return;
    if (typeof payload.email === "string") setAccessTokenEmail(payload.email);
    if (typeof payload.name === "string") setAccessTokenName(payload.name);
  }, []);

  const displayEmail = initialEmail || tokenEmail || accessTokenEmail;

  // Auto-fill name from any available source.
  useEffect(() => {
    const candidate = tokenName || accessTokenName;
    if (candidate && !name) setName(candidate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenName, accessTokenName]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const charCount = comment.length;
  const minChars = 10;
  const maxChars = 2000;

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    e.preventDefault();
    setError(null);
    if (charCount < minChars) {
      setError(`Please describe your issue (at least ${minChars} characters).`);
      return;
    }
    if (!lockoutToken || tokenExpired) {
      setError("Your session expired. Use the 'Sign in to submit' button below — your draft is saved.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await platformFetch<{ data: { id: string } }>(
        `/api/public/complaints`,
        {
          method: "POST",
          body: JSON.stringify({ lockoutToken, name, issueType, issueDate, comment }),
        },
      );
      setSubmittedId(res.data.id);
      sessionStorage.removeItem("glimmora_lockout_token");
      clearDraft();  // submission succeeded — drop the draft
    } catch (err) {
      if (err instanceof PlatformError) {
        if (err.code === "LOCKOUT_TOKEN_EXPIRED") {
          setError("Your session expired. Use the 'Sign in to submit' button below — your draft is saved.");
          setTokenExpired(true);
        } else {
          setError(err.message);
        }
      } else {
        setError("Could not submit. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success state ─────────────────────────────────────────────────────────
  if (submittedId) {
    return (
      <div className="space-y-4 rounded-xl border border-success-200 bg-success-50 p-6 text-center shadow-sm dark:border-success-500/30 dark:bg-success-500/10">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-500 ring-8 ring-success-100 dark:ring-success-500/20">
          <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-success-800 dark:text-success-200">Query received</h2>
          <p className="text-xs text-success-700 dark:text-success-300">
            Reference <span className="font-mono font-semibold">{submittedId.slice(0, 8)}</span>
          </p>
        </div>
        <p className="text-xs leading-relaxed text-success-800 dark:text-success-300">
          Our team will respond by email. You can send as many queries as you need —
          we&apos;ll get back to you on each one.
        </p>
        <p className="text-xs leading-relaxed text-success-800 dark:text-success-300">
          When the platform admin lifts your suspension, this page will refresh
          and send you back to sign-in automatically.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-success-300/60 bg-background px-4 text-xs font-medium text-success-800 hover:bg-success-100/60 dark:border-success-500/40 dark:text-success-200 dark:hover:bg-success-500/10"
        >
          Back to lockout page
        </button>
      </div>
    );
  }

  // Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">Contact support</h2>
        <p className="text-xs text-muted-foreground">Send a query to the platform administrator.</p>
      </div>

      {/* Token-expired banner — visually prominent, with one clear action */}
      {tokenExpired && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning-500/40 bg-warning-50 p-4 shadow-sm dark:bg-warning-500/10 sm:flex-row sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-500 text-white">
            <KeyRound className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-semibold text-warning-900 dark:text-warning-200">
              Your sign-in session has expired
            </p>
            <p className="text-xs text-warning-800 dark:text-warning-300">
              Sign in again to refresh it. Your draft is saved on this tab and will be restored.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-light p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="cf-name" className="text-sm font-medium leading-none">Name</label>
          <input id="cf-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name" required
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Email</label>
          <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm">
            <span className={cn(
              "truncate flex-1",
              displayEmail ? "font-medium text-foreground" : "italic text-muted-foreground",
            )}>
              {displayEmail || "Not detected — please sign in again"}
            </span>
            {displayEmail && (
              <span className="shrink-0 rounded-md bg-success-500/10 px-2 py-0.5 text-[10px] font-semibold text-success-700 ring-1 ring-success-500/30 dark:text-success-300">
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Verified at sign-in — submitted with your query.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="cf-date" className="text-sm font-medium leading-none">Issue date</label>
            <input id="cf-date" type="date" value={issueDate} max={todayISO()}
              onChange={(e) => setIssueDate(e.target.value)} required
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1" />
          </div>
          <div className="space-y-2">
            <label htmlFor="cf-type" className="text-sm font-medium leading-none">Issue type</label>
            <select id="cf-type" value={issueType} onChange={(e) => setIssueType(e.target.value as IssueType)}
              required
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1">
              {ISSUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <p className="-mt-1 text-xs italic text-muted-foreground">
          {ISSUE_OPTIONS.find((o) => o.value === issueType)?.description}
        </p>

        <div className="space-y-2">
          <label htmlFor="cf-comment" className="text-sm font-medium leading-none">Tell us what happened</label>
          <textarea id="cf-comment" value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, maxChars))}
            placeholder="Describe the issue, what you expected, and any context."
            rows={5} required
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1" />
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "font-medium",
              charCount < minChars
                ? "text-warning-700 dark:text-warning-400"
                : "text-success-700 dark:text-success-400",
            )}>
              {charCount < minChars ? `${minChars - charCount} more chars to go` : "Looks good"}
            </span>
            <span className="font-mono text-muted-foreground tabular-nums">
              {charCount} / {maxChars}
            </span>
          </div>
        </div>
      </div>

      {/* Action row — when token expired, replace Submit with the recovery CTA */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" onClick={onClose} disabled={submitting}
          className="flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
          Cancel
        </button>

        {tokenExpired ? (
          <button
            type="button"
            onClick={() => {
              // Draft is already saved — just clear the stale token and bounce.
              sessionStorage.removeItem("glimmora_lockout_token");
              window.location.assign("/admin/login");
            }}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-warning-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-warning-700"
          >
            <KeyRound className="h-4 w-4" />
            Sign in to submit
          </button>
        ) : (
          <button type="submit" disabled={submitting}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
              : <><Send className="h-4 w-4" />Submit query</>}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Or email{" "}
        <Link href="mailto:support@glimmora.dev" className="font-medium text-portal-accent hover:underline">
          support@glimmora.dev
        </Link>
        .
      </p>
    </form>
  );
}

export default function AccountSuspendedPage() {
  return (
    <Suspense fallback={null}>
      <AccountSuspendedInner />
    </Suspense>
  );
}
