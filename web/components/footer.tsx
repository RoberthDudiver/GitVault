"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {t("footer.builtBy")}{" "}
          <a
            href="https://dudiver.net"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Roberth Dudiver
          </a>{" "}
          {"\u00b7"} {t("footer.openSource")}{" "}
          <a
            href="https://github.com/RoberthDudiver/GitVault"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors underline"
          >
            GitHub
          </a>
        </p>
        <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            {t("footer.privacy")}
          </Link>
          <span>&copy; {new Date().getFullYear()} GitVault</span>
        </div>
      </div>
    </footer>
  );
}
