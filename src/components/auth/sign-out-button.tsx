"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsPending(true);
    setError(null);

    const result = await authClient.signOut();

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          "We couldn't sign you out right now. Please try again.",
        ),
      );
      setIsPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="secondary"
        onClick={handleSignOut}
        disabled={isPending}
        className="h-10 px-4 text-xs sm:text-sm"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? <p className="text-xs text-[#9f3722]">{error}</p> : null}
    </div>
  );
}
