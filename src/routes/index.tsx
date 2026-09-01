import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, GitBranch, ShieldCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";

import { MarketingFooter, MarketingHeader } from "@/components/showcase/SiteChrome";
import {
  repositoryUrl,
  scenarioFacts,
  tools,
  trustPoints,
  workflow,
} from "@/components/showcase/showcase-data";

const TITLE = "LoadGuard 3D - Human-authorized WebMCP load planning";
const DESCRIPTION =
  "Agent-native 3D truck load planning where WebMCP agents can inspect, plan, validate and stage proposals while humans retain authorization over operational execution.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "/loadguard-og.png" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: "/loadguard-og.png" },
    ],
  }),
  component: LandingPage,
});

const problemCards = [
  [
    "Agent automation can move too quickly",
    "A model saying approved must not become operational authorization.",
  ],
  [
    "DOM automation is brittle",
    "Agents need structured capabilities instead of guessing page state from labels.",
  ],
  [
    "Human review can drift from execution",
    "The operator must approve the exact proposal that will later execute.",
  ],
  [
    "Operational retries can duplicate consequences",
    "Commit needs idempotency, revision checks, and database-enforced state transitions.",
  ],
] as const;

const spatialPoints = [
  ["Active packages", "Solid cargo represents the truck's current operational state."],
  ["Candidate proposal", "Cyan translucent cargo shows what the agent wants to stage."],
  ["Fragile and urgent", "Handling constraints remain visible before authorization."],
  ["No silent mutation", "The active load does not change until an approved commit succeeds."],
] as const;

