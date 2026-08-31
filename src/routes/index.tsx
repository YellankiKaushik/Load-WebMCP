import { createFileRoute } from "@tanstack/react-router";
import { Activity, Bot, ClipboardList } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import {
  CommandHeader,
  LedgerPanel,
  McpStatus,
  MetricStrip,
  PackageTable,
  ProposalPanel,
  SceneShell,
  ViolationList,
} from "@/components/loadguard/panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <main className="mx-auto flex min-h-screen max-w-[1480px] flex-col gap-5 overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
      <CommandHeader
        registered={mcp.registered}
        toolNames={mcp.toolNames}
        busy={busy}
        sessionReady={Boolean(lg.sessionKey)}
        onReset={() => lg.reset.mutate()}
      />

      {lg.state.isLoading || !state ? (
        <section className="surface-workspace flex min-h-[420px] items-center justify-center text-sm text-muted-foreground">
          Loading dock state...
        </section>
      ) : (
        <>
          <MetricStrip state={state} />

          <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="order-2 min-w-0 xl:order-1">
              <SceneShell state={state} hasCandidate={Boolean(candidate?.length)}>
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Initialising cargo view...
                    </div>
                  }
                >
                  <TruckScene state={state} candidate={candidate} highlight={hover} />
                </Suspense>
              </SceneShell>
            </div>

            <div className="order-1 min-w-0 xl:order-2">
              <ProposalPanel
                plan={plan}
                state={state}
                busy={busy}
                onApprove={() => plan && lg.approve.mutate(plan.planId)}
                onReject={() => plan && lg.reject.mutate(plan.planId)}
              />
            </div>
          </section>

          <Tabs defaultValue="manifest" className="surface-secondary min-w-0 p-2">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-md bg-background/70 p-1">
              <TabsTrigger className="min-h-9 gap-2" value="manifest">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Manifest
              </TabsTrigger>
              <TabsTrigger className="min-h-9 gap-2" value="activity">
                <Activity className="h-4 w-4" aria-hidden="true" />
                Activity
              </TabsTrigger>
              <TabsTrigger className="min-h-9 gap-2" value="agent">
                <Bot className="h-4 w-4" aria-hidden="true" />
                Agent interface
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manifest" className="mt-3 space-y-4 p-2">
              <div>
                <h2 className="text-base font-semibold text-foreground">Manifest</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hover a row to highlight the package in the 3D workspace.
                </p>
              </div>
              <PackageTable state={state} onHover={setHover} />
              <ViolationList state={state} />
            </TabsContent>

            <TabsContent value="activity" className="mt-3 p-2">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">Action ledger</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Auditable agent, human, and system events without hidden reasoning.
                </p>
              </div>
              <LedgerPanel events={lg.ledger.data ?? []} />
            </TabsContent>

            <TabsContent
              value="agent"
              className="mt-3 grid gap-4 p-2 lg:grid-cols-[minmax(0,1fr)_420px]"
            >
              <McpStatus registered={mcp.registered} toolNames={mcp.toolNames} />
              <section className="rounded-lg border border-border/70 bg-background/45 p-4">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">Agent console</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Same tool surface an MCP agent calls, retained for local demonstration.
                  </p>
                </div>
                {lg.sessionKey ? (
                  <Suspense fallback={null}>
                    <AgentConsole sessionKey={lg.sessionKey} plan={plan} onChange={lg.invalidate} />
                  </Suspense>
                ) : null}
              </section>
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  );
}
