"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/faculty/lib/schemas/auth.schema";
import { api } from "@/faculty/lib/api/client";
import { cn } from "@/faculty/lib/utils/cn";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/forgot-password", data);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch {
      // Still show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">
              {submittedEmail}
            </span>
          </p>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder, or
          </p>
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setSubmittedEmail("");
            }}
            className="text-sm font-medium text-portal-accent hover:underline"
          >
            try again with a different email
          </button>
        </div>
        <Link
          href="/faculty/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email address associated with your account and we&apos;ll
          send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            disabled={isLoading}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-background px-3 text-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.email
                ? "border-danger focus:ring-danger"
                : "border-input hover:border-muted-foreground"
            )}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-lg font-medium text-sm transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <Link
        href="/faculty/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
