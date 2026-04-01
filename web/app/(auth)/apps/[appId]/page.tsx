"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp, useDeleteApp, useCredentials, useCreateCredential, useRevokeCredential } from "@/hooks/useApps";
import { useI18n } from "@/lib/i18n";

export default function AppDetailPage() {
  const { appId } = useParams<{ appId: string }>();
  const router = useRouter();
  const { t } = useI18n();

  const { data: app, isLoading } = useApp(appId);
  const { data: credentials } = useCredentials(appId);
  const deleteApp = useDeleteApp();
  const createCredential = useCreateCredential(appId);
  const revokeCredential = useRevokeCredential(appId);

  const [newSecret, setNewSecret] = useState<{ apiKey: string; apiSecret: string } | null>(null);
  const [generatingCred, setGeneratingCred] = useState(false);
  const [credError, setCredError] = useState("");

  // Per-credential inline revoke confirmation
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Delete app inline confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingApp, setDeletingApp] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleGenerateCredential = async () => {
    setGeneratingCred(true);
    setCredError("");
    try {
      const result = await createCredential.mutateAsync();
      setNewSecret(result);
    } catch {
      setCredError(t("app.generateFailed"));
    } finally {
      setGeneratingCred(false);
    }
  };

  const handleConfirmRevoke = async (credentialId: string) => {
    setRevokingId(credentialId);
    setRevokeError(null);
    try {
      await revokeCredential.mutateAsync(credentialId);
      setConfirmRevokeId(null);
    } catch {
      setRevokeError(credentialId);
    } finally {
      setRevokingId(null);
    }
  };

  const handleConfirmDeleteApp = async () => {
    setDeletingApp(true);
    setDeleteError("");
    try {
      await deleteApp.mutateAsync(appId);
      router.replace("/apps");
    } catch {
      setDeleteError(t("app.failed"));
      setDeletingApp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
      </div>
    );
  }

  if (!app) return <p className="text-center py-12 text-sm text-zinc-500">{t("app.notFound")}</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">

      {/* -- Delete app confirmation banner --------------------------------- */}
      {confirmDelete ? (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
            {t("app.deleteTitle", { name: app.name })}
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mb-3">
            {t("app.deleteWarning")}
          </p>
          {deleteError && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2">{deleteError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDeleteApp}
              disabled={deletingApp}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              {deletingApp && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {deletingApp ? t("app.deleting") : t("app.yesDelete")}
            </button>
            <button
              onClick={() => { setConfirmDelete(false); setDeleteError(""); }}
              disabled={deletingApp}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {t("app.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold">{app.name}</h1>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{app.appId}</p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            {t("app.deleteApp")}
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">{t("app.scopes")}</h2>
        <div className="flex flex-wrap gap-1.5">
          {app.scopes.map((s) => (
            <span key={s} className="text-sm px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("app.credentials")}</h2>
          <button
            onClick={handleGenerateCredential}
            disabled={generatingCred}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 flex items-center gap-1.5"
          >
            {generatingCred && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {generatingCred ? t("app.generating") : t("app.generateCred")}
          </button>
        </div>

        {credError && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{credError}</p>
        )}

        {newSecret && (
          <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
              {t("app.saveSecret")}
            </p>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-0.5">{t("app.apiKey")}</p>
                <code className="text-xs font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-2 py-1 rounded break-all">
                  {newSecret.apiKey}
                </code>
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-0.5">{t("app.apiSecret")}</p>
                <code className="text-xs font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-2 py-1 rounded break-all">
                  {newSecret.apiSecret}
                </code>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t("app.useAs")}{" "}
                <code className="font-mono">Authorization: Basic base64({newSecret.apiKey}:{"<secret>"})</code>
              </p>
            </div>
            <button
              onClick={() => setNewSecret(null)}
              className="mt-3 text-xs text-amber-700 dark:text-amber-400 underline"
            >
              {t("app.savedDismiss")}
            </button>
          </div>
        )}

        {credentials && credentials.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("app.noCreds")}</p>
          </div>
        )}

        {credentials && credentials.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">{t("app.apiKey")}</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{t("app.created")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {credentials.map((cred) => {
                  const isConfirming = confirmRevokeId === cred.credentialId;
                  const isRevoking = revokingId === cred.credentialId;

                  return (
                    <tr key={cred.credentialId} className="bg-white dark:bg-zinc-950">
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs">{cred.apiKey}</code>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs hidden sm:table-cell">
                        {new Date(cred.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("app.revokeConfirm")}</span>
                            <button
                              onClick={() => handleConfirmRevoke(cred.credentialId)}
                              disabled={isRevoking}
                              className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                              {isRevoking && (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                              )}
                              {isRevoking ? t("app.revoking") : t("app.yesRevoke")}
                            </button>
                            {!isRevoking && (
                              <button
                                onClick={() => { setConfirmRevokeId(null); setRevokeError(null); }}
                                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                              >
                                {t("app.cancel")}
                              </button>
                            )}
                            {revokeError === cred.credentialId && (
                              <span className="text-xs text-red-500">{t("app.failed")}</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRevokeId(cred.credentialId)}
                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            {t("app.revoke")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
