import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          404
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Page not found
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
