"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, GraduationCap, KeyRound } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/student/lib/schemas/auth.schema";
import { useAuthStore } from "@/student/lib/stores/auth-store";
import { ApiError } from "@/student/lib/api/client";
import { cn } from "@/student/lib/utils/cn";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, errorCode, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [setupHint, setSetupHint] = useState<{ email: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    setSetupHint(null);
    try {
      await login(data);
      const u = useAuthStore.getState().user;
      router.push(u?.mustChangePassword ? "/student/setup-password" : "/student/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "PASSWORD_NOT_SET") {
          setSetupHint({ email: err.email || data.email });
        } else if (err.code === "ACCOUNT_SUSPENDED" || err.code === "ACCOUNT_DEACTIVATED") {
          const sc = err.supportContact;
          const params = new URLSearchParams({ code: err.code, email: data.email });
          if (sc?.contactName) params.set("contactName", sc.contactName);
          if (sc?.email) params.set("contactEmail", sc.email);
          if (sc?.phone) params.set("contactPhone", sc.phone);
          if (sc?.alternatePhone) params.set("contactAlt", sc.alternatePhone);
          if (sc?.helpText) params.set("helpText", sc.helpText);
          router.push(`/student/account-suspended?${params.toString()}`);
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
          <GraduationCap className="h-6 w-6 text-background" />
        </div>
        <span className="text-xl font-semibold tracking-tight">Glimmora</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back!</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Student Portal.</p>
      </div>

      {error && errorCode !== "PASSWORD_NOT_SET" && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-light p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {setupHint && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50/60 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            No password set yet.&nbsp;
            <Link href={`/student/setup-password?email=${encodeURIComponent(setupHint.email)}`} className="font-semibold underline">
              Set it up via OTP
            </Link>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@university.edu" disabled={isLoading}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-background px-3 text-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.email ? "border-danger focus:ring-danger" : "border-input hover:border-muted-foreground"
            )}
            {...register("email")} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
              placeholder="Enter your password" disabled={isLoading}
              className={cn(
                "flex h-11 w-full rounded-lg border bg-background pr-10 pl-3 text-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errors.password ? "border-danger focus:ring-danger" : "border-input hover:border-muted-foreground"
              )}
              {...register("password")} />
            <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          <p className="text-[11px] text-muted-foreground">
            First-time login? Use the default password from your onboarding email.
          </p>
        </div>

        <div className="flex justify-end">
          <Link href={`/student/setup-password${getValues("email") ? `?email=${encodeURIComponent(getValues("email"))}` : ""}`}
            className="text-sm text-portal-accent hover:underline">
            Forgot / reset password?
          </Link>
        </div>

        <button type="submit" disabled={isLoading}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-lg font-medium text-sm transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
        </button>
      </form>
    </div>
  );
}
