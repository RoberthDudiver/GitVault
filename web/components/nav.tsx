"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/vault", label: "Vaults" },
    { href: "/apps", label: "Apps" },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/vault" className="flex items-center">
            {/* logo1.png es blanco sobre negro — invertimos en light mode para negro sobre blanco */}
            <Image
              src="/logo.png"
              alt="GitVault"
              width={120}
              height={32}
              className="h-8 w-auto dark:invert-0 invert"
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
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
