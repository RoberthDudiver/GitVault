"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { api } from "@/lib/api";

function SelectRepoInner() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const installationId = searchParams.get("installation_id");

    if (!installationId) {
      router.replace("/onboarding");
      return;
    }

    // Link the installation_id to the current user, then refresh and redirect
    api.post("/auth/github/link-installation", { installation_id: Number(installationId) })
      .catch(() => { /* ignore if already linked */ })
      .finally(() => {
        refreshUser().then(() => router.replace("/vault"));
      });
  }, [router, searchParams, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          GitHub Connected!
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Redirecting to your vaults…
        </p>
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200" />
      </div>
    </div>
  );
}

export default function SelectRepoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        </div>
      }
    >
      <SelectRepoInner />
    </Suspense>
  );
}
