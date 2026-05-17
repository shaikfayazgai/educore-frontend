"use client";

/**
 * Bulk-import universities from a CSV or XLSX file.
 *
 * Flow:
 *   1. Pick a file
 *   2. Auto-fires a server-side dry-run → shows a per-row preview table.
 *      Duplicates / invalid rows are highlighted in red.
 *   3. User clicks Import → server actually creates the OK rows. The same
 *      table stays visible, with each row's status updated:
 *        - "Created"     (green)  for newly inserted tenants
 *        - "Duplicate"   (red)    for rows that collided with existing data
 *        - "Invalid"     (red)    for rows with bad fields
 *   4. Imported tenants are UNVERIFIED — verify each individually via
 *      Send Invitation.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  useImportUniversities,
  type ImportRowResult,
  type ImportRowErrorCode,
} from "@/superadmin/lib/hooks/use-super-admin";
import { cn } from "@/superadmin/lib/utils/cn";

const REQUIRED_COLUMNS = [
  "name",
  "shortName",
  "universityCode",
  "domain",
  "city",
  "country",
  "adminEmail",
  "adminName",
];

const OPTIONAL_COLUMNS = [
  "state",
  "pinCode",
  "countryCode",
  "universityType",
  "adminPhone",
  "adminDesignation",
];

// Sample CSV — required columns first, then optional columns, with a couple of
// realistic rows. Every column appears in the header so users can see exactly
// what's accepted.
const SAMPLE_CSV = `name,shortName,universityCode,domain,city,state,pinCode,country,countryCode,universityType,adminEmail,adminName,adminPhone,adminDesignation
Acme University,ACME,AC01,acme.edu,New York,New York,10001,USA,+1,private,admin@acme.edu,Alice Adams,5551234567,Registrar
Santhiram Engineering College,SREC,SR12,srec.in,Nandyal,Andhra Pradesh,518501,India,+91,private,admin@srec.in,Shaik Fayaz,9876543210,Registrar
Bridgetown Tech,BTECH,BT02,btech.ac.uk,London,England,SW1A 1AA,UK,+44,state,admin@btech.ac.uk,Bob Brown,2071234567,Provost
`;

const ERROR_LABEL: Record<ImportRowErrorCode, string> = {
  DUPLICATE_EMAIL: "Duplicate email",
  DUPLICATE_CODE: "Duplicate code",
  MISSING_FIELDS: "Missing fields",
  INVALID_CODE: "Invalid code",
  INVALID_EMAIL: "Invalid email",
  VALIDATION_ERROR: "Invalid",
  DB_ERROR: "DB error",
};

type Phase = "pick" | "preview" | "committed";

export function ImportUniversitiesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("pick");
  // Tracks which preview rows the user has expanded to reveal all 14 columns.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleExpanded = useCallback((rowNum: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum);
      else next.add(rowNum);
      return next;
    });
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const importMutation = useImportUniversities();

  // Reset everything whenever the dialog reopens.
  useEffect(() => {
    if (!open) return;
    setPhase("pick");
    setFile(null);
    setRows([]);
    setError("");
    setExpanded(new Set());
  }, [open]);

  // When a file is selected, immediately fetch a server-side preview.
  useEffect(() => {
    if (!file || phase !== "pick") return;
    let cancelled = false;
    setError("");
    (async () => {
      try {
        const res = await importMutation.mutateAsync({ file, dryRun: true });
        if (cancelled) return;
        setRows(res.data.rowResults);
        setPhase("preview");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not preview file.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleCommit = useCallback(async () => {
    if (!file) return;
    setError("");
    try {
      const res = await importMutation.mutateAsync({ file, dryRun: false });
      setRows(res.data.rowResults);
      setPhase("committed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    }
  }, [file, importMutation]);

  const handleDownloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "universities-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handlePickAnother = useCallback(() => {
    setPhase("pick");
    setFile(null);
    setRows([]);
    setError("");
    setExpanded(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const counts = useMemo(() => {
    let okOrCreated = 0;
    let dupEmail = 0;
    let dupCode = 0;
    let other = 0;
    for (const r of rows) {
      if (r.status === "ok" || r.status === "created") okOrCreated++;
      else if (r.errorCode === "DUPLICATE_EMAIL") dupEmail++;
      else if (r.errorCode === "DUPLICATE_CODE") dupCode++;
      else other++;
    }
    return { okOrCreated, dupEmail, dupCode, other, failed: dupEmail + dupCode + other };
  }, [rows]);

  const isWorking = importMutation.isPending;
  const showPreview = (phase === "preview" || phase === "committed") && rows.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-lg flex flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-border/50 px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {phase === "committed" ? "Import complete" : "Import universities"}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                {phase === "pick" && "Upload a CSV or Excel file. Imported tenants start as Unverified."}
                {phase === "preview" && "Review the preview below — duplicates are highlighted. Nothing has been saved yet."}
                {phase === "committed" && "Each row's outcome is shown below. Imported tenants are Unverified."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Pick phase ----------------------------------------------------- */}
            {phase === "pick" && (
              <>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Required columns</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        First row must be a header. Column names are case-insensitive and may use spaces.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Sample CSV
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Required
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {REQUIRED_COLUMNS.map((c) => (
                          <span
                            key={c}
                            className="rounded bg-background px-2 py-0.5 font-mono text-[11px] ring-1 ring-border/40"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Optional
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {OPTIONAL_COLUMNS.map((c) => (
                          <span
                            key={c}
                            className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-border/40"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        <span className="font-mono">universityType</span> = govt_central / state / private / others
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="import-file"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 bg-muted/20 px-6 py-8 transition-colors hover:bg-primary-50/40 hover:border-primary-400"
                  >
                    {isWorking ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        <p className="text-sm font-medium">Reading file…</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to select a file</p>
                        <p className="text-xs text-muted-foreground">.csv or .xlsx</p>
                      </>
                    )}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="import-file"
                    type="file"
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={isWorking}
                    className="hidden"
                  />
                </div>

                {error && (
                  <p className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}
              </>
            )}

            {/* Preview / committed -------------------------------------------- */}
            {showPreview && (
              <>
                {/* File chip + change button */}
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {file?.name.toLowerCase().endsWith(".xlsx") ? (
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary-500" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-primary-500" />
                    )}
                    <p className="truncate text-sm font-medium">{file?.name}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      · {rows.length} {rows.length === 1 ? "row" : "rows"}
                    </p>
                  </div>
                  {phase === "preview" && (
                    <button
                      type="button"
                      onClick={handlePickAnother}
                      className="shrink-0 text-xs font-medium text-primary-600 hover:underline"
                    >
                      Change file
                    </button>
                  )}
                </div>

                {/* Counters */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SummaryCard
                    label={phase === "committed" ? "Created" : "Will create"}
                    value={counts.okOrCreated}
                    tone="success"
                  />
                  <SummaryCard label="Duplicate email" value={counts.dupEmail} tone="danger" />
                  <SummaryCard label="Duplicate code" value={counts.dupCode} tone="danger" />
                  <SummaryCard label="Other errors" value={counts.other} tone="warning" />
                </div>

                {/* Preview / result table */}
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <div className="grid grid-cols-[40px_2fr_1fr_2fr_1.4fr] items-center gap-3 bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>#</span>
                    <span>Name</span>
                    <span>Code</span>
                    <span>Admin email</span>
                    <span>Status</span>
                  </div>
                  <div className="max-h-96 divide-y divide-border/30 overflow-y-auto">
                    {rows.map((r) => {
                      const isError = r.status === "error";
                      const isDuplicate =
                        r.errorCode === "DUPLICATE_EMAIL" ||
                        r.errorCode === "DUPLICATE_CODE";
                      const isOpen = expanded.has(r.row);
                      const d = r.data as Record<string, string | undefined>;
                      const allFields: { label: string; value: string }[] = [
                        { label: "Name",            value: d.name || "—" },
                        { label: "Short Name",      value: d.shortName || "—" },
                        { label: "University Code", value: d.universityCode || "—" },
                        { label: "Type",            value: d.universityType || "others" },
                        { label: "Domain",          value: d.domain || "—" },
                        { label: "City",            value: d.city || "—" },
                        { label: "State",           value: d.state || "—" },
                        { label: "Pin Code",        value: d.pinCode || "—" },
                        { label: "Country",         value: d.country || "—" },
                        { label: "Country Code",    value: d.countryCode || "—" },
                        { label: "Admin Name",      value: d.adminName || "—" },
                        { label: "Admin Email",     value: d.adminEmail || "—" },
                        { label: "Admin Phone",     value: d.adminPhone || "—" },
                        { label: "Admin Designation", value: d.adminDesignation || "—" },
                      ];
                      return (
                        <div
                          key={r.row}
                          className={cn(
                            isDuplicate && "bg-danger/5",
                            isError && !isDuplicate && "bg-amber-500/5",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpanded(r.row)}
                            aria-expanded={isOpen}
                            className="grid w-full grid-cols-[24px_40px_2fr_1fr_2fr_1.4fr] items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-muted/30"
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                            <span className="font-mono text-xs text-muted-foreground">{r.row}</span>
                            <span className="truncate" title={d.name}>
                              {d.name || "—"}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {d.universityCode || "—"}
                            </span>
                            <span className="truncate text-xs" title={d.adminEmail}>
                              {d.adminEmail || "—"}
                            </span>
                            <span>
                              {r.status === "created" && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                                  <CheckCircle2 className="h-3 w-3" /> Created
                                </span>
                              )}
                              {r.status === "ok" && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-primary-500/40 bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-600">
                                  Will create
                                </span>
                              )}
                              {r.status === "error" && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                    isDuplicate
                                      ? "border border-danger/40 bg-danger/10 text-danger"
                                      : "border border-amber-500/40 bg-amber-500/10 text-amber-700",
                                  )}
                                  title={r.error}
                                >
                                  {(r.errorCode && ERROR_LABEL[r.errorCode]) || "Invalid"}
                                </span>
                              )}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border/30 bg-muted/20 px-10 py-3 text-xs sm:grid-cols-3">
                              {allFields.map((f) => (
                                <div key={f.label} className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {f.label}
                                  </p>
                                  <p className="mt-0.5 truncate font-medium" title={f.value}>
                                    {f.value}
                                  </p>
                                </div>
                              ))}
                              {r.error && (
                                <div className="col-span-full mt-1 rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
                                  <span className="font-semibold uppercase tracking-wide">Error: </span>
                                  {r.error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {phase === "committed" && counts.okOrCreated > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Imported tenants are{" "}
                    <span className="font-medium text-danger">Unverified</span>. Open each row’s
                    <span className="mx-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">⋯ → Send invitation</span>
                    to verify individually.
                  </p>
                )}

                {error && (
                  <p className="mt-3 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-3">
            {phase === "preview" && (
              <button
                type="button"
                onClick={handlePickAnother}
                disabled={isWorking}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                Change file
              </button>
            )}
            <Dialog.Close
              type="button"
              disabled={isWorking}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {phase === "committed" ? "Close" : "Cancel"}
            </Dialog.Close>
            {phase === "preview" && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={isWorking || counts.okOrCreated === 0}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isWorking
                  ? "Importing…"
                  : counts.failed > 0
                    ? `Import ${counts.okOrCreated} valid (skip ${counts.failed})`
                    : `Import ${counts.okOrCreated}`}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-success/40 bg-success/5 text-success"
      : tone === "danger"
        ? "border-danger/40 bg-danger/5 text-danger"
        : "border-amber-500/40 bg-amber-500/5 text-amber-700";
  return (
    <div className={cn("rounded-lg border p-3", toneClass)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
    </div>
  );
}
