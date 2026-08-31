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
    <main className="app-shell">
      <CommandHeader
        registered={mcp.registered}
        toolNames={mcp.toolNames}
        busy={busy}
        sessionReady={Boolean(lg.sessionKey)}
        onReset={() => lg.reset.mutate()}
      />

      {lg.state.isLoading || !state ? (
        <section className="loading-surface" aria-live="polite">
          Loading dock state...
        </section>
      ) : (
        <>
          <section className="page-intro" aria-labelledby="workspace-title">
            <div>
              <p className="eyebrow">Load workspace</p>
              <h1 id="workspace-title">{state.truck.code} load workspace</h1>
              <p>Plan and authorize the active truck load.</p>
            </div>
            <p className="trust-statement">Agent-native planning · Human-controlled execution</p>
          </section>

          <MetricStrip state={state} />

          <section className="workspace-grid" id="workspace" aria-label="Load planning workspace">
            <div className="workspace-decision">
              <ProposalPanel
                plan={plan}
                state={state}
                busy={busy}
                onApprove={() => plan && lg.approve.mutate(plan.planId)}
                onReject={() => plan && lg.reject.mutate(plan.planId)}
              />
            </div>
            <div className="workspace-visual">
              <SceneShell state={state} hasCandidate={Boolean(candidate?.length)}>
                <Suspense
                  fallback={<div className="scene-loading">Initialising cargo view...</div>}
                >
                  <TruckScene state={state} candidate={candidate} highlight={hover} />
                </Suspense>
              </SceneShell>
            </div>
          </section>

          <section className="secondary-workspace" id="details" aria-label="Load details">
            <Tabs defaultValue="manifest" className="min-w-0">
              <TabsList className="workspace-tabs">
                <TabsTrigger className="workspace-tab" value="manifest">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Manifest
                </TabsTrigger>
                <TabsTrigger className="workspace-tab" value="activity">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  Activity
                </TabsTrigger>
                <TabsTrigger className="workspace-tab" value="agent">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                  WebMCP
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manifest" className="tab-content">
                <div className="tab-heading">
                  <div>
                    <p className="eyebrow">Shipment detail</p>
                    <h2>Manifest</h2>
                  </div>
                  <p>Hover a row to highlight the package in the 3D workspace.</p>
                </div>
                <PackageTable state={state} onHover={setHover} />
                <ViolationList state={state} />
              </TabsContent>

              <TabsContent value="activity" className="tab-content">
                <div className="tab-heading">
                  <div>
                    <p className="eyebrow">Audit trail</p>
                    <h2>Activity</h2>
                  </div>
                  <p>Human-readable history for agent, human, and system events.</p>
                </div>
                <LedgerPanel events={lg.ledger.data ?? []} />
              </TabsContent>

              <TabsContent value="agent" className="tab-content agent-tab-content">
                <div className="tab-heading">
                  <div>
                    <p className="eyebrow">Connected capabilities</p>
                    <h2>WebMCP</h2>
                  </div>
                  <p>Planning tools are available to the agent; authorization remains human-led.</p>
                </div>
                <McpStatus registered={mcp.registered} toolNames={mcp.toolNames} />
                <section className="developer-demo">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Local demonstration</p>
                      <h3>Developer demo tools</h3>
                    </div>
                    <p>Exercise the same site tool surface used by an MCP agent.</p>
                  </div>
                  {lg.sessionKey ? (
                    <Suspense fallback={null}>
                      <AgentConsole
                        sessionKey={lg.sessionKey}
                        plan={plan}
                        onChange={lg.invalidate}
                      />
                    </Suspense>
                  ) : null}
                </section>
              </TabsContent>
            </Tabs>
          </section>
        </>
      )}
    </main>
  );
}
