"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  buildAuthEmailForAccount,
  isLikelyEmailIdentifier,
  isValidAuthUsername,
  normalizeAuthUsername,
  normalizeOptionalAuthEmail,
} from "@/lib/auth-identifiers";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Name is required.");
      return;
    }

    const normalizedUsername = normalizeAuthUsername(username);
    if (!isValidAuthUsername(normalizedUsername)) {
      setError(
        "Username must be 3-30 characters and use letters, numbers, periods, or underscores.",
      );
      return;
    }

    const normalizedEmail = normalizeOptionalAuthEmail(email);
    if (normalizedEmail && !isLikelyEmailIdentifier(normalizedEmail)) {
      setError("Email format looks invalid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    let accountEmail: string;
    try {
      accountEmail = buildAuthEmailForAccount({
        username: normalizedUsername,
        email: normalizedEmail,
      });
    } catch (buildError) {
      setError(getAuthErrorMessage(buildError, "Invalid account details."));
      return;
    }

    setIsPending(true);

    const result = await authClient.signUp.email({
      name: normalizedName,
      username: normalizedUsername,
      email: accountEmail,
      password,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          "We couldn't create your account. Please try again.",
        ),
      );
      setIsPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthFormShell
      title="Create account"
      description="Create a Kinforth Cloud account."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold text-[#2f3d37]">
            Full name
          </label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jordan Lee"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="text-sm font-semibold text-[#2f3d37]"
          >
            Username
          </label>
          <Input
            id="username"
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="jordan_lee"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-[#2f3d37]">
            Email (optional)
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
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
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
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
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            minLength={8}
          />
        </div>
        {error ? <p className="text-sm text-[#9f3722]">{error}</p> : null}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm fc-text-muted">
        Already signed up?{" "}
        <Link href="/login" className="font-semibold text-accent-strong">
          Log in
        </Link>
      </p>
    </AuthFormShell>
  );
}

