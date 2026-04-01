"use client";

import { useState } from "react";
import Link from "next/link";
import { useVaults, useConnectVault, useAvailableRepos } from "@/hooks/useVaults";
import { useAuth } from "@/components/auth-context";
import { api } from "@/lib/api";

type ModalTab = "select" | "create";

export default function VaultListPage() {
  const { data: vaults, isLoading } = useVaults();
  const { data: repos, refetch: fetchRepos, isFetching: fetchingRepos, isError: reposError } = useAvailableRepos();
  const connectVault = useConnectVault();
  const { githubConnected, refreshUser } = useAuth();

  const [connectingGitHub, setConnectingGitHub] = useState(false);
  const [refreshingGitHub, setRefreshingGitHub] = useState(false);

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
    await fetchRepos();
  };

  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<ModalTab>("select");
  const [connecting, setConnecting] = useState<string | null>(null);

  // Create tab state
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [createError, setCreateError] = useState("");

  const handleOpen = async () => {
    setShowModal(true);
    setTab("select");
    if (githubConnected) await fetchRepos();
  };

  const handleClose = () => {
    setShowModal(false);
    setNewRepoName("");
    setCreateError("");
  };

  const handleTabChange = async (t: ModalTab) => {
    setTab(t);
    if (t === "select" && !repos && githubConnected) await fetchRepos();
  };

  // Connect to an existing repo
  const handleConnect = async (fullName: string) => {
    setConnecting(fullName);
    try {
      await connectVault.mutateAsync({ repoFullName: fullName, createIfNotExists: false });
      handleClose();
    } catch {
      // error shown inline per repo
    } finally {
      setConnecting(null);
    }
  };

  // Create a brand-new repo and vault in one shot
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRepoName.trim();
    if (!name) return;
    // GitHub repo names: letters, numbers, hyphens, underscores, dots
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      setCreateError("Nombre inválido. Usa letras, números, guiones o puntos.");
      return;
    }
    setCreateError("");
    setConnecting(name);
    try {
      // repoFullName will be completed server-side with the user's GitHub login
      await connectVault.mutateAsync({
        repoFullName: name,          // server prefixes owner/
        createIfNotExists: true,
        isPrivate: newRepoPrivate,
      });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear el repositorio.";
      setCreateError(msg);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Vaults</h1>
        <button
          onClick={handleOpen}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
        >
          + Agregar vault
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        </div>
      )}

      {!isLoading && vaults?.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-20 text-center">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">Aún no tienes vaults</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-5">
            Conecta un repo existente de GitHub o crea uno nuevo para empezar.
          </p>
          <button
            onClick={handleOpen}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
          >
            Agregar primer vault
          </button>
        </div>
      )}

      {vaults && vaults.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map((v) => (
            <Link
              key={v.vaultId}
              href={`/vault/${v.vaultId}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                    {v.repoFullName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {v.isPrivate ? "Privado" : "Público"}
                    {!v.isInitialized && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">· inicializando…</span>
                    )}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                  v.isPrivate
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                }`}>
                  {v.isPrivate ? "privado" : "público"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <h2 className="font-semibold">Agregar vault</h2>
              <button
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 mt-4 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => handleTabChange("select")}
                className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === "select"
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Usar repo existente
              </button>
              <button
                onClick={() => handleTabChange("create")}
                className={`pb-2.5 px-1 ml-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === "create"
                    ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Crear nuevo repo
              </button>
            </div>

            {/* Tab: Select existing repo */}
            {tab === "select" && (
              <div className="px-6 py-4">
                {/* GitHub not connected */}
                {!githubConnected && (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      GitHub no está conectado
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                      Instala la GitHub App para ver tus repositorios.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleConnectGitHub}
                        disabled={connectingGitHub}
                        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-60"
                      >
                        {connectingGitHub ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : null}
                        {connectingGitHub ? "Redirigiendo a GitHub…" : "Conectar GitHub"}
                      </button>
                      <button
                        onClick={handleRefreshGitHub}
                        disabled={refreshingGitHub}
                        className="text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                      >
                        {refreshingGitHub ? "Verificando…" : "¿Ya instalado? Actualizar"}
                      </button>
                    </div>
                  </div>
                )}

                {githubConnected && fetchingRepos && (
                  <div className="flex justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
                  </div>
                )}

                {githubConnected && !fetchingRepos && reposError && (
                  <div className="py-6 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                      No se pudieron cargar los repositorios.
                    </p>
                    <button
                      onClick={() => fetchRepos()}
                      className="text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {githubConnected && !fetchingRepos && !reposError && repos?.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                      No hay repositorios disponibles.
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Asegúrate de que la GitHub App tenga acceso a tus repos.
                    </p>
                  </div>
                )}

                {githubConnected && !fetchingRepos && !reposError && repos && repos.length > 0 && (
                  <>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                      {repos.length} repositorio{repos.length !== 1 ? "s" : ""} disponible{repos.length !== 1 ? "s" : ""}
                    </p>
                    <ul className="flex flex-col gap-0.5 max-h-64 overflow-y-auto -mx-1">
                      {repos.map((r) => {
                        const isConnecting = connecting === r.fullName;
                        const alreadyConnected = vaults?.some((v) => v.repoFullName === r.fullName);
                        return (
                          <li key={r.id}>
                            <button
                              onClick={() => !alreadyConnected && handleConnect(r.fullName)}
                              disabled={isConnecting || !!alreadyConnected}
                              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                                alreadyConnected
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{r.fullName}</p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {r.isPrivate ? "Privado" : "Público"}
                                  </p>
                                </div>
                                {alreadyConnected && (
                                  <span className="shrink-0 text-xs text-zinc-400">ya conectado</span>
                                )}
                                {isConnecting && (
                                  <div className="shrink-0 h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Tab: Create new repo */}
            {tab === "create" && (
              <form onSubmit={handleCreate} className="px-6 py-4 flex flex-col gap-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Se creará un nuevo repositorio en tu cuenta de GitHub y se inicializará como vault de GitVault.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="repo-name">
                    Nombre del repositorio
                  </label>
                  <input
                    id="repo-name"
                    type="text"
                    required
                    value={newRepoName}
                    onChange={(e) => { setNewRepoName(e.target.value); setCreateError(""); }}
                    placeholder="mis-imagenes"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-500 font-mono"
                  />
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Solo letras, números, guiones y puntos. Sin espacios.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Visibilidad</p>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      newRepoPrivate
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        checked={newRepoPrivate}
                        onChange={() => setNewRepoPrivate(true)}
                        className="sr-only"
                      />
                      <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Privado</p>
                        <p className="text-xs text-zinc-500">Solo tú y tus apps</p>
                      </div>
                    </label>

                    <label className={`flex-1 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      !newRepoPrivate
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        checked={!newRepoPrivate}
                        onChange={() => setNewRepoPrivate(false)}
                        className="sr-only"
                      />
                      <svg className="h-4 w-4 text-zinc-600 dark:text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Público</p>
                        <p className="text-xs text-zinc-500">CDN directo, más rápido</p>
                      </div>
                    </label>
                  </div>
                </div>

                {createError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                )}

                <button
                  type="submit"
                  disabled={!!connecting || !newRepoName.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creando…
                    </>
                  ) : (
                    "Crear repo y vault"
                  )}
                </button>
              </form>
            )}

            <div className="px-6 pb-5" />
          </div>
        </div>
      )}
    </div>
  );
}
