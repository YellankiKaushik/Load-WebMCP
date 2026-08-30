import { AlertTriangle, Bot, CheckCircle2, Circle, ShieldCheck, User, XCircle } from "lucide-react";

import type { LedgerEvent, LoadState, PlanSummary } from "@/lib/loadguard/types";

export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card px-3 py-2">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-lg text-foreground">{value}</div>
    </div>
  );
}

export function PanelShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-card/70 backdrop-blur">
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

const statusStyles: Record<string, string> = {
  DRAFT: "text-muted-foreground border-border",
  STAGED: "text-warning border-warning/50",
  APPROVED: "text-success border-success/50",
  REJECTED: "text-destructive border-destructive/50",
  EXPIRED: "text-destructive border-destructive/50",
  EXECUTED: "text-accent border-accent/50",
  SUPERSEDED: "text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] ${
        statusStyles[status] ?? "text-muted-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}

export function PackageTable({
  state,
  onHover,
}: {
  state: LoadState;
  onHover: (code: string | null) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border/60">
      <table className="w-full text-left text-xs">
        <thead className="bg-secondary/60 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Package</th>
            <th className="px-3 py-2">Stop</th>
            <th className="px-3 py-2">Kg</th>
            <th className="px-3 py-2">Flags</th>
            <th className="px-3 py-2">State</th>
          </tr>
        </thead>
        <tbody>
          {state.packages.map((p) => (
            <tr
              key={p.id}
              onMouseEnter={() => onHover(p.code)}
              onMouseLeave={() => onHover(null)}
              className="border-t border-border/50 transition-colors hover:bg-secondary/40"
            >
              <td className="px-3 py-2 font-mono text-foreground">
                {p.code}
                <div className="text-[0.65rem] text-muted-foreground">{p.destination}</div>
              </td>
              <td className="px-3 py-2 font-mono text-muted-foreground">{p.deliveryStop}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground">{p.weightKg}</td>
              <td className="px-3 py-2">
                <span className="flex flex-wrap gap-1">
                  {p.fragile ? (
                    <span className="rounded bg-warning/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-warning">
                      FRAGILE
                    </span>
                  ) : null}
                  {p.priority === "urgent" ? (
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-destructive">
                      URGENT
                    </span>
                  ) : null}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[0.65rem]">
                {p.loaded ? (
                  <span className="text-success">LOADED</span>
                ) : (
                  <span className="text-muted-foreground">INBOUND</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ViolationList({ state }: { state: LoadState }) {
  const violations = state.activeValidation.violations;
  if (!violations.length) {
    return (
      <p className="flex items-center gap-2 text-xs text-success">
        <ShieldCheck className="h-4 w-4" /> Active load satisfies every hard rule.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {violations.map((v, i) => (
        <li key={`${v.code}-${i}`} className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-mono">{v.code}</span> — {v.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProposalPanel({
  plan,
  state,
  onApprove,
  onReject,
  busy,
}: {
  plan: PlanSummary | null;
  state: LoadState;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  if (!plan) {
    return (
      <p className="text-xs text-muted-foreground">
        No proposal yet. The agent calls <span className="font-mono">create_load_plan</span> then{" "}
        <span className="font-mono">stage_load_plan</span> to place one here.
      </p>
    );
  }

  const steps: { key: string; label: string; done: boolean }[] = [
    { key: "draft", label: "Candidate generated", done: true },
    { key: "staged", label: "Proposal staged", done: Boolean(plan.stagedAt) },
    { key: "approved", label: "Human approved", done: Boolean(plan.approvedAt) },
    { key: "executed", label: "Committed to active load", done: Boolean(plan.executedAt) },
  ];

  const byId = new Map(state.packages.map((pkg) => [pkg.id, pkg]));
  const moved = plan.placements.filter((item) => {
    const active = byId.get(item.boxId)?.position;
    if (!active) return true;
    return (
      Math.abs(active.x - item.position.x) > 0.5 ||
      Math.abs(active.y - item.position.y) > 0.5 ||
      Math.abs(active.z - item.position.z) > 0.5
    );
  });
  const violations = plan.validation?.violations ?? [];
  const warnings = plan.validation?.warnings ?? [];
  const unplaced = violations.filter((violation) => violation.code === "UNPLACED_PACKAGE");
  const targetCount = plan.targetBoxIds?.length ?? plan.placements.length;
  const placedCount = plan.placements.length;
  const validationValid = plan.validation?.valid ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-muted-foreground">
          {plan.planCode ?? plan.planId.slice(0, 8)} · {state.truck.code}
        </div>
        <StatusBadge status={plan.status} />
      </div>

      <ol className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs">
            {s.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-2 gap-2 font-mono text-[0.7rem] text-muted-foreground">
        <div>
          Current util <span className="text-foreground">{state.utilizationPct}%</span>
        </div>
        <div>
          Proposed total util <span className="text-foreground">{plan.utilizationPct ?? "—"}%</span>
        </div>
        <div>
          Proposed total weight{" "}
          <span className="text-foreground">{plan.totalWeightKg ?? "—"} kg</span>
        </div>
        <div>
          Target <span className="text-foreground">{targetCount}</span>
        </div>
        <div>
          Placed <span className="text-foreground">{placedCount}</span>
        </div>
        <div>
          Moved <span className="text-foreground">{moved.length}</span>
        </div>
        <div>
          Source rev <span className="text-foreground">{plan.sourceStateRevision ?? "—"}</span>
        </div>
        <div>
          Validation{" "}
          <span className={validationValid ? "text-success" : "text-destructive"}>
            {validationValid ? "VALID" : "PLAN INVALID"}
          </span>
        </div>
        <div>
          Expires{" "}
          <span className="text-foreground">
            {plan.expiresAt ? new Date(plan.expiresAt).toLocaleTimeString() : "not staged"}
          </span>
        </div>
        <div className="col-span-2 truncate">
          Hash <span className="text-foreground">{plan.planHash ?? "not staged"}</span>
        </div>
        {plan.approvedHash ? (
          <div className="col-span-2 truncate">
            Approved hash <span className="text-foreground">{plan.approvedHash}</span>
          </div>
        ) : null}
      </div>

      <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
          Validation
        </div>
        {unplaced.length ? (
          <ul className="mt-2 space-y-1 text-xs text-destructive">
            {unplaced.map((violation, index) => (
              <li key={`unplaced-${index}`}>
                <span className="font-mono">UNPLACED</span> {violation.boxCodes.join(", ")}
              </li>
            ))}
          </ul>
        ) : null}
        {violations.length ? (
          <ul className="mt-2 space-y-1 text-xs text-destructive">
            {violations.map((violation, index) => (
              <li key={`${violation.code}-${index}`}>
                <span className="font-mono">{violation.code}</span> {violation.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-success">No hard violations recorded.</p>
        )}
        {warnings.length ? (
          <ul className="mt-2 space-y-1 text-xs text-warning">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>
                <span className="font-mono">{warning.code}</span> {warning.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {plan.status === "STAGED" ? (
        <div className="space-y-2">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-warning">
            Human approval required before operational commit
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !validationValid || placedCount !== targetCount}
              onClick={onApprove}
              className="flex-1 rounded-md bg-success px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Approve proposal
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="rounded-md border border-destructive/60 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[0.7rem] text-muted-foreground">
          {plan.status === "APPROVED"
            ? "Approved. The agent may now call commit_load_plan with this proposal id."
            : plan.status === "EXECUTED"
              ? "This proposal is the active load. Commit is one-time."
              : "Approval is only possible while a proposal is STAGED."}
        </p>
      )}
    </div>
  );
}

const actorIcon = {
  agent: Bot,
  human: User,
  system: Circle,
};

export function LedgerPanel({ events }: { events: LedgerEvent[] }) {
  if (!events.length) {
    return <p className="text-xs text-muted-foreground">No events recorded yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {events.map((e) => {
        const Icon = actorIcon[e.actor] ?? Circle;
        const tone =
          e.result === "success"
            ? "text-success"
            : e.result === "blocked"
              ? "text-warning"
              : "text-destructive";
        return (
          <li key={e.id} className="flex items-start gap-2 text-xs">
            <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone}`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
                <span>{new Date(e.occurredAt).toLocaleTimeString()}</span>
                <span>{e.actor}</span>
                <span>{e.toolName ?? e.eventType}</span>
                <span className={tone}>{e.result}</span>
              </div>
              <p className="text-foreground/90">{e.summary}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function McpStatus({ registered, toolNames }: { registered: boolean; toolNames: string[] }) {
  const modeFor = (name: string) => {
    if (["get_load_state", "get_package_constraints", "get_action_ledger"].includes(name)) {
      return "READ ONLY";
    }
    if (name === "commit_load_plan") return "CHANGES OPERATIONAL STATE";
    return "CHANGES CANDIDATE STATE";
  };

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-xs">
        {registered ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-success">Tools registered on document.modelContext</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-warning" />
            <span className="text-warning">
              No WebMCP host detected — open in a WebMCP-capable agent browser. The human controls
              below still work.
            </span>
          </>
        )}
      </p>
      <ul className="grid gap-1 font-mono text-[0.7rem] text-muted-foreground sm:grid-cols-2">
        {toolNames.map((name) => (
          <li key={name} className="truncate">
            <span className="text-foreground">{name}</span>{" "}
            <span className="text-[0.6rem]">{modeFor(name)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[0.7rem] text-muted-foreground">
        Approval is deliberately not a tool. Commit accepts only a proposal id and is enforced in
        the database.
      </p>
    </div>
  );
}
