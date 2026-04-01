import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Built by{" "}
          <a
            href="https://dudiver.net"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Roberth Dudiver
          </a>{" "}
          · Open source on{" "}
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
            Terms / Términos
          </Link>
          <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            Privacy / Privacidad
          </Link>
          <span>© {new Date().getFullYear()} GitVault</span>
        </div>
      </div>
    </footer>
  );
}
