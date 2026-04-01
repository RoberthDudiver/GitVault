"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import { useI18n } from "@/lib/i18n";

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();

  const links = [
    { href: "/vault", label: t("nav.vaults") },
    { href: "/apps", label: t("nav.apps") },
    { href: "/settings", label: t("nav.settings") },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/vault" className="flex items-center">
            <Image
              src="/logo.png"
              alt="GitVault"
              width={160}
              height={40}
              className="h-10 w-auto dark:invert-0 invert"
              priority
            />
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setLocale("en")}
              className={`px-1.5 py-0.5 text-xs font-medium transition-colors ${
                locale === "en"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("es")}
              className={`px-1.5 py-0.5 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${
                locale === "es"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              ES
            </button>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            {t("nav.signOut")}
          </button>
        </div>
      </div>
    </header>
  );
}
