"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setHasToken(data.has_github_token));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
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

  const handleRemove = async () => {
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

      {/* GitHub Personal Access Token */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold mb-1">GitHub Personal Access Token</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Usado como alternativa cuando la GitHub App no puede crear repositorios.
              Necesita el scope <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">repo</code>.
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
            <li>Ve a <span className="font-mono">github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)</span></li>
            <li>Click <span className="font-medium">Generate new token (classic)</span></li>
            <li>Selecciona el scope <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">repo</span></li>
            <li>Copia el token y pégalo aquí</li>
          </ol>
        </div>

        <form onSubmit={handleSave} className="flex gap-2">
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
              onClick={handleRemove}
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
