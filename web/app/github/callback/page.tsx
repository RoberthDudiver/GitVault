"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      router.replace("/onboarding");
      return;
    }

    api
      .get(`/auth/github/callback?code=${code}&state=${state ?? ""}`)
      .then(() => router.replace("/vault"))
      .catch(() => router.replace("/onboarding"));
  }, [router, searchParams]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        <p className="text-sm text-zinc-500">Connecting GitHub…</p>
      </div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
