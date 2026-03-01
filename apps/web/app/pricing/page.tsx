import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — BugKit",
  description: "BugKit is free forever. Indie at $9/mo and Pro at $29/mo for growing teams.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For indie devs and small projects",
    cta: "Start Free",
    ctaHref: "/signup",
    highlight: false,
    features: [
      { label: "Bug reports / month", value: "50" },
      { label: "Projects", value: "1" },
      { label: "Team members", value: "1" },
      { label: "Screenshot capture", value: true },
      { label: "Console log capture", value: true },
      { label: "Annotated screenshots", value: false },
      { label: "Slack integration", value: false },
      { label: "Linear / GitHub", value: false },
      { label: "Custom branding", value: false },
      { label: "API access", value: false },
    ],
  },
  {
    name: "Indie",
    price: "$9",
    period: "per month",
    desc: "For growing products and small teams",
    cta: "Start Indie",
    ctaHref: "/signup?plan=indie",
    highlight: true,
    features: [
      { label: "Bug reports / month", value: "500" },
      { label: "Projects", value: "5" },
      { label: "Team members", value: "3" },
      { label: "Screenshot capture", value: true },
      { label: "Console log capture", value: true },
      { label: "Annotated screenshots", value: true },
      { label: "Slack integration", value: true },
      { label: "Linear / GitHub", value: false },
      { label: "Custom branding", value: false },
      { label: "API access", value: false },
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    desc: "For teams that ship fast",
    cta: "Start Pro",
    ctaHref: "/signup?plan=pro",
    highlight: false,
    features: [
      { label: "Bug reports / month", value: "Unlimited" },
      { label: "Projects", value: "Unlimited" },
      { label: "Team members", value: "Unlimited" },
      { label: "Screenshot capture", value: true },
      { label: "Console log capture", value: true },
      { label: "Annotated screenshots", value: true },
      { label: "Slack integration", value: true },
      { label: "Linear / GitHub", value: true },
      { label: "Custom branding", value: true },
      { label: "API access", value: true },
    ],
  },
];

const faqs = [
  {
    q: "How does the screenshot work?",
    a: "BugKit uses the browser's native screen capture API (similar to html2canvas) to capture a full-page screenshot at the moment the user clicks 'Report a bug'. The user can then draw annotations — arrows, boxes, text — directly on the image before submitting.",
  },
  {
    q: "Do users need to install anything?",
    a: "No. BugKit is a lightweight JavaScript widget that you embed in your app. Your users simply click the bug report button — no extensions, no downloads, no accounts required.",
  },
  {
    q: "Can I use this with any framework?",
    a: "Yes. BugKit works with any JavaScript framework or vanilla JS. We have first-class packages for React and Next.js, and a plain JS CDN script for everything else.",
  },
];

function CheckIcon({ positive }: { positive: boolean }) {
  return positive ? (
    <span className="text-rose-400 font-bold">✓</span>
  ) : (
    <span className="text-zinc-600">—</span>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-base">
              🐛
            </div>
            <span className="font-bold text-white">BugKit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
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
      <section className="pt-20 pb-10 px-4 sm:px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-zinc-400">
          Start free. Upgrade when you need more. No hidden fees, no per-seat
          nonsense.
        </p>
      </section>

      {/* Tier cards */}
      <section className="pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(({ name, price, period, desc, cta, ctaHref, highlight, features }) => (
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
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-bold text-white mb-1">{name}</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-bold ${highlight ? "text-rose-400" : "text-white"}`}>
                  {price}
                </span>
                <span className="text-zinc-500 text-sm">/ {period}</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">{desc}</p>
              <Link
                href={ctaHref}
                className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors mb-6 ${
                  highlight
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                }`}
              >
                {cta} →
              </Link>
              <ul className="space-y-3 flex-1">
                {features.map(({ label, value }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{label}</span>
                    {typeof value === "boolean" ? (
                      <CheckIcon positive={value} />
                    ) : (
                      <span className="font-medium text-zinc-200">{value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-4 sm:px-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {faqs.map(({ q, a }) => (
            <div key={q} className="border-b border-zinc-800 pb-6 last:border-0">
              <h3 className="text-base font-semibold text-white mb-2">{q}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center py-14 px-8 rounded-3xl bg-gradient-to-b from-rose-500/8 to-zinc-900/40 border border-rose-500/15">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to fix bugs faster?
          </h2>
          <p className="text-zinc-400 mb-7 text-sm">
            Start free. 2-line install. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <span className="font-bold text-white">BugKit</span>
            <span className="text-zinc-500">by ThreeStack</span>
          </Link>
          <p className="text-xs text-zinc-600">© 2026 ThreeStack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
