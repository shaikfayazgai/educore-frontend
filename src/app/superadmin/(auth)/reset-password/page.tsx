"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/superadmin/lib/schemas/auth.schema";
import { api, ApiError } from "@/superadmin/lib/api/client";
import { cn } from "@/superadmin/lib/utils/cn";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    if (!email) {
      setServerError("Email is required");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email,
        otp: data.otp,
        newPassword: data.password,
      });
      setIsSuccess(true);
      setTimeout(() => router.push("/superadmin/login"), 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Could not reset password. Try again.");
      }
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
            Password reset successful
          </h1>
          <p className="text-sm text-muted-foreground">
            Your password has been updated. Redirecting you to sign in...
          </p>
        </div>
        <Link
          href="/superadmin/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-portal-accent hover:underline"
        >
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Verify and set new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we emailed you, then choose a new password
          (at least 8 characters with uppercase, lowercase, and a number).
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-background px-3 text-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "border-input hover:border-muted-foreground"
            )}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="otp" className="text-sm font-medium leading-none">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="123456"
            disabled={isLoading}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-background px-3 text-center font-mono text-base tracking-[0.4em] transition-colors",
              "placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-sans",
              "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.otp
                ? "border-danger focus:ring-danger"
                : "border-input hover:border-muted-foreground"
            )}
            {...register("otp")}
          />
          {errors.otp && (
            <p className="text-xs text-danger">{errors.otp.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              disabled={isLoading}
              className={cn(
                "flex h-11 w-full rounded-lg border bg-background pr-10 pl-3 text-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errors.password
                  ? "border-danger focus:ring-danger"
                  : "border-input hover:border-muted-foreground"
              )}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium leading-none"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              disabled={isLoading}
              className={cn(
                "flex h-11 w-full rounded-lg border bg-background pr-10 pl-3 text-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errors.confirmPassword
                  ? "border-danger focus:ring-danger"
                  : "border-input hover:border-muted-foreground"
              )}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-danger">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        )}

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
              Resetting password...
            </>
          ) : (
            "Verify and reset password"
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/superadmin/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <Link
          href="/superadmin/forgot-password"
          className="text-muted-foreground hover:text-foreground"
        >
          Resend code
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
