import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { MarketingFooter, MarketingHeader } from "@/components/showcase/SiteChrome";
import { productionUrl } from "@/components/showcase/showcase-data";

const TITLE = "LoadGuard Verification - Production authority boundary evidence";
const DESCRIPTION =
  "Production verification evidence for LoadGuard 3D: baseline, staged proposal, human authorization, execution, idempotency, and quality gates.";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "/loadguard-og.png" },
    ],
  }),
  component: VerificationPage,
});

const statusCards = [
  ["Production deployed", "Cloudflare Workers"],
  ["Build passing", "Verified quality gate"],
  ["28 tests", "Planner, validator, WebMCP, authority"],
  ["WebMCP verified", "7 tools, no approval tool"],
  ["Authority verified", "APPROVAL_REQUIRED before approval"],
  ["Idempotency verified", "ALREADY_EXECUTED on replay"],
] as const;

const evidence = [
  {
    eyebrow: "Baseline",
    title: "TRK-042 starts with one urgent package inbound.",
    facts: ["8/9 loaded", "75.6% utilization", "993 kg / 1200 kg", "MED-901 inbound", "revision 1"],
  },
  {
    eyebrow: "Proposal",
    title: "The deterministic candidate completes the target load.",
    facts: ["9/9 placed", "1011 kg", "78.4% utilization", "VALID", "0 hard violations"],
  },
  {
    eyebrow: "Authorization",
    title: "Commit before human approval is refused.",
    facts: [
      "APPROVAL_REQUIRED",
      "Active state unchanged",
      "Human approves exact proposal in UI",
      "Approval does not mutate active load",
    ],
  },
  {
    eyebrow: "Execution",
    title: "Approved execution updates the active truck once.",
    facts: [
      "EXECUTED",
      "MED-901 loaded",
      "x=115, y=95, z=0",
      "revision 1 -> 2",
      "0 hard violations",
    ],
  },
  {
    eyebrow: "Idempotency",
    title: "Duplicate execution is blocked.",
    facts: ["ALREADY_EXECUTED", "revision remains 2", "9/9 loaded", "1011 kg", "78.4% utilization"],
  },
] as const;

function VerificationPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Production verification
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              The authority boundary has been tested end-to-end.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              LoadGuard's judge scenario verifies discovery, deterministic planning, validation,
              staging, pre-approval refusal, human UI authorization, approved commit, duplicate
              commit refusal, and an auditable ledger.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/workspace" className="showcase-btn-primary">
                Open workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={productionUrl} className="showcase-btn-secondary">
                Production URL
              </a>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statusCards.map(([title, body]) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Evidence chain
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                The same fixture proves planning, approval, execution, and replay protection.
              </h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-5">
              {evidence.map((item) => (
                <article
                  key={item.eyebrow}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-3 text-lg font-bold leading-6 text-slate-950">{item.title}</h3>
                  <ul className="mt-4 grid gap-2">
                    {item.facts.map((fact) => (
                      <li key={fact} className="flex gap-2 text-sm font-semibold text-slate-700">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                          aria-hidden="true"
                        />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Review warnings
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Warnings are visible without becoming hard failures.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The final valid plan can include non-blocking fragile-elevated review warnings for
                PKG-106 and MED-901. They are surfaced for human judgment while hard validation
                remains zero.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <h3 className="text-xl font-bold text-slate-950">VALID with review warnings</h3>
                  <p className="mt-2 font-mono text-sm text-amber-900">
                    FRAGILE_ELEVATED PKG-106
                    <br />
                    FRAGILE_ELEVATED MED-901
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Workspace proof
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Inspect the verified UI.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The workspace shows the active truck load, candidate proposal geometry, validation
                state, warnings, human approval controls, and activity ledger in one product view.
              </p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-2 shadow-xl shadow-slate-900/10">
              <img
                src="/loadguard-staged.png"
                alt="LoadGuard staged proposal verification screenshot"
                className="w-full rounded-2xl"
              />
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
