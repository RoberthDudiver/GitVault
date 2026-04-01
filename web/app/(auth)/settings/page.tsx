"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-context";

const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME ?? "gitvault";

export default function SettingsPage() {
  const { githubConnected, refreshUser } = useAuth();

  // PAT state
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // GitHub reconnect
  const [connectingGitHub, setConnectingGitHub] = useState(false);
  const [refreshingGitHub, setRefreshingGitHub] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setHasToken(data.has_github_token));
  }, []);

  const handleConnectGitHub = async () => {
    setConnectingGitHub(true);
    try {
      const { data } = await api.post("/auth/connect-github");
      window.location.href = data.installation_url as string;
    } catch {
      setConnectingGitHub(false);
    }
  };

  const handleRefreshGitHub = async () => {
    setRefreshingGitHub(true);
    await refreshUser();
    setRefreshingGitHub(false);
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/settings/github-token", { token: tokenInput.trim() });
      setHasToken(true);
      setTokenInput("");
      setMessage({ type: "ok", text: "Token guardado correctamente." });
    } catch {
      setMessage({ type: "err", text: "No se pudo guardar el token." });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveToken = async () => {
    setRemoving(true);
    setMessage(null);
    try {
      await api.delete("/settings/github-token");
      setHasToken(false);
      setMessage({ type: "ok", text: "Token eliminado." });
    } catch {
      setMessage({ type: "err", text: "No se pudo eliminar el token." });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-8">Ajustes</h1>

      {/* ── GitHub App connection ─────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Conexión de GitHub</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                GitHub App instalada en tu cuenta para gestionar repositorios.
              </p>
            </div>
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
            githubConnected
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}>
            {githubConnected ? "Conectado" : "No conectado"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Manage installation on GitHub */}
          <a
            href={`https://github.com/settings/installations`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Administrar conexión de GitHub
          </a>

          {/* Reconnect / refresh */}
          {!githubConnected ? (
            <button
              onClick={handleConnectGitHub}
              disabled={connectingGitHub}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
            >
              {connectingGitHub && <div className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />}
              {connectingGitHub ? "Redirigiendo…" : "Conectar GitHub App"}
            </button>
          ) : (
            <button
              onClick={handleRefreshGitHub}
              disabled={refreshingGitHub}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {refreshingGitHub ? "Actualizando…" : "Actualizar estado"}
            </button>
          )}
        </div>
      </div>

      {/* ── GitHub Personal Access Token ──────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold mb-1">Personal Access Token</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Alternativa cuando la GitHub App no puede crear repositorios.
              Se usa automáticamente si la App falla. Necesita scope{" "}
              <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">repo</code>.
            </p>
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
            hasToken === null
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
              : hasToken
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          }`}>
            {hasToken === null ? "…" : hasToken ? "Configurado" : "No configurado"}
          </span>
        </div>

        {/* Instructions */}
        <div className="mb-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Cómo crear el token:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Ve a <span className="font-mono">github.com → Settings → Developer settings → Personal access tokens</span></li>
            <li>Click <span className="font-medium">Generate new token (classic)</span></li>
            <li>Selecciona el scope <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">repo</span></li>
            <li>Copia el token y pégalo aquí</li>
          </ol>
          <a
            href={`https://github.com/settings/tokens/new?scopes=repo&description=GitVault`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-zinc-600 dark:text-zinc-300 underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Crear token en GitHub ↗
          </a>
        </div>

        <form onSubmit={handleSaveToken} className="flex gap-2">
          <input
            type="password"
            placeholder={hasToken ? "Reemplazar token actual…" : "ghp_xxxxxxxxxxxx"}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-500 font-mono"
          />
          <button
            type="submit"
            disabled={saving || !tokenInput.trim()}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          {hasToken && (
            <button
              type="button"
              onClick={handleRemoveToken}
              disabled={removing}
              className="rounded-lg border border-red-200 dark:border-red-900 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
            >
              {removing ? "…" : "Eliminar"}
            </button>
          )}
        </form>

        {message && (
          <p className={`mt-3 text-xs ${message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
