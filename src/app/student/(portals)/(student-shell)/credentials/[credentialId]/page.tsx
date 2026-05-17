"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Building2,
  Shield,
  Link2,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useCredentialDetail } from "@/student/lib/hooks/use-student";
import { PageHeader } from "@/student/components/shared/misc/page-header";
import { StatusBadge } from "@/student/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/student/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/student/components/shared/feedback/error-state";
import { cn } from "@/student/lib/utils/cn";
import { formatDate } from "@/student/lib/utils/format";
import type { CredentialStatus } from "@/student/lib/api/types/common.types";

function getCredentialStatusVariant(status: CredentialStatus) {
  const map: Record<CredentialStatus, "success" | "danger" | "warning" | "info" | "muted"> = {
    active: "success",
    revoked: "danger",
    expired: "warning",
    pending_verification: "info",
  };
  return map[status] || "muted";
}

export default function StudentCredentialDetailPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = use(params);
  const { data: credential, isLoading, isError, refetch } = useCredentialDetail(credentialId);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !credential) return <ErrorState onRetry={() => refetch()} />;

  const handleCopyHash = async () => {
    if (credential.verificationHash) {
      await navigator.clipboard.writeText(credential.verificationHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (credential.verificationUrl) {
      await navigator.clipboard.writeText(credential.verificationUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleAddToLinkedIn = () => {
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(credential.title)}&organizationName=${encodeURIComponent(credential.issuer)}&issueYear=${new Date(credential.issuedDate).getFullYear()}&issueMonth=${new Date(credential.issuedDate).getMonth() + 1}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Link
        href="/student/credentials"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Credentials
      </Link>

      {/* Expired Credential Banner */}
      {credential.status === "expired" && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
          <p className="flex-1 text-sm text-warning">
            This credential expired on {formatDate(credential.expiryDate!)}.
          </p>
          <a
            href={`mailto:registrar@university.edu?subject=Credential Renewal Request&body=I would like to request renewal of my credential: ${credential.title}`}
            className="whitespace-nowrap text-sm font-medium text-warning underline hover:text-warning/80"
          >
            Request Renewal
          </a>
        </div>
      )}

      {/* Credential Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="muted">{credential.type}</StatusBadge>
              <StatusBadge variant={getCredentialStatusVariant(credential.status)} dot>
                {credential.status.replace("_", " ")}
              </StatusBadge>
            </div>
            <h1 className="mt-3 text-xl font-semibold">{credential.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{credential.description}</p>
          </div>
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-portal-accent-light">
            <BadgeCheck className="h-7 w-7 text-portal-accent" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {credential.issuer}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Issued: {formatDate(credential.issuedDate)}
          </span>
          {credential.expiryDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Expires: {formatDate(credential.expiryDate)}
            </span>
          )}
        </div>
      </div>

      {/* Verification Section */}
      {(credential.verificationHash || credential.verificationUrl) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Verification</h2>
          </div>

          {credential.verificationHash && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Verification Hash</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden truncate rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs">
                  {credential.verificationHash}
                </code>
                <button
                  onClick={handleCopyHash}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
                  aria-label="Copy hash"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-success">Copied to clipboard</p>
              )}
            </div>
          )}

          {credential.verificationUrl && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Verification URL</p>
              <a
                href={credential.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-portal-accent hover:underline"
              >
                {credential.verificationUrl}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            This credential is secured using blockchain verification. Share the verification link with employers or institutions to prove authenticity.
          </p>
        </div>
      )}

      {/* Share & Export */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Share & Export</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {linkCopied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Copy Share Link
              </>
            )}
          </button>
          <button
            onClick={handleAddToLinkedIn}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            Add to LinkedIn
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Download Certificate
          </button>
        </div>
      </div>

      {/* Skills */}
      {credential.skills.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Associated Skills</h2>
          <div className="flex flex-wrap gap-2">
            {credential.skills.map((skill) => (
              <StatusBadge key={skill} variant="default">
                {skill}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {Object.keys(credential.metadata).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Metadata</h2>
          <div className="space-y-2">
            {Object.entries(credential.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
