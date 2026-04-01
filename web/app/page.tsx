import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Nav */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="GitVault" className="h-8 w-auto dark:invert-0 invert" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
            Store and serve files with{" "}
            <span className="text-zinc-500 dark:text-zinc-400">Git as your backend</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-zinc-500 dark:text-zinc-400 mb-10">
            Upload images and files to GitHub repositories and serve them through a fast API.
            No extra storage costs — use what you already have.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2">GitHub-backed storage</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Every file you upload is committed directly to a GitHub repository you control. Reliable, versioned, and always under your ownership.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2">Fast CDN-like serving</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Serve any stored file through a clean API endpoint with response caching. Share public links or protect them with API keys.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2">Secure access</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sign in with Firebase Auth — email, Google, or GitHub. Generate scoped API keys to control exactly who can read or write your files.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-center">
          <img src="/logo.png" alt="GitVault" className="h-6 w-auto dark:invert-0 invert opacity-50" />
        </div>
      </footer>
    </div>
  );
}
