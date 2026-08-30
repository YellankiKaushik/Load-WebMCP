import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Truck } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import {
  LedgerPanel,
  McpStatus,
  PackageTable,
  PanelShell,
  ProposalPanel,
  StatChip,
  ViolationList,
} from "@/components/loadguard/panels";
import { useLoadGuard } from "@/hooks/useLoadGuard";
import { registerLoadGuardTools } from "@/lib/loadguard/webmcp";

const TruckScene = lazy(() => import("@/components/loadguard/TruckScene"));
const AgentConsole = lazy(() => import("@/components/loadguard/AgentConsole"));

const TITLE = "LoadGuard 3D — Agent-Assisted Truck Load Planning";
const DESCRIPTION =
  "A 3D truck loading control surface where an AI agent plans and stages load proposals over WebMCP, but only a human can approve and only approved proposals can be committed.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: LoadGuardPage,
});

function LoadGuardPage() {
  const lg = useLoadGuard();
  const [mcp, setMcp] = useState<{ registered: boolean; toolNames: string[] }>({
    registered: false,
    toolNames: [],
  });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!lg.sessionKey) return;
    const handle = registerLoadGuardTools(lg.sessionKey, lg.invalidate);
    setMcp({ registered: handle.registered, toolNames: handle.toolNames });
    return () => handle.unregister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lg.sessionKey]);

  const state = lg.state.data;
  const plan = state?.latestPlan ?? null;
  const candidate = useMemo(
    () => (plan && plan.status !== "EXECUTED" ? plan.placements : null),
    [plan],
  );

  const busy =
    lg.approve.isPending || lg.reject.isPending || lg.commit.isPending || lg.reset.isPending;

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-mono text-lg uppercase tracking-[0.22em] text-foreground">
              LoadGuard 3D
            </h1>
            <p className="text-xs text-muted-foreground">
              Agent plans and stages. Humans approve. Only approved proposals commit.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => lg.reset.mutate()}
          disabled={busy || !lg.sessionKey}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset scenario
        </button>
      </header>

      {lg.state.isLoading || !state ? (
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Loading dock state…
        </p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatChip label="Truck" value={state.truck.code} />
              <StatChip label="Loaded" value={`${state.loadedCount}/${state.packages.length}`} />
              <StatChip label="Utilization" value={`${state.utilizationPct}%`} />
              <StatChip
                label="Weight"
                value={`${state.totalWeightKg}/${state.truck.maxWeightKg} kg`}
              />
            </div>

            <div className="relative h-[460px] overflow-hidden rounded-lg border border-border/70 bg-card/40">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Initialising cargo view…
                  </div>
                }
              >
                <TruckScene state={state} candidate={candidate} highlight={hover} />
              </Suspense>
              <div className="pointer-events-none absolute bottom-3 left-3 flex gap-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Rear door at x=0</span>
                <span className="text-success">Green wireframe = candidate</span>
              </div>
            </div>

            <PanelShell title="Manifest" subtitle="Hover a row to highlight it in the trailer">
              <PackageTable state={state} onHover={setHover} />
            </PanelShell>

            <PanelShell title="Active load validation">
              <ViolationList state={state} />
            </PanelShell>
          </div>

          <div className="space-y-5">
            <PanelShell title="Proposal" subtitle="Human decision gate">
              <ProposalPanel
                plan={plan}
                state={state}
                busy={busy}
                onApprove={() => plan && lg.approve.mutate(plan.planId)}
                onReject={() => plan && lg.reject.mutate(plan.planId)}
              />
            </PanelShell>

            <PanelShell title="Agent console" subtitle="Same tool surface an MCP agent calls">
              {lg.sessionKey ? (
                <Suspense fallback={null}>
                  <AgentConsole sessionKey={lg.sessionKey} plan={plan} onChange={lg.invalidate} />
                </Suspense>
              ) : null}
            </PanelShell>

            <PanelShell title="WebMCP tools">
              <McpStatus registered={mcp.registered} toolNames={mcp.toolNames} />
            </PanelShell>

            <PanelShell title="Action ledger" subtitle="Every agent and human action">
              <LedgerPanel events={lg.ledger.data ?? []} />
            </PanelShell>
          </div>
        </div>
      )}
    </main>
  );
}
