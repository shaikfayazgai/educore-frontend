"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, GraduationCap } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/placement/lib/schemas/auth.schema";
import { useAuthStore } from "@/placement/lib/stores/auth-store";
import { cn } from "@/placement/lib/utils/cn";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data);
      const user = useAuthStore.getState().user;
      if (!user) return;
      if (user.role !== "placement" && user.role !== "admin") {
        // Login succeeded but role can't use this portal.
        await useAuthStore.getState().logout();
        useAuthStore.setState({
          error: `Role '${user.role}' is not allowed to access the Placement Portal.`,
        });
        return;
      }
      // If the admin seeded this account with a temp password and the
      // backend hasn't seen a real one yet, force the user through
      // setup-password before they touch the dashboard. Mirrors the
      // student/faculty flow so all roles get the same first-time UX.
      router.push(user.mustChangePassword ? "/placement/setup-password" : "/placement/dashboard");
    } catch {
      // Error is handled by the auth store
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
          <GraduationCap className="h-6 w-6 text-background" />
        </div>
        <span className="text-xl font-semibold tracking-tight">Glimmora</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back!</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your portal
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-light p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none"
          >
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

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/placement/forgot-password"
            className="text-sm text-portal-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
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
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

    </div>
  );
}