const proofCards = [
  ["Production", "Cloudflare Workers", "Live deployment available now"],
  ["WebMCP", "document.modelContext", "Exactly 7 registered tools"],
  ["Database", "Supabase", "RLS plus protected authority RPCs"],
  ["3D", "React Three Fiber", "Active and candidate cargo visualization"],
  ["Validation", "Deterministic", "Independent planner and validator checks"],
  ["Quality", "28 tests", "Build, typecheck, lint, and tests verified"],
] as const;

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <MarketingHeader />
      <main>
        <section
          id="overview"
          className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f6f8fb_100%)]"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:py-20">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                WebMCP-native logistics control
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                AI can plan the load. Only a human can authorize it.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                LoadGuard gives a WebMCP agent structured access to inspect a truck, build and
                validate a deterministic 3D loading plan, and stage it for review while the
                application and database prevent execution until a human approves the exact
                proposal.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/workspace"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Open live workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/webmcp"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  See how WebMCP works
                  <GitBranch className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/architecture"
                  className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-bold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  View architecture
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                <ProofBadge icon={<CheckCircle2 className="h-4 w-4" />}>
                  Production deployed
                </ProofBadge>
                <ProofBadge icon={<ShieldCheck className="h-4 w-4" />}>WebMCP verified</ProofBadge>
              </div>
              <p className="mt-6 max-w-2xl rounded-2xl border border-blue-100 bg-white/75 p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
                The agent reasons. The operator authorizes. The website defines and enforces the
                contract.
              </p>
            </div>

            <div className="min-w-0">
              <ProductFrame />
            </div>
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pb-10 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
            {[
              "7 WebMCP tools",
              "Deterministic planning",
              "Database-enforced approval",
              "3D load visualization",
              "Production deployed",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <ShowcaseSection
          id="problem"
          eyebrow="The problem"
          title="Giving an agent tools is easy. Giving it authority safely is harder."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {problemCards.map(([title, body]) => (
              <FeatureCard key={title} title={title} body={body} />
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="control-model"
          eyebrow="The control model"
          title="The agent and operator have deliberately different powers."
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <PowerCard
              icon={<Truck className="h-5 w-5" />}
              title="Agent"
              tone="blue"
              items={[
                "Inspect truck",
                "Inspect constraints",
                "Create deterministic candidate",
                "Validate candidate",
                "Stage proposal",
                "Attempt commit",
                "Read audit ledger",
              ]}
              footer="Cannot approve itself."
            />
            <PowerCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Human"
              tone="green"
              items={[
                "Review exact staged plan",
                "Inspect warnings",
                "Approve proposal",
                "Reject proposal",
              ]}
              footer="Approval itself does not mutate truck state."
            />
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Database authority
                </p>
                <h3 className="mt-2 text-2xl font-bold">Execution has to prove authorization.</h3>
              </div>
              <div className="grid gap-2 text-sm font-semibold text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  "approved hash",
                  "expiry",
                  "session",
                  "truck revision",
                  "target coverage",
                  "idempotency",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="workflow"
          eyebrow="Workflow"
          title="From inbound package to authorized execution."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {workflow.map(([number, title, body]) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                  {number}
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="scenario"
          eyebrow="Judge scenario"
          title="One package demonstrates the entire safety contract."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scenarioFacts.map(([label, value, detail]) => (
              <article
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  {label}
                </p>
                <p className="mt-3 font-mono text-xl font-bold text-slate-950">{value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
              </article>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="spatial"
          eyebrow="Spatial workspace"
          title="The proposal is visible before it becomes real."
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-2 shadow-2xl shadow-slate-900/15">
              <img
                src="/loadguard-overview.png"
                alt="LoadGuard 3D baseline workspace showing the truck load and decision rail"
                className="w-full rounded-2xl"
              />
            </div>
            <div className="grid gap-3">
              {spatialPoints.map(([title, body]) => (
                <FeatureCard key={title} title={title} body={body} compact />
              ))}
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="webmcp"
          eyebrow="WebMCP"
          title="Seven narrow tools instead of one dangerous super-tool."
        >
          <ToolTable />
          <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-lg font-bold text-blue-950">
              Human approval is intentionally not a WebMCP tool.
            </h3>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Commit accepts a proposal identifier. The server and database decide whether execution
              is authorized.
            </p>
            <Link
              to="/webmcp"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              Explore WebMCP architecture
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="trust"
          eyebrow="Trust by construction"
          title="The safety boundary lives in application state, not model text."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map(([title, body]) => (
              <FeatureCard key={title} title={title} body={body} />
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="comparison"
          eyebrow="Structured capability"
          title="The agent does not have to guess where the button is."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <ComparisonCard
              title="DOM-style automation"
              items={[
                "Find element",
                "Interpret labels",
                "Infer page state",
                "Click UI",
                "Hope state matches",
              ]}
            />
            <ComparisonCard
              title="LoadGuard WebMCP"
              items={[
                "get_load_state",
                "create_load_plan",
                "validate_load_plan",
                "stage_load_plan",
                "commit_load_plan",
              ]}
              technical
            />
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="proof"
          eyebrow="WebMCP Challenge"
          title="The proof is visible, testable, and deployed."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proofCards.map(([title, technology, body]) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-bold text-blue-700">{title}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">{technology}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/workspace" className="showcase-btn-primary">
              Live workspace
            </Link>
            <Link to="/architecture" className="showcase-btn-secondary">
              Architecture
            </Link>
            <Link to="/verification" className="showcase-btn-secondary">
              Verification
            </Link>
            <a href={repositoryUrl} className="showcase-btn-secondary">
              GitHub
            </a>
          </div>
        </ShowcaseSection>

        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-slate-950/20 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Final proof
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
                Let the agent plan. Keep authority human.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Inspect the live judge scenario, stage a deterministic candidate, and see the
                execution boundary enforced by the application itself.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
              <Link to="/workspace" className="showcase-btn-on-dark">
                Open live workspace
              </Link>
              <Link to="/webmcp" className="showcase-btn-on-dark-muted">
                View WebMCP
              </Link>
              <a href={repositoryUrl} className="showcase-btn-on-dark-muted">
                View GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function ProductFrame() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-5 rounded-[2.5rem] bg-blue-600/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/16">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-bold text-slate-500">Production workspace</span>
        </div>
        <img
          src="/loadguard-staged.png"
          alt="LoadGuard 3D staged proposal showing candidate cargo, valid plan, utilization, warnings, and human approval controls"
          className="w-full rounded-b-[1.2rem]"
        />
      </div>
      <div className="absolute -bottom-4 left-5 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-xl shadow-slate-900/10">
        <span className="font-mono text-cyan-700">STAGED</span> - human approval required
      </div>
    </div>
  );
}

function ShowcaseSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
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

function ProofBadge({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
      <span className="text-blue-600">{icon}</span>
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}
    >
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function PowerCard({
  icon,
  title,
  items,
  footer,
  tone,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  footer: string;
  tone: "blue" | "green";
}) {
  const toneClass = tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700";
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
          {icon}
        </span>
        <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
      </div>
      <ul className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-800">{footer}</p>
    </article>
  );
}

function ToolTable() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
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
                <span className={toolTone(consequence)}>{consequence}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonCard({
  title,
  items,
  technical = false,
}: {
  title: string;
  items: string[];
  technical?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-950">{title}</h3>
      <ol className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <li key={item} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
              {index + 1}
            </span>
            <span
              className={
                technical
                  ? "font-mono text-sm font-bold text-blue-700"
                  : "text-sm font-semibold text-slate-700"
              }
            >
              {item}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function toolTone(consequence: string) {
  if (consequence === "READ ONLY") {
    return "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700";
  }
  if (consequence === "CANDIDATE") {
    return "rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700";
  }
  return "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700";
}
