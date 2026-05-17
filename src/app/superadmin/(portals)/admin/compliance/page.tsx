"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSearch,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCompliancePulse,
  useComplianceDeviations,
  useResolveDeviation,
} from "@/superadmin/lib/hooks/use-admin";
import {
  resolveDeviationSchema,
  type ResolveDeviationFormData,
} from "@/superadmin/lib/schemas/admin.schema";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { GaugeChart } from "@/superadmin/components/shared/charts/gauge-chart";
import {
  StatusBadge,
  getComplianceVariant,
  getRiskVariant,
} from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { FormTextarea } from "@/superadmin/components/shared/forms/form-field";
import { formatRelative } from "@/superadmin/lib/utils/format";

const COMPLIANCE_LABEL: Record<string, string> = {
  compliant: "Compliant",
  at_risk: "At Risk",
  non_compliant: "Non-Compliant",
};

function ComplianceCategoryCard({
  category,
}: {
  category: {
    name: string;
    score: number;
    status: "compliant" | "at_risk" | "non_compliant";
    items: {
      name: string;
      status: "pass" | "fail" | "warning";
      detail: string;
    }[];
  };
}) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pass: <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />,
    fail: <XCircle className="h-4 w-4 flex-shrink-0 text-danger" />,
    warning: <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />,
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">{category.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Score: {category.score}/100
            </p>
          </div>
        </div>
        <StatusBadge variant={getComplianceVariant(category.status)} dot>
          {COMPLIANCE_LABEL[category.status]}
        </StatusBadge>
      </button>
      {expanded && category.items.length > 0 && (
        <div className="border-t border-border">
          {category.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              {statusIcon[item.status]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
              <StatusBadge
                variant={
                  item.status === "pass"
                    ? "success"
                    : item.status === "fail"
                      ? "danger"
                      : "warning"
                }
              >
                {item.status}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeviationResolveForm({
  deviationId,
  onDone,
}: {
  deviationId: string;
  onDone: () => void;
}) {
  const resolveMutation = useResolveDeviation();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResolveDeviationFormData>({
    resolver: zodResolver(resolveDeviationSchema),
  });

  const onSubmit = useCallback(
    async (formData: ResolveDeviationFormData) => {
      try {
        await resolveMutation.mutateAsync({
          id: deviationId,
          resolution: formData.resolution,
        });
        setSuccessMsg("Deviation resolved successfully.");
        setTimeout(onDone, 1500);
      } catch {
        // error shown via mutation state
      }
    },
    [deviationId, resolveMutation, onDone]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3">
      <FormTextarea
        label="Resolution"
        placeholder="Describe the corrective action taken to resolve this deviation..."
        error={errors.resolution?.message}
        required
        {...register("resolution")}
      />
      {resolveMutation.isError && (
        <p className="text-xs text-danger">
          Failed to resolve deviation. Please try again.
        </p>
      )}
      {successMsg && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-success">{successMsg}</p>
          <Link
            href="/admin/compliance/audit-trail"
            className="text-xs font-medium text-portal-accent underline-offset-2 hover:underline"
          >
            View in Audit Trail &rarr;
          </Link>
        </div>
      )}
      <button
        type="submit"
        disabled={resolveMutation.isPending}
        className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
      >
        {resolveMutation.isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}
        Submit Resolution
      </button>
    </form>
  );
}

export default function AdminCompliancePage() {
  const { data: pulse, isLoading, isError, refetch } = useCompliancePulse();
  const { data: deviations } = useComplianceDeviations();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="Compliance"
          description="Regulatory compliance monitoring and deviation management"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !pulse) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="Compliance"
          description="Regulatory compliance monitoring and deviation management"
        />
        <ErrorState
          title="Failed to load compliance data"
          message="Could not retrieve compliance information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Compliance"
        description="Regulatory compliance monitoring and deviation management"
        actions={
          <Link
            href="/admin/compliance/audit-trail"
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <FileSearch className="h-4 w-4" />
            Audit Trail
          </Link>
        }
      />

      {/* Overall Score + Frameworks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <GaugeChart
            label="Overall Compliance Score"
            value={pulse.overallScore}
            size="lg"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Score reflects compliance across GDPR, FERPA, and institutional
            policies. Updated automatically.
          </p>
        </div>
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Framework Scores</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pulse.frameworkScores.map((fw) => (
              <div
                key={fw.framework}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-medium">{fw.framework}</p>
                  <p className="mt-1 text-2xl font-semibold">{fw.score}</p>
                </div>
                <StatusBadge variant={getComplianceVariant(fw.status)} dot>
                  {COMPLIANCE_LABEL[fw.status]}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Compliance Categories</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pulse.categories.map((cat) => (
            <ComplianceCategoryCard key={cat.name} category={cat} />
          ))}
        </div>
      </div>

      {/* Deviations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold">Compliance Deviations</h3>
        </div>
        {!deviations || deviations.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No deviations found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {deviations.map((dev) => (
              <div key={dev.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{dev.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{dev.category}</span>
                      <span>&middot;</span>
                      <span>
                        Detected {formatRelative(dev.detectedAt)}
                      </span>
                      {dev.assignedTo && (
                        <>
                          <span>&middot;</span>
                          <span>Assigned to {dev.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={getRiskVariant(dev.severity)}>
                      {dev.severity}
                    </StatusBadge>
                    {dev.resolvedAt ? (
                      <StatusBadge variant="success" dot>
                        Resolved
                      </StatusBadge>
                    ) : (
                      <button
                        onClick={() =>
                          setResolvingId(
                            resolvingId === dev.id ? null : dev.id
                          )
                        }
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
                {dev.resolution && (
                  <div className="mt-2 rounded-lg bg-success-light/50 px-3 py-2 text-xs text-success">
                    Resolution: {dev.resolution}
                  </div>
                )}
                {resolvingId === dev.id && !dev.resolvedAt && (
                  <DeviationResolveForm
                    deviationId={dev.id}
                    onDone={() => setResolvingId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
