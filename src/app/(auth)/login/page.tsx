"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectAfterLogin = useMemo(() => {
    const nextParam = searchParams.get("next");
    if (nextParam && nextParam.startsWith("/")) {
      return nextParam;
    }
    return "/dashboard";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          "We couldn't sign you in. Please check your credentials.",
        ),
      );
      setIsPending(false);
      return;
    }

    router.replace(redirectAfterLogin);
    router.refresh();
  }

  return (
    <AuthFormShell
      title="Welcome back"
      description="Log in to your account."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-[#2f3d37]">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@family.com"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[#2f3d37]"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm fc-text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
            />
            Keep me signed in
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-accent-strong hover:text-accent"
          >
            Forgot password?
          </Link>
        </div>
        {error ? <p className="text-sm text-[#9f3722]">{error}</p> : null}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Signing you in..." : "Log in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm fc-text-muted">
        Need an account?{" "}
        <Link href="/signup" className="font-semibold text-accent-strong">
          Create one
        </Link>
      </p>
    </AuthFormShell>
  );
}
