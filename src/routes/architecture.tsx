import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Database, GitBranch, ShieldCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";

import { MarketingFooter, MarketingHeader } from "@/components/showcase/SiteChrome";
import { architectureLayers } from "@/components/showcase/showcase-data";

const TITLE = "LoadGuard Architecture - Agent reasoning, human authority";
const DESCRIPTION =
  "Judge-friendly LoadGuard architecture: WebMCP agent tools, deterministic planning, human approval UI, and database-enforced execution.";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "/loadguard-og.png" },
    ],
  }),
  component: ArchitecturePage,
});

const judgeChecks = [
  ["WebMCP discovery", "Open /workspace and verify document.modelContext exposes seven tools."],
  ["Authority boundary", "Stage a proposal and attempt commit before approval: APPROVAL_REQUIRED."],
  [
    "Human authorization",
    "Approve through the UI only and verify approved hash equals staged hash.",
  ],
  ["Execution", "Commit after approval: EXECUTED and active revision advances."],
  ["Idempotency", "Repeat commit: ALREADY_EXECUTED and no duplicate mutation."],
  ["Ledger", "Inspect human approval, agent commit, and refused duplicate events."],
] as const;

const authorityStates = [
  ["Active state", "The real truck operational load that is visible in the workspace."],
  ["Candidate", "An agent-generated proposal snapshot that can be validated and staged."],
  ["Approved proposal", "The exact staged candidate after human approval, still not yet active."],
  ["Commit", "Database authority changes active state only after every guard passes."],
] as const;

function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Architecture
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              Agent reasoning, human authority, database enforcement.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              LoadGuard separates what an agent can reason about from what the system is allowed to
              execute. The WebMCP path creates and stages proposals; the human UI grants exact
              approval; the database validates authority before active state changes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/workspace" className="showcase-btn-primary">
                Open workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/webmcp" className="showcase-btn-secondary">
                View WebMCP contract
              </Link>
            </div>
          </div>
        </section>

        <Section eyebrow="Judge verification" title="How to verify LoadGuard">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {judgeChecks.map(([title, body]) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section eyebrow="System layers" title="The implementation stack">
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-bold">Layer</th>
                  <th className="px-5 py-4 font-bold">Technology</th>
                  <th className="px-5 py-4 font-bold">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {architectureLayers.map(([layer, technology, purpose]) => (
                  <tr key={layer} className="border-t border-slate-200">
                    <td className="px-5 py-4 font-bold text-slate-950">{layer}</td>
                    <td className="px-5 py-4 text-slate-700">{technology}</td>
                    <td className="px-5 py-4 text-slate-600">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section eyebrow="Data and control flow" title="Two paths converge at authority">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
              <FlowCard icon={<Bot className="h-5 w-5" />} title="WebMCP agent">
                Tool calls inspect, plan, validate, stage, and request commit.
              </FlowCard>
              <FlowArrow />
              <FlowCard icon={<GitBranch className="h-5 w-5" />} title="Candidate proposal">
                Plans remain separate from active truck state until approval and commit.
              </FlowCard>
              <FlowArrow />
              <FlowCard icon={<Database className="h-5 w-5" />} title="Database authority">
                Status, hash, expiry, session, revision, coverage, and idempotency are checked.
              </FlowCard>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <FlowCard icon={<ShieldCheck className="h-5 w-5" />} title="Human UI approval">
                The operator approves the exact staged proposal. Approval is not a WebMCP tool.
              </FlowCard>
              <FlowArrow />
              <FlowCard icon={<Truck className="h-5 w-5" />} title="Active load">
                Only a verified approved commit updates the real truck load and action ledger.
              </FlowCard>
            </div>
          </div>
        </Section>

        <Section eyebrow="Authority model" title="Active and candidate state stay separate">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {authorityStates.map(([title, body]) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </Section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function FlowCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
    </article>
  );
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center text-blue-500 lg:flex" aria-hidden="true">
      <ArrowRight className="h-6 w-6" />
    </div>
  );
}
