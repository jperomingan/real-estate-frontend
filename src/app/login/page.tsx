"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  Building2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authService } from "@/features/auth/auth-service";
import { authStorage } from "@/features/auth/auth-storage";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface ApiErrorBody {
  message?: string;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return `Cannot connect to the backend API. ${error.message}`;
    }

    return (
      error.response.data?.message ??
      `Login failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to log in. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,

    onSuccess: ({ accessToken, user }) => {
      authStorage.setAccessToken(accessToken);

      if (user) {
        authStorage.setUser(user);
      }

      router.replace("/dashboard");
    },

    onError: (error) => {
      setLoginError(getErrorMessage(error));
    },
  });

  function onSubmit(values: LoginFormValues) {
    setLoginError(null);
    loginMutation.mutate(values);
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600">
            <Building2 size={26} />
          </div>

          <div>
            <p className="font-semibold">
              Real Estate Management
            </p>
            <p className="text-sm text-slate-400">
              Lead Tracking System
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Property and lead management
          </p>

          <h1 className="mt-5 text-5xl font-bold leading-tight">
            Manage your real estate business from one place.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Organize properties, monitor leads, schedule
            viewings, manage follow-ups, and review business
            performance.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Real Estate Management System
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 size={26} />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Welcome back
            </h2>

            <p className="mt-2 text-slate-600">
              Sign in to access your dashboard.
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  {...register("email")}
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  {...register("password")}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {loginError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending && (
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
              )}

              {loginMutation.isPending
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
