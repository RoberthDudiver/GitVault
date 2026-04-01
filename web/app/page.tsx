"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Footer } from "@/components/footer";

// ── SVG Icons ───────────────────────────────────────────────────────────────

function IconCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconX({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconGitHub({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// ── Feature icons ───────────────────────────────────────────────────────────

function IconDatabase({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function IconBolt({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconLock({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconCode({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function IconLayers({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0l4.179 2.25L12 22.5 2.25 17.25l4.179-2.25" />
    </svg>
  );
}

function IconClock({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ── Landing Page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { locale, setLocale, t } = useI18n();

  const problems = [
    t("landing.problem1"),
    t("landing.problem2"),
    t("landing.problem3"),
    t("landing.problem4"),
  ];

  const solutions = [
    t("landing.solution1"),
    t("landing.solution2"),
    t("landing.solution3"),
    t("landing.solution4"),
  ];

  const features = [
    { icon: <IconDatabase />, title: t("landing.feat1Title"), desc: t("landing.feat1Desc") },
    { icon: <IconBolt />, title: t("landing.feat2Title"), desc: t("landing.feat2Desc") },
    { icon: <IconLock />, title: t("landing.feat3Title"), desc: t("landing.feat3Desc") },
    { icon: <IconCode />, title: t("landing.feat4Title"), desc: t("landing.feat4Desc") },
    { icon: <IconLayers />, title: t("landing.feat5Title"), desc: t("landing.feat5Desc") },
    { icon: <IconClock />, title: t("landing.feat6Title"), desc: t("landing.feat6Desc") },
  ];

  const steps = [
    {
      num: "1",
      title: t("landing.step1Title"),
      desc: t("landing.step1Desc"),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
        </svg>
      ),
    },
    {
      num: "2",
      title: t("landing.step2Title"),
      desc: t("landing.step2Desc"),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
    },
    {
      num: "3",
      title: t("landing.step3Title"),
      desc: t("landing.step3Desc"),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      ),
    },
  ];

  const pricingIncludes = [
    t("landing.pricingIncl1"),
    t("landing.pricingIncl2"),
    t("landing.pricingIncl3"),
    t("landing.pricingIncl4"),
    t("landing.pricingIncl5"),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* ── Sticky Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="GitVault" className="h-10 w-auto dark:invert-0 invert" />
          </Link>
          <nav className="flex items-center gap-3">
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
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {t("hero.signIn")}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              {t("hero.getStarted")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[600px] rounded-full blur-3xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(161,161,170,0.15) 0%, transparent 70%)",
              animation: "float 8s ease-in-out infinite",
            }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <div className="max-w-6xl mx-auto px-6 py-28 md:py-40 text-center" style={{ animation: "fadeInUp 0.6s ease-out both" }}>
            {/* Social proof pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-8">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("landing.socialProof")}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              {t("landing.heroTitle1")}{" "}
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
                {t("landing.heroTitle2")}
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10">
              {t("landing.heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                {t("hero.getStarted")}
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/RoberthDudiver/GitVault"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <IconGitHub className="h-5 w-5" />
                {t("landing.viewOnGithub")}
              </a>
            </div>
          </div>
        </section>

        {/* ── Why GitVault (Problem/Solution) ────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("landing.whyTitle")}</h2>
          <div className="h-1 w-12 bg-zinc-900 dark:bg-zinc-100 mx-auto rounded-full mb-16" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Problem */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-red-500 dark:text-red-400 mb-6 block">
                {t("landing.problemLabel")}
              </span>
              <ul className="space-y-4">
                {problems.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <IconX className="h-3 w-3 text-red-500 dark:text-red-400" />
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 md:p-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-6 block">
                {t("landing.solutionLabel")}
              </span>
              <ul className="space-y-4">
                {solutions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <IconCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────── */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">{t("landing.howTitle")}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mb-16">{t("landing.howSubtitle")}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {steps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center px-4">
                  {/* Connector line (desktop only) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px bg-gradient-to-r from-zinc-300 dark:from-zinc-700 to-zinc-300/0 dark:to-zinc-700/0" />
                  )}
                  {/* Step number badge */}
                  <div className="relative mb-6">
                    <span className="absolute -top-3 -right-3 text-5xl font-bold text-zinc-200 dark:text-zinc-800 select-none">
                      {step.num}
                    </span>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-sm">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Grid ──────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">{t("landing.featuresTitle")}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mb-16">{t("landing.featuresSubtitle")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Code Example ───────────────────────────────────────────── */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: text */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.codeTitle")}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">{t("landing.codeSubtitle")}</p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                >
                  {t("hero.getStarted")}
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right: code block */}
              <div className="rounded-2xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs text-zinc-500 font-mono">Terminal</span>
                </div>
                {/* Code */}
                <div className="p-6 overflow-x-auto">
                  <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
                    <span className="text-zinc-500"># Upload a file</span>{"\n"}
                    <span className="text-emerald-400">$</span>{" "}
                    <span className="text-sky-400">curl</span>{" "}
                    <span className="text-amber-400">-X POST</span>{" "}
                    <span className="text-zinc-500">\</span>{"\n"}
                    {"  "}<span className="text-sky-400">-u</span>{" "}
                    <span className="text-zinc-100">YOUR_KEY:YOUR_SECRET</span>{" "}
                    <span className="text-zinc-500">\</span>{"\n"}
                    {"  "}<span className="text-sky-400">-F</span>{" "}
                    <span className="text-amber-300">{'"file=@photo.jpg"'}</span>{" "}
                    <span className="text-zinc-500">\</span>{"\n"}
                    {"  "}<span className="text-sky-400">-F</span>{" "}
                    <span className="text-amber-300">{'"visibility=public"'}</span>{" "}
                    <span className="text-zinc-500">\</span>{"\n"}
                    {"  "}<span className="text-zinc-100">https://api.gitvault.dudiver.net/v1/vaults/</span>
                    <span className="text-amber-400">{"{id}"}</span>
                    <span className="text-zinc-100">/files</span>{"\n\n"}
                    <span className="text-zinc-500"># Get the public URL</span>{"\n"}
                    <span className="text-emerald-400">{">"}</span>{" "}
                    <span className="text-zinc-100">https://api.gitvault.dudiver.net/f/</span>
                    <span className="text-amber-400">abc123</span>
                    <span className="text-zinc-100">/photo.jpg</span>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">{t("landing.pricingTitle")}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mb-16">{t("landing.pricingSubtitle")}</p>

          <div className="max-w-md mx-auto rounded-2xl border-2 border-zinc-900 dark:border-zinc-100 p-8 md:p-12 text-center">
            {/* Free badge */}
            <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6">
              {t("landing.pricingFree")}
            </span>

            {/* Price */}
            <div className="mb-8">
              <span className="text-6xl font-bold">$0</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">/month</span>
            </div>

            {/* Includes */}
            <ul className="text-left max-w-xs mx-auto space-y-3 mb-8">
              {pricingIncludes.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <IconCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="block w-full py-3 text-sm font-medium rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors text-center"
            >
              {t("hero.getStarted")}
            </Link>
          </div>
        </section>

        {/* ── Open Source CTA ────────────────────────────────────────── */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
            <IconGitHub className="h-12 w-12 mx-auto mb-6 text-zinc-400 dark:text-zinc-500" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100 bg-clip-text text-transparent">
                {t("landing.ossTitle")}
              </span>
            </h2>
            <p className="max-w-xl mx-auto text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10">
              {t("landing.ossSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/RoberthDudiver/GitVault"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <IconGitHub className="h-5 w-5" />
                {t("landing.ossStar")}
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                {t("hero.getStarted")}
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
