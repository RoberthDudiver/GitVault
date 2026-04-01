"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This route is kept for legacy/deep-link purposes.
 * GitHub App installation callbacks are handled server-side at:
 *   GET /v1/auth/github/callback (API)
 * The API then redirects to /onboarding/select-repo on success.
 *
 * If someone lands here directly, just send them to /vault
 * (the auth guard will redirect appropriately).
 */
export default function GitHubCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vault");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
    </div>
  );
}
