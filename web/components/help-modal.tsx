"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-zinc-900 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-lg font-semibold">{t("help.title")}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* What is GitVault */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.whatIs")}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("help.whatIsDesc")}
            </p>
          </section>

          {/* How does it work */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.howWorks")}</h3>
            <ol className="list-decimal list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>{t("help.step1")}</li>
              <li>{t("help.step2")}</li>
              <li>{t("help.step3")}</li>
              <li>{t("help.step4")}</li>
            </ol>
          </section>

          {/* Vaults */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.vaults")}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("help.vaultsDesc")}
            </p>
          </section>

          {/* Apps & API Keys */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.apps")}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("help.appsDesc")}
            </p>
          </section>

          {/* Public vs Private */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.publicPrivate")}</h3>
            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>{t("help.publicDesc")}</p>
              <p>{t("help.privateDesc")}</p>
            </div>
          </section>

          {/* API Usage */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.api")}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              {t("help.apiDesc")}
            </p>
            <pre className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
{`curl -u YOUR_API_KEY:YOUR_API_SECRET \\
  https://api.gitvault.dev/v1/vaults/{vaultId}/files`}
            </pre>
          </section>

          {/* Limits */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">{t("help.limits")}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("help.limitsDesc")}
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            {t("help.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
