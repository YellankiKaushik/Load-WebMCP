import {
  Activity,
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Clock3,
  Fingerprint,
  Package,
  Plug,
  RotateCcw,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LedgerEvent, LoadState, PlanStatus, PlanSummary } from "@/lib/loadguard/types";

type StatusTone = "agent" | "success" | "warning" | "danger" | "info" | "neutral";

const statusConfig: Record<string, { tone: StatusTone; icon: typeof Circle; label?: string }> = {
  DRAFT: { tone: "agent", icon: Bot },
  STAGED: { tone: "warning", icon: CircleDot },
  APPROVED: { tone: "success", icon: ShieldCheck },
  REJECTED: { tone: "danger", icon: XCircle },
  EXPIRED: { tone: "danger", icon: Clock3 },
  EXECUTING: { tone: "info", icon: Activity },
  EXECUTED: { tone: "success", icon: CheckCircle2 },
  SUPERSEDED: { tone: "neutral", icon: Circle },
  VALID: { tone: "success", icon: ShieldCheck },
  WARNING: { tone: "warning", icon: AlertTriangle },
  BLOCKED: { tone: "warning", icon: Ban },
  SUCCESS: { tone: "success", icon: CheckCircle2 },
  FAILED: { tone: "danger", icon: XCircle },
  LOADED: { tone: "success", icon: CheckCircle2 },
  INBOUND: { tone: "neutral", icon: CircleDot },
  URGENT: { tone: "danger", icon: AlertTriangle },
  FRAGILE: { tone: "warning", icon: Package },
};

const toneClasses: Record<StatusTone, string> = {
  agent: "border-[color:var(--agent)]/45 bg-[color:var(--agent)]/12 text-[color:var(--agent)]",
  success: "border-success/45 bg-success/12 text-success",
  warning: "border-warning/45 bg-warning/12 text-warning",
  danger: "border-destructive/45 bg-destructive/12 text-destructive",
  info: "border-accent/45 bg-accent/12 text-accent",
  neutral: "border-border bg-secondary/60 text-muted-foreground",
};

const stopColors = ["#56a4ff", "#2fc8b4", "#9b7cff", "#d98b54", "#6e8498"];

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatTime(value: string | null) {
  if (!value) return "not recorded";
  return new Date(value).toLocaleString();
}

function expiryText(expiresAt: string | null) {
  if (!expiresAt) return { label: "No expiry recorded", tone: "neutral" as StatusTone };
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return { label: "Expired", tone: "danger" as StatusTone };
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    label: `Expires in ${minutes}m ${seconds.toString().padStart(2, "0")}s`,
    tone: minutes <= 5 ? ("warning" as StatusTone) : ("neutral" as StatusTone),
  };
}

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
}) {
  const config = statusConfig[status] ?? { tone: "neutral" as StatusTone, icon: Circle };
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone ?? config.tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{label ?? config.label ?? status}</span>
    </span>
  );
}

export function PanelShell({
  title,
  subtitle,
  children,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-secondary", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function CommandHeader({
  registered,
  toolNames,
  busy,
  sessionReady,
  onReset,
}: {
  registered: boolean;
  toolNames: string[];
  busy: boolean;
  sessionReady: boolean;
  onReset: () => void;
}) {
  return (
    <header className="command-header">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-primary/12 text-primary">
          <Truck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">LoadGuard Mission Control</p>
          <h1 className="mt-1 text-2xl font-semibold leading-none tracking-normal text-foreground md:text-[1.7rem]">
            LoadGuard 3D
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Agent-native load planning with human-controlled execution.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AI proposes | Human approves | Database enforces
          </p>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:justify-end">
        <StatusBadge
          status={registered ? "VALID" : "WARNING"}
          label={registered ? `WebMCP connected - ${toolNames.length} tools` : "WebMCP unavailable"}
          tone={registered ? "success" : "warning"}
        />
        <span className="inline-flex min-h-7 items-center rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          PROD VERIFIED
        </span>
        <button
          type="button"
          onClick={onReset}
          disabled={busy || !sessionReady}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset scenario
        </button>
      </div>
    </header>
  );
}

