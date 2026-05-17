"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/placement/lib/utils/cn";

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFilesChange: (files: File[]) => void;
  error?: string;
  className?: string;
}

export function FileUpload({
  label = "Upload files",
  accept,
  multiple = false,
  maxSize = 10,
  onFilesChange,
  error,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      setFileError(null);

      const fileArray = Array.from(newFiles);
      const oversized = fileArray.find((f) => f.size > maxSize * 1024 * 1024);

      if (oversized) {
        setFileError(`File "${oversized.name}" exceeds ${maxSize}MB limit`);
        return;
      }

      const updated = multiple ? [...files, ...fileArray] : fileArray;
      setFiles(updated);
      onFilesChange(updated);
    },
    [files, multiple, maxSize, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index);
      setFiles(updated);
      onFilesChange(updated);
    },
    [files, onFilesChange]
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors",
          dragOver
            ? "border-portal-accent bg-portal-accent-light/50"
            : "border-border hover:border-muted-foreground",
          (error || fileError) && "border-danger"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop files here, or{" "}
          <label className="cursor-pointer font-medium text-portal-accent hover:underline">
            browse
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Max {maxSize}MB per file
        </p>
      </div>

      {(error || fileError) && (
        <p className="text-xs text-danger">{error || fileError}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
