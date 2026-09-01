import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Database, Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { MarketingFooter, MarketingHeader } from "@/components/showcase/SiteChrome";
import { tools } from "@/components/showcase/showcase-data";

const TITLE = "LoadGuard WebMCP - Seven narrow tools, human approval outside the tool surface";
const DESCRIPTION =
  "How LoadGuard exposes structured WebMCP planning tools while keeping human approval outside document.modelContext.";

export const Route = createFileRoute("/webmcp")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "/loadguard-og.png" },
    ],
  }),
  component: WebMcpPage,
});

const tiers = [
  {
    title: "Read only",
    icon: <Eye className="h-5 w-5" />,
    tools: ["get_load_state", "get_package_constraints", "get_action_ledger"],
    body: "Inspect current state, constraints, and audit events without changing proposals or active load.",
  },
  {
    title: "Candidate state",
    icon: <Code2 className="h-5 w-5" />,
    tools: ["create_load_plan", "validate_load_plan", "stage_load_plan"],
    body: "Create, validate, and stage proposal snapshots that remain separate from active truck state.",
  },
  {
    title: "Operational",
    icon: <Database className="h-5 w-5" />,
    tools: ["commit_load_plan"],
    body: "Request execution of an already approved proposal. The database still decides whether it is allowed.",
  },
] as const;

function WebMcpPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">WebMCP</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
                WebMCP gives the agent capabilities. LoadGuard decides what can change.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                The page registers a small capability surface through document.modelContext. The
                agent gets structured planning tools, but approval authority remains outside WebMCP
                and is enforced server-side.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/workspace" className="showcase-btn-primary">
                  Open workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/verification" className="showcase-btn-secondary">
                  View verification
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-blue-700">Connected contract</p>
                  <p className="font-mono text-2xl font-black text-slate-950">7 tools</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-blue-950">
                No approval tool is registered. The human approval control lives in the LoadGuard UI
                and records the exact staged proposal hash.
              </p>
            </div>
          </div>
        </section>

        <Section eyebrow="Consequence tiers" title="The tool surface is deliberately narrow">
          <div className="grid gap-5 lg:grid-cols-3">
            {tiers.map((tier) => (
              <article
                key={tier.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  {tier.icon}
                </span>
                <h2 className="mt-4 text-2xl font-bold text-slate-950">{tier.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{tier.body}</p>
                <ul className="mt-5 grid gap-2">
                  {tier.tools.map((tool) => (
                    <li
                      key={tool}
                      className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm font-bold text-slate-800"
                    >
                      {tool}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section eyebrow="Tool inventory" title="Exactly seven tools are exposed">
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-bold">Tool</th>
                  <th className="px-5 py-4 font-bold">Purpose</th>
                  <th className="px-5 py-4 font-bold">Consequence</th>
                </tr>
              </thead>
              <tbody>
                {tools.map(([tool, purpose, consequence]) => (
                  <tr key={tool} className="border-t border-slate-200">
                    <td className="px-5 py-4 font-mono text-sm font-bold text-slate-950">{tool}</td>
                    <td className="px-5 py-4 text-slate-600">{purpose}</td>
                    <td className="px-5 py-4">
                      <span className={badgeTone(consequence)}>{consequence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section eyebrow="Contract" title="The tool submits intent. Authority evaluates it.">
          <div className="grid gap-5 lg:grid-cols-2">
            <CodePanel title="Commit accepts">
              {`commit_load_plan({
  "proposal_id": "PLAN_PROPOSAL_UUID"
})`}
            </CodePanel>
            <CodePanel title="Commit does not accept">
              {`commit_load_plan({
  "coordinates": "...",
  "approval": true,
  "force": true
})`}
            </CodePanel>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Approve proposal and reject proposal are not WebMCP capabilities.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This asymmetry is deliberate. The agent can ask for execution, but the application
                  and database verify whether the operator already authorized that exact staged
                  plan.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section eyebrow="Expected responses" title="The boundary is observable">
          <div className="grid gap-5 lg:grid-cols-3">
            <CodePanel title="Before approval">
              {`{
  "ok": false,
  "code": "APPROVAL_REQUIRED",
  "status": "STAGED"
}`}
            </CodePanel>
            <CodePanel title="After approval">
              {`{
  "ok": true,
  "status": "EXECUTED",
  "state_revision": 2
}`}
            </CodePanel>
            <CodePanel title="Replay">
              {`{
  "ok": false,
  "code": "ALREADY_EXECUTED",
  "status": "EXECUTED"
}`}
            </CodePanel>
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

function CodePanel({ title, children }: { title: string; children: string }) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
      <h3 className="text-sm font-bold text-cyan-300">{title}</h3>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/20 p-4 text-xs leading-6 text-slate-100">
        <code>{children}</code>
      </pre>
    </article>
  );
}

function badgeTone(consequence: string) {
  if (consequence === "READ ONLY") {
    return "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700";
  }
  if (consequence === "CANDIDATE") {
    return "rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700";
  }
  return "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700";
}