export function MetricStrip({ state }: { state: LoadState }) {
  const loadedPct = Math.round((state.loadedCount / state.packages.length) * 100);
  const weightPct = Math.round((state.totalWeightKg / state.truck.maxWeightKg) * 100);
  const metrics = [
    {
      label: "Truck",
      value: state.truck.code,
      meta: `revision ${state.stateRevision}`,
      icon: Truck,
      percent: null,
    },
    {
      label: "Load",
      value: `${state.loadedCount} / ${state.packages.length}`,
      meta: `${loadedPct}% loaded`,
      icon: Package,
      percent: loadedPct,
    },
    {
      label: "Utilization",
      value: formatPercent(state.utilizationPct),
      meta: "spatial volume used",
      icon: Activity,
      percent: state.utilizationPct,
    },
    {
      label: "Weight",
      value: `${state.totalWeightKg} / ${state.truck.maxWeightKg} kg`,
      meta: `${weightPct}% of limit`,
      icon: ShieldCheck,
      percent: weightPct,
    },
  ];

  return (
    <section className="metric-strip" aria-label="Truck telemetry">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article key={metric.label} className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                <p className="mt-1 break-words font-mono text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
                  {metric.value}
                </p>
              </div>
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">{metric.meta}</p>
              {metric.percent !== null ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, metric.percent))}%` }}
                  />
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function SceneShell({
  state,
  hasCandidate,
  children,
}: {
  state: LoadState;
  hasCandidate: boolean;
  children: ReactNode;
}) {
  return (
    <section className="surface-workspace overflow-hidden">
      <div className="scene-toolbar">
        <div>
          <p className="text-xs font-semibold text-primary">3D load workspace</p>
          <h2 className="mt-1 font-mono text-lg font-semibold text-foreground">
            {state.truck.code}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge status="LOADED" label="Active load" tone="success" />
          {hasCandidate ? <StatusBadge status="DRAFT" label="Agent proposal" tone="agent" /> : null}
        </div>
      </div>
      <div className="relative h-[390px] overflow-hidden bg-[#0a0f14] sm:h-[460px] lg:h-[540px] xl:h-[600px]">
        {children}
        <div className="scene-legend" aria-label="3D scene legend">
          <span>
            <span className="legend-swatch legend-solid" /> Active load
          </span>
          <span>
            <span className="legend-swatch legend-candidate" /> Agent proposal
          </span>
          <span>
            <span className="legend-diamond" /> Fragile
          </span>
          <span>
            <span className="legend-dot" /> Urgent
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <span className="font-mono text-foreground">x=0</span> rear door
        </div>
      </div>
    </section>
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
    <div className="max-w-full overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-secondary/80 text-xs font-semibold text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Package</th>
            <th className="px-4 py-3">Stop</th>
            <th className="px-4 py-3">Kg</th>
            <th className="px-4 py-3">Flags</th>
            <th className="px-4 py-3">State</th>
          </tr>
        </thead>
        <tbody>
          {state.packages.map((p) => (
            <tr
              key={p.id}
              onMouseEnter={() => onHover(p.code)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "border-t border-border/55 transition-colors hover:bg-secondary/50",
                !p.loaded && p.priority === "urgent" ? "bg-destructive/5" : null,
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-1.5 rounded-full"
                    style={{
                      backgroundColor: stopColors[(p.deliveryStop - 1) % stopColors.length]!,
                    }}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-mono text-sm font-semibold text-foreground">{p.code}</div>
                    <div className="text-xs text-muted-foreground">{p.destination}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                {p.deliveryStop}
              </td>
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{p.weightKg}</td>
              <td className="px-4 py-3">
                <span className="flex flex-wrap gap-1.5">
                  {p.fragile ? <StatusBadge status="FRAGILE" /> : null}
                  {p.priority === "urgent" ? <StatusBadge status="URGENT" /> : null}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.loaded ? "LOADED" : "INBOUND"} />
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
  const warnings = state.activeValidation.warnings;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-success/35 bg-success/8 p-3">
        {violations.length ? (
          <StatusBadge
            status="BLOCKED"
            label={`${violations.length} hard violation(s)`}
            tone="danger"
          />
        ) : (
          <StatusBadge status="VALID" label="No hard violations" tone="success" />
        )}
        {violations.length ? (
          <ul className="mt-3 space-y-2 text-sm text-destructive">
            {violations.map((v, i) => (
              <li key={`${v.code}-${i}`}>
                <span className="font-mono font-semibold">{v.code}</span> {v.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Active load satisfies every enforced hard rule.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-warning/30 bg-warning/8 p-3">
        <StatusBadge
          status="WARNING"
          label={`${warnings.length} review warning(s)`}
          tone={warnings.length ? "warning" : "neutral"}
        />
        {warnings.length ? (
          <ul className="mt-3 space-y-2 text-sm text-warning">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>
                <span className="font-mono font-semibold">{warning.code}</span> {warning.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No review warnings are attached to the active load.
          </p>
        )}
      </div>
    </div>
  );
}

function WorkflowStepper({ plan }: { plan: PlanSummary }) {
  const rank: Record<PlanStatus, number> = {
    DRAFT: 1,
    STAGED: 3,
    APPROVED: 4,
    REJECTED: 3,
    EXPIRED: 3,
    EXECUTING: 5,
    EXECUTED: 5,
    FAILED: 5,
    SUPERSEDED: 5,
  };
  const progress = rank[plan.status] ?? 1;
  const steps = [
    { label: "Candidate created", role: "AGENT", icon: Bot, activeAt: 1 },
    { label: "Hard rules validated", role: "SYSTEM", icon: ShieldCheck, activeAt: 2 },
    { label: "Proposal staged", role: "AGENT", icon: Bot, activeAt: 3 },
    { label: "Human approval", role: "HUMAN", icon: User, activeAt: 4 },
    { label: "Operational commit", role: "AGENT", icon: Bot, activeAt: 5 },
  ];

  return (
    <ol className="space-y-1">
      {steps.map((step, index) => {
        const complete =
          step.activeAt < progress ||
          (step.activeAt === 4 && Boolean(plan.approvedAt)) ||
          (step.activeAt === 5 && Boolean(plan.executedAt));
        const current =
          (plan.status === "STAGED" && step.activeAt === 4) ||
          (plan.status === "APPROVED" && step.activeAt === 5) ||
          (plan.status === "DRAFT" && step.activeAt === 2);
        const Icon = complete ? CheckCircle2 : current ? CircleDot : step.icon;
        return (
          <li key={step.label} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border",
                  complete
                    ? "border-success/60 bg-success/12 text-success"
                    : current
                      ? "border-warning/70 bg-warning/12 text-warning"
                      : "border-border bg-secondary/60 text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {index < steps.length - 1 ? <span className="h-6 w-px bg-border/80" /> : null}
            </div>
            <div className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={
                    complete || current
                      ? "text-sm text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
                <span className="font-mono text-[0.68rem] font-semibold text-muted-foreground">
                  {step.role}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DecisionMetric({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/55 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold text-foreground">{value}</p>
      {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
    </div>
  );
}

function IntegrityDetails({ plan }: { plan: PlanSummary }) {
  const [open, setOpen] = useState(false);
  const fields = [
    ["Proposal ID", plan.planId],
    ["Source revision", plan.sourceStateRevision ?? "not staged"],
    ["Plan hash", plan.planHash ?? "not staged"],
    ["Approved hash", plan.approvedHash ?? "not approved"],
    ["Created", formatTime(plan.createdAt)],
    ["Staged", formatTime(plan.stagedAt)],
    ["Approved", formatTime(plan.approvedAt)],
    ["Executed", formatTime(plan.executedAt)],
    ["Expires", formatTime(plan.expiresAt)],
  ];

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-border/70 bg-background/45"
    >
      <CollapsibleTrigger className="flex min-h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" aria-hidden="true" />
          Integrity details
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open ? "rotate-180" : null,
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/70 px-3 py-3">
        <dl className="grid gap-2 text-xs">
          {fields.map(([label, value]) => (
            <div key={label} className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-all font-mono text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </CollapsibleContent>
    </Collapsible>
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
  const [, setTick] = useState(0);
  useEffect(() => {
    if (plan?.status !== "STAGED" || !plan.expiresAt) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [plan?.expiresAt, plan?.status]);

  if (!plan) {
    return (
      <aside className="decision-rail">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-primary">Human decision rail</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">No active proposal</h2>
          </div>
          <StatusBadge status="INBOUND" label="Awaiting agent plan" />
        </div>
        <div className="rounded-lg border border-[color:var(--agent)]/35 bg-[color:var(--agent)]/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot className="h-4 w-4 text-[color:var(--agent)]" aria-hidden="true" />
            Agent proposal required
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The agent can create, validate, and stage a candidate plan. Human authorization remains
            separate from WebMCP tools.
          </p>
        </div>
      </aside>
    );
  }

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
  const targetCount = plan.targetBoxIds?.length ?? plan.placements.length;
  const placedCount = plan.placements.length;
  const validationValid = plan.validation?.valid ?? false;
  const expiry = expiryText(plan.expiresAt);

  return (
    <aside className="decision-rail">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">Human decision rail</p>
          <h2 className="mt-1 truncate font-mono text-xl font-semibold text-foreground">
            {plan.planCode ?? plan.planId.slice(0, 8)} | {state.truck.code}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Agent-generated load proposal</p>
        </div>
        <StatusBadge status={plan.status} />
      </div>

      {plan.status === "STAGED" ? (
        <div className={cn("rounded-lg border p-3", toneClasses[expiry.tone])}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {expiry.label}
          </div>
          <p className="mt-1 text-xs opacity-80">
            Server authority still decides expiry. Exact timestamp is in integrity details.
          </p>
        </div>
      ) : null}

      <PanelShell title="Workflow progress" className="bg-background/35">
        <WorkflowStepper plan={plan} />
      </PanelShell>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Decision summary</h3>
          <StatusBadge
            status={validationValid ? "VALID" : "BLOCKED"}
            label={validationValid ? "Valid" : "Plan invalid"}
            tone={validationValid ? "success" : "danger"}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DecisionMetric label="Placed / target" value={`${placedCount} / ${targetCount}`} />
          <DecisionMetric label="Moved" value={String(moved.length)} meta="from active load" />
          <DecisionMetric
            label="Utilization"
            value={`${plan.utilizationPct ?? "-"}%`}
            meta={`${state.utilizationPct}% current`}
          />
          <DecisionMetric
            label="Weight"
            value={`${plan.totalWeightKg ?? "-"} kg`}
            meta={`${state.totalWeightKg} kg current`}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Validation and review</h3>
        <div className="rounded-lg border border-success/35 bg-success/8 p-3">
          {violations.length ? (
            <StatusBadge
              status="BLOCKED"
              label={`${violations.length} hard violation(s)`}
              tone="danger"
            />
          ) : (
            <StatusBadge status="VALID" label="No hard violations" tone="success" />
          )}
          {violations.length ? (
            <ul className="mt-3 space-y-2 text-sm text-destructive">
              {violations.map((violation, index) => (
                <li key={`${violation.code}-${index}`}>
                  <span className="font-mono font-semibold">{violation.code}</span>{" "}
                  {violation.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-lg border border-warning/35 bg-warning/8 p-3">
          <StatusBadge
            status="WARNING"
            label={`${warnings.length} review warning(s)`}
            tone={warnings.length ? "warning" : "neutral"}
          />
          {warnings.length ? (
            <ul className="mt-3 space-y-2 text-sm text-warning">
              {warnings.map((warning, index) => (
                <li key={`${warning.code}-${index}`}>
                  <span className="font-mono font-semibold">{warning.code}</span> {warning.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {plan.status === "STAGED" ? (
        <section className="rounded-lg border border-warning/45 bg-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <User className="h-4 w-4" aria-hidden="true" />
            HUMAN AUTHORIZATION REQUIRED
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Approving authorizes the agent to commit this exact staged proposal. Approval itself
            does not change the active truck load.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy || !validationValid || placedCount !== targetCount}
              onClick={onApprove}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Approve proposal
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-destructive/55 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Reject
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border/70 bg-background/45 p-4">
          {plan.status === "APPROVED" ? (
            <>
              <StatusBadge status="APPROVED" label="Human approved" tone="success" />
              <p className="mt-2 text-sm text-muted-foreground">
                Agent may now commit this exact proposal. Active load remains separate until commit.
              </p>
            </>
          ) : plan.status === "EXECUTED" ? (
            <>
              <StatusBadge status="EXECUTED" label="Executed" tone="success" />
              <p className="mt-2 text-sm text-muted-foreground">
                Approved proposal is now the active truck load. Commit is one-time.
              </p>
            </>
          ) : plan.status === "EXPIRED" ? (
            <>
              <StatusBadge status="EXPIRED" label="Proposal expired" tone="danger" />
              <p className="mt-2 text-sm text-muted-foreground">
                This proposal can no longer be approved or executed. Create a fresh plan from the
                current truck state.
              </p>
            </>
          ) : (
            <>
              <StatusBadge status={plan.status} />
              <p className="mt-2 text-sm text-muted-foreground">
                Approval is only possible while a proposal is staged.
              </p>
            </>
          )}
        </section>
      )}

      <IntegrityDetails plan={plan} />
    </aside>
  );
}

const actorIcon = {
  agent: Bot,
  human: User,
  system: ShieldCheck,
};

export function LedgerPanel({ events }: { events: LedgerEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No events recorded yet.</p>;
  }
  return (
    <ol className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border/80">
      {events.map((e) => {
        const Icon = actorIcon[e.actor] ?? Circle;
        const tone: StatusTone =
          e.result === "success" ? "success" : e.result === "blocked" ? "warning" : "danger";
        return (
          <li key={e.id} className="relative grid grid-cols-[34px_minmax(0,1fr)] gap-3">
            <span
              className={cn(
                "z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-card",
                toneClasses[tone],
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-muted-foreground">
                  {new Date(e.occurredAt).toLocaleTimeString()}
                </span>
                <span className="font-semibold text-foreground">{e.actor}</span>
                <span className="font-mono text-muted-foreground">{e.toolName ?? e.eventType}</span>
                <StatusBadge
                  status={e.result === "blocked" ? "BLOCKED" : e.result.toUpperCase()}
                  label={e.result}
                  tone={tone}
                />
              </div>
              <p className="mt-2 text-sm text-foreground/90">{e.summary}</p>
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
      return { label: "READ ONLY", tone: "neutral" as StatusTone };
    }
    if (name === "commit_load_plan") {
      return { label: "CHANGES OPERATIONAL STATE", tone: "danger" as StatusTone };
    }
    return { label: "CHANGES CANDIDATE STATE", tone: "agent" as StatusTone };
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/70 bg-background/45 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Plug className="h-4 w-4 text-primary" aria-hidden="true" />
              WebMCP
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {registered
                ? "Tools registered on document.modelContext."
                : "No WebMCP host detected. Human controls still work."}
            </p>
          </div>
          <StatusBadge
            status={registered ? "VALID" : "WARNING"}
            label={registered ? `Connected - ${toolNames.length} tools` : "Unavailable"}
            tone={registered ? "success" : "warning"}
          />
        </div>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {toolNames.map((name) => {
          const mode = modeFor(name);
          return (
            <li key={name} className="rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="font-mono text-sm font-semibold text-foreground">{name}</div>
              <div className="mt-2">
                <StatusBadge status="DRAFT" label={mode.label} tone={mode.tone} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="rounded-lg border border-success/30 bg-success/8 p-3 text-sm text-muted-foreground">
        Human approval is intentionally not exposed as a WebMCP tool. Commit accepts only a proposal
        id and is enforced by the database.
      </p>
    </div>
  );
}
