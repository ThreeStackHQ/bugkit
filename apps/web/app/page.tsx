import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BugKit — Screenshot-based bug reporting",
  description:
    "Let users report bugs with a screenshot, not a paragraph. Two-line install. Console logs. Slack, Linear & GitHub integrations.",
  openGraph: {
    title: "BugKit — Screenshot-based bug reporting",
    description:
      "Let users report bugs with a screenshot, not a paragraph. Two-line install. Console logs. Slack, Linear & GitHub integrations.",
    url: "https://bugkit.threestack.io",
    siteName: "BugKit",
    images: [
      {
        url: "https://bugkit.threestack.io/og.png",
        width: 1200,
        height: 630,
        alt: "BugKit - Bug reporting with annotated screenshots",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BugKit — Screenshot-based bug reporting",
    description: "Let users report bugs with a screenshot, not a paragraph.",
    images: ["https://bugkit.threestack.io/og.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BugKit",
  description:
    "Screenshot-based bug reporting tool with console log capture and integrations.",
  url: "https://bugkit.threestack.io",
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const features = [
  {
    icon: "📸",
    title: "Annotated Screenshots",
    desc: "Users highlight exactly what's broken with arrows, text, and highlights. No more vague descriptions.",
  },
  {
    icon: "🖥️",
    title: "Console Log Capture",
    desc: "Automatically captures JS console errors, warnings, and network failures at the moment of the bug.",
  },
  {
    icon: "⚡",
    title: "2-Line Install",
    desc: "Drop two lines into your app. Works with React, Vue, Svelte, vanilla JS — any stack.",
  },
  {
    icon: "🔗",
    title: "Slack / Linear / GitHub",
    desc: "Route bug reports directly to your existing tools. One click to create a Linear issue or GitHub ticket.",
  },
];

const comparison = [
  {
    name: "BugKit",
    price: "Free",
    highlight: true,
    features: ["Screenshots + annotations", "Console log capture", "Slack integration", "2-line install", "Unlimited users"],
  },
  {
    name: "BugHerd",
    price: "$39/mo",
    highlight: false,
    features: ["Screenshots", "No console logs", "Slack integration", "JavaScript embed", "5 users (free tier)"],
  },
  {
    name: "Userback",
    price: "$19/mo",
    highlight: false,
    features: ["Screenshots + video", "No console logs", "Zapier only", "JavaScript embed", "1 user (free tier)"],
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Nav */}
        <nav className="fixed top-0 inset-x-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-base">
                🐛
              </div>
              <span className="font-bold text-white">BugKit</span>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Compare</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
              >
                Start Free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium mb-6">
            🆓 Free forever plan — no credit card needed
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Let users report bugs with a{" "}
            <span className="text-rose-400">screenshot</span>,
            <br className="hidden sm:block" />
            not a paragraph.
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            BugKit adds a report-a-bug widget to your app. Users annotate a
            screenshot, you get the screenshot{" "}
            <em className="text-zinc-300">plus</em> console logs, URL, browser
            info — everything you need to fix it fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-base transition-colors shadow-lg shadow-rose-500/25"
            >
              Start Free
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-base border border-zinc-700 transition-colors"
            >
              View Demo →
            </Link>
          </div>
        </section>

        {/* Code snippet */}
        <section id="install" className="pb-20 px-4 sm:px-6 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
              <div className="w-3 h-3 rounded-full bg-rose-500/70" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="text-xs text-zinc-500 ml-2 font-mono">your-app.tsx</span>
            </div>
            <pre className="px-6 py-5 text-sm font-mono overflow-x-auto">
              <code>
                <span className="text-zinc-500">{"// 1. Install"}</span>{"\n"}
                <span className="text-emerald-400">npm</span>
                <span className="text-zinc-300">{" install @bugkit/widget"}</span>{"\n\n"}
                <span className="text-zinc-500">{"// 2. Initialize (once, in your root layout)"}</span>{"\n"}
                <span className="text-sky-400">import</span>
                <span className="text-zinc-300">{" { BugKit } "}</span>
                <span className="text-sky-400">from</span>
                <span className="text-rose-400">{" '@bugkit/widget'"}</span>{"\n"}
                <span className="text-zinc-300">{"<"}</span>
                <span className="text-amber-400">BugKit</span>
                <span className="text-sky-400">{" projectId"}</span>
                <span className="text-zinc-300">{"="}</span>
                <span className="text-rose-400">{"\"your-project-id\""}</span>
                <span className="text-zinc-300">{" />"}</span>
              </code>
            </pre>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything devs need
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Stop playing email tag with users trying to describe a bug. Get
              the full picture instantly.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-rose-500/30 transition-colors group"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-rose-300 transition-colors">
                  {title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing comparison */}
        <section id="pricing" className="pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why pay $39/mo for a bug widget?
            </h2>
            <p className="text-zinc-400 text-lg">
              BugKit is free — and more powerful.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {comparison.map(({ name, price, highlight, features: fs }) => (
              <div
                key={name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  highlight
                    ? "bg-rose-500/5 border-rose-500/30 ring-1 ring-rose-500/20"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                {highlight && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium mb-3 w-fit">
                    ✨ Recommended
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${highlight ? "text-white" : "text-zinc-300"}`}>
                  {name}
                </h3>
                <p className={`text-2xl font-bold mb-5 ${highlight ? "text-rose-400" : "text-zinc-400"}`}>
                  {price}
                </p>
                <ul className="space-y-2 flex-1">
                  {fs.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={highlight ? "text-rose-400" : "text-zinc-500"}>✓</span>
                      <span className={highlight ? "text-zinc-200" : "text-zinc-400"}>{f}</span>
                    </li>
                  ))}
                </ul>
                {highlight && (
                  <Link
                    href="/signup"
                    className="mt-6 block text-center px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors"
                  >
                    Get started free →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center py-16 px-8 rounded-3xl bg-gradient-to-b from-rose-500/10 to-zinc-900/50 border border-rose-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start capturing bugs today
            </h2>
            <p className="text-zinc-400 mb-8">
              Free forever. No credit card. 2-line setup.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors shadow-lg shadow-rose-500/25"
            >
              Start Free →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-white">BugKit</span>
              <span className="text-zinc-500">by ThreeStack</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-zinc-300 transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-zinc-300 transition-colors">Sign up</Link>
            </div>
            <p className="text-xs text-zinc-600">© 2026 ThreeStack. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
