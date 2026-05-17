"use client";

import { useState, useCallback } from "react";
import {
  FileBarChart,
  Plus,
  Loader2,
  X,
  Download,
  FileText,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as Dialog from "@radix-ui/react-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useReportTemplates,
  useGeneratedReports,
  useGenerateReport,
} from "@/superadmin/lib/hooks/use-admin";
import { PageHeader } from "@/superadmin/components/shared/misc/page-header";
import { DataTable } from "@/superadmin/components/shared/data-table";
import { StatusBadge } from "@/superadmin/components/shared/feedback/status-badge";
import { DashboardSkeleton, TableSkeleton } from "@/superadmin/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/superadmin/components/shared/feedback/error-state";
import { EmptyState } from "@/superadmin/components/shared/feedback/empty-state";
import { FormField, FormSelect } from "@/superadmin/components/shared/forms/form-field";
import { formatDate, formatCompact } from "@/superadmin/lib/utils/format";
import type {
  ReportTemplate,
  GeneratedReport,
  ReportParameter,
} from "@/superadmin/lib/api/types/admin.types";

const CATEGORY_VARIANTS: Record<string, "default" | "success" | "warning" | "info" | "muted"> = {
  compliance: "warning",
  enrollment: "info",
  financial: "success",
  performance: "default",
  custom: "muted",
};

function getReportStatusVariant(
  status: GeneratedReport["status"]
): "success" | "warning" | "danger" {
  const map = {
    generating: "warning" as const,
    completed: "success" as const,
    failed: "danger" as const,
  };
  return map[status];
}

function GenerateReportDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
}) {
  const generateReport = useGenerateReport();
  const [successMsg, setSuccessMsg] = useState("");

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = useCallback(
    async (formData: Record<string, string>) => {
      if (!template) return;
      try {
        await generateReport.mutateAsync({
          templateId: template.id,
          parameters: formData,
        });
        setSuccessMsg("Report generation started. This typically takes 1-2 minutes. The report will appear in the Generated Reports section below when ready.");
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 2000);
      } catch {
        // error shown via mutation state
      }
    },
    [template, generateReport, reset, onOpenChange]
  );

  if (!template) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Generate Report
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {template.name} &mdash; {template.description}
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {template.parameters.map((param: ReportParameter) => {
              if (param.type === "select" && param.options) {
                return (
                  <FormSelect
                    key={param.name}
                    label={param.label}
                    options={param.options}
                    required={param.required}
                    placeholder={`Select ${param.label}`}
                    {...register(param.name)}
                  />
                );
              }
              return (
                <FormField
                  key={param.name}
                  label={param.label}
                  type={param.type === "date" ? "date" : "text"}
                  required={param.required}
                  placeholder={
                    param.type === "date" ? "" : `Enter ${param.label}`
                  }
                  {...register(param.name)}
                />
              );
            })}

            {template.parameters.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No additional parameters required. Click generate to proceed.
              </p>
            )}

            {generateReport.isError && (
              <p className="text-xs text-danger">
                Failed to generate report. Please try again.
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-success">{successMsg}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generateReport.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {generateReport.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Generate
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const reportColumns: ColumnDef<GeneratedReport, unknown>[] = [
  { accessorKey: "templateName", header: "Report" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as GeneratedReport["status"];
      return (
        <StatusBadge variant={getReportStatusVariant(status)} dot>
          {status}
        </StatusBadge>
      );
    },
  },
  { accessorKey: "generatedBy", header: "Generated By" },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(getValue() as string)}
      </span>
    ),
  },
  {
    accessorKey: "fileSize",
    header: "Size",
    cell: ({ getValue }) => {
      const size = getValue() as number | undefined;
      return size ? (
        <span className="text-xs text-muted-foreground">
          {formatCompact(size)} B
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "download",
    header: "",
    cell: ({ row }) => {
      const report = row.original;
      if (report.status !== "completed" || !report.downloadUrl) return null;
      return (
        <a
          href={report.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          <Download className="h-3 w-3" />
          Download
        </a>
      );
    },
  },
];

export default function AdminReportsPage() {
  const {
    data: templates,
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useReportTemplates();
  const {
    data: reportsData,
    isLoading: reportsLoading,
    isError: reportsError,
    refetch: refetchReports,
  } = useGeneratedReports({ page: 1, pageSize: 20 });

  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const handleTemplateClick = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerateDialogOpen(true);
  }, []);

  if (templatesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={FileBarChart}
          title="Reports"
          description="Generate and download institutional reports"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={FileBarChart}
        title="Reports"
        description="Generate and download institutional reports"
      />

      {/* Generate Report Section */}
      <div>
        <h2 className="mb-4 text-sm font-semibold">Generate Report</h2>
        {templatesError ? (
          <ErrorState
            title="Failed to load templates"
            message="Could not retrieve report templates."
            onRetry={() => refetchTemplates()}
          />
        ) : !templates || templates.length === 0 ? (
          <EmptyState
            title="No report templates"
            description="Report templates will appear here when configured."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="flex flex-col items-start rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-portal-accent/30 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-portal-accent" />
                  <h3 className="text-sm font-semibold">{template.name}</h3>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge
                    variant={CATEGORY_VARIANTS[template.category] || "muted"}
                  >
                    {template.category}
                  </StatusBadge>
                  {template.lastGenerated && (
                    <span className="text-xs text-muted-foreground">
                      Last: {formatDate(template.lastGenerated)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generated Reports Section */}
      <div>
        <h2 className="mb-4 text-sm font-semibold">Generated Reports</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Reports are generated asynchronously. Refresh the page to check for completed reports.
        </p>
        {reportsLoading ? (
          <TableSkeleton rows={5} />
        ) : reportsError ? (
          <ErrorState
            title="Failed to load reports"
            message="Could not retrieve generated reports."
            onRetry={() => refetchReports()}
          />
        ) : (
          <DataTable
            columns={reportColumns}
            data={reportsData?.reports ?? []}
            showSearch={false}
            emptyTitle="No generated reports"
            emptyDescription="Generate a report using the templates above."
          />
        )}
      </div>

      <GenerateReportDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
