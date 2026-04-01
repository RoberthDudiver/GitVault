"use client";

import { useState } from "react";
import Link from "next/link";
import { useVaults, useConnectVault, useAvailableRepos } from "@/hooks/useVaults";

export default function VaultListPage() {
  const { data: vaults, isLoading } = useVaults();
  const { data: repos, refetch: fetchRepos, isFetching: fetchingRepos } = useAvailableRepos();
  const connectVault = useConnectVault();

  const [showRepos, setShowRepos] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleShowRepos = async () => {
    setShowRepos(true);
    await fetchRepos();
  };

  const handleConnect = async (fullName: string) => {
    setConnecting(fullName);
    try {
      await connectVault.mutateAsync({ repoFullName: fullName });
      setShowRepos(false);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Vaults</h1>
        <button
          onClick={handleShowRepos}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
        >
          Connect repo
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        </div>
      )}

      {!isLoading && vaults?.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No vaults yet.</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Connect a GitHub repository to use it as a vault.
          </p>
        </div>
      )}

      {vaults && vaults.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map((v) => (
            <Link
              key={v.vaultId}
              href={`/vault/${v.vaultId}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{v.repoFullName}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {v.isPrivate ? "Private" : "Public"} repo
                    {!v.isInitialized && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">· not initialized</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {v.isPrivate ? "private" : "public"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showRepos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Select a repository</h2>
              <button
                onClick={() => setShowRepos(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            {fetchingRepos && (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
              </div>
            )}

            {repos && repos.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6">No repositories available.</p>
            )}

            {repos && repos.length > 0 && (
              <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                {repos.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => handleConnect(r.fullName)}
                      disabled={connecting === r.fullName}
                      className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      <p className="text-sm font-medium">{r.fullName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {r.isPrivate ? "Private" : "Public"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
