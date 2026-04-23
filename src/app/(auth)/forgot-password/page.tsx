"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          "We couldn't send the reset email. Please try again.",
        ),
      );
      setIsPending(false);
      return;
    }

    setSuccessMessage(
      "If an account exists for that email, we sent a reset link.",
    );
    setIsPending(false);
  }

  return (
    <AuthFormShell
      title="Reset password"
      description="Enter your email to get a reset link."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-[#2f3d37]">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@family.com"
          />
        </div>
        {error ? <p className="text-sm text-[#9f3722]">{error}</p> : null}
        {successMessage ? (
          <p className="rounded-lg border border-[#c8d6ce] bg-[#e9f3ee] p-3 text-sm text-[#1f5440]">
            {successMessage}
          </p>
        ) : null}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm fc-text-muted">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-accent-strong">
          Back to login
        </Link>
      </p>
    </AuthFormShell>
  );
}
