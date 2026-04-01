"use client";

import { useState } from "react";
import Link from "next/link";
import { useApps, useCreateApp } from "@/hooks/useApps";
import { useVaults } from "@/hooks/useVaults";

const ALL_SCOPES = ["files:read", "files:write", "files:delete"] as const;

export default function AppsPage() {
  const { data: apps, isLoading } = useApps();
  const { data: vaults } = useVaults();
  const createApp = useCreateApp();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["files:read"]);
  const [selectedVaults, setSelectedVaults] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const toggleVault = (vaultId: string) => {
    setSelectedVaults((prev) =>
      prev.includes(vaultId) ? prev.filter((v) => v !== vaultId) : [...prev, vaultId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await createApp.mutateAsync({ name: name.trim(), scopes, vaultIds: selectedVaults });
      setShowCreate(false);
      setName("");
      setScopes(["files:read"]);
      setSelectedVaults([]);
    } catch {
      setCreateError("Failed to create app. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Apps</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
        >
          New app
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        </div>
      )}

      {!isLoading && apps?.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No apps yet.</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Create an app to get API credentials for programmatic access.
          </p>
        </div>
      )}

      {apps && apps.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Link
              key={app.appId}
              href={`/apps/${app.appId}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-sm">{app.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  app.isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}>
                  {app.isActive ? "active" : "inactive"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {app.scopes.map((s) => (
                  <span key={s} className="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">New app</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">App name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Integration"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Scopes</p>
                <div className="flex flex-col gap-2">
                  {ALL_SCOPES.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="rounded"
                      />
                      <span className="text-sm">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              {vaults && vaults.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Vault access</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Leave all unchecked to grant access to all vaults.
                  </p>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                    {vaults.map((v) => (
                      <label key={v.vaultId} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVaults.includes(v.vaultId)}
                          onChange={() => toggleVault(v.vaultId)}
                          className="rounded"
                        />
                        <span className="text-sm truncate">{v.repoFullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {createError && (
                <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
              )}

              <button
                type="submit"
                disabled={creating || scopes.length === 0}
                className="mt-1 flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create app"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
