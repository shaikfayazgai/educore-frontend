"use client";

import { forwardRef } from "react";
import { cn } from "@/admin/lib/utils/cn";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        <label htmlFor={fieldId} className="text-sm font-medium leading-none">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background px-3 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-primary-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus:ring-danger"
              : "border-input hover:border-muted-foreground",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        <label htmlFor={fieldId} className="text-sm font-medium leading-none">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-primary-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus:ring-danger"
              : "border-input hover:border-muted-foreground",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    { label, error, hint, required, options, placeholder, className, id, ...props },
    ref
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        <label htmlFor={fieldId} className="text-sm font-medium leading-none">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background px-3 text-sm transition-colors appearance-none",
            "focus:outline-none focus:ring-1 focus:ring-primary-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus:ring-danger"
              : "border-input hover:border-muted-foreground",
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";
