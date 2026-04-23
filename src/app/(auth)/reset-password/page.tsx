"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset link is invalid or expired.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);

    const result = await authClient.resetPassword({
      token,
      newPassword: password,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          "Unable to reset password. Please request a new reset link.",
        ),
      );
      setIsPending(false);
      return;
    }

    setIsComplete(true);
    setIsPending(false);
  }

  return (
    <AuthFormShell
      title="Choose a new password"
      description="Set your new password."
    >
      {isComplete ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-[#c8d6ce] bg-[#e9f3ee] p-3 text-sm text-[#1f5440]">
            Password updated successfully.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong"
          >
            Continue to login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#2f3d37]"
            >
              New password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-semibold text-[#2f3d37]"
            >
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
            />
          </div>
          {!token ? (
            <p className="text-sm text-[#9f3722]">
              Missing token. Request a new password reset email.
            </p>
          ) : null}
          {error ? <p className="text-sm text-[#9f3722]">{error}</p> : null}
          <Button type="submit" disabled={isPending || !token} className="w-full">
            {isPending ? "Updating password..." : "Update password"}
          </Button>
          <p className="text-center text-sm fc-text-muted">
            Need another email?{" "}
            <Link href="/forgot-password" className="font-semibold text-accent-strong">
              Request a new link
            </Link>
          </p>
        </form>
      )}
    </AuthFormShell>
  );
}
