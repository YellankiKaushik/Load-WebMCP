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
  STAGED: { tone: "info", icon: CircleDot },
  APPROVED: { tone: "success", icon: ShieldCheck },
  REJECTED: { tone: "danger", icon: XCircle },
  EXPIRED: { tone: "danger", icon: Clock3 },
  EXECUTING: { tone: "info", icon: Activity },
  EXECUTED: { tone: "success", icon: CheckCircle2 },
  SUPERSEDED: { tone: "neutral", icon: Circle },
  VALID: { tone: "success", icon: ShieldCheck },
  WARNING: { tone: "warning", icon: AlertTriangle },
  BLOCKED: { tone: "danger", icon: Ban },
  SUCCESS: { tone: "success", icon: CheckCircle2 },
  FAILED: { tone: "danger", icon: XCircle },
  LOADED: { tone: "success", icon: CheckCircle2 },
  INBOUND: { tone: "info", icon: CircleDot },
  URGENT: { tone: "danger", icon: AlertTriangle },
  FRAGILE: { tone: "warning", icon: Package },
};

const toneClasses: Record<StatusTone, string> = {
  agent: "status-badge--agent",
  success: "status-badge--success",
  warning: "status-badge--warning",
  danger: "status-badge--danger",
  info: "status-badge--info",
  neutral: "status-badge--neutral",
};

const stopColors = ["#2563eb", "#0f9f8f", "#7c3aed", "#c46b2f", "#64748b"];

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
    <span className={cn("status-badge", toneClasses[tone ?? config.tone], className)}>
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
    <section className={cn("subsection", className)}>
      <header className="subsection-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="subsection-body">{children}</div>
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
    <header className="product-nav">
      <a href="#workspace" className="brand-lockup" aria-label="LoadGuard 3D overview">
        <span className="brand-mark">
          <Truck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <strong>LoadGuard 3D</strong>
        </span>
      </a>

      <div className="product-nav__actions">
        <StatusBadge
          status={registered ? "VALID" : "WARNING"}
          label={registered ? `WebMCP connected · ${toolNames.length} tools` : "WebMCP unavailable"}
          tone={registered ? "success" : "warning"}
        />
        {import.meta.env.DEV ? <span className="environment-badge">Local</span> : null}
        <button
          type="button"
          onClick={onReset}
          disabled={busy || !sessionReady}
          className="button button--secondary"
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
      label: "Loaded packages",
      value: `${state.loadedCount} / ${state.packages.length}`,
      meta: `${loadedPct}% complete`,
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
      value: `${state.totalWeightKg} kg`,
      meta: `${state.truck.maxWeightKg} kg capacity · ${weightPct}% used`,
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
            <div className="metric-card__topline">
              <div>
                <p className="metric-card__label">{metric.label}</p>
                <p className="metric-card__value">{metric.value}</p>
              </div>
              <span className="metric-card__icon">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="metric-card__meta">{metric.meta}</p>
            <div className="metric-progress" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(0, metric.percent))}%` }} />
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
    <section className="scene-card">
      <div className="scene-card__header">
        <div>
          <p className="eyebrow">3D load visualization</p>
          <h2>{state.truck.code}</h2>
          <span>Active layout</span>
        </div>
        <div className="scene-card__status">
          <StatusBadge status="LOADED" label="Active load" />
          {hasCandidate ? <StatusBadge status="DRAFT" label="Candidate plan" /> : null}
        </div>
      </div>
      <div className="scene-viewport">
        {children}
        <div className="scene-legend" aria-label="3D scene legend">
          <span>
            <span className="legend-swatch legend-solid" /> Active
          </span>
          <span>
            <span className="legend-swatch legend-candidate" /> Candidate
          </span>
          <span>
            <span className="legend-diamond" /> Fragile
          </span>
          <span>
            <span className="legend-dot" /> Urgent
          </span>
        </div>
        <div className="scene-coordinate">
          <span className="identifier">x=0</span> rear door
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
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Destination</th>
            <th>Stop</th>
            <th>Weight</th>
            <th>Handling</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {state.packages.map((p) => (
            <tr
              key={p.id}
              onMouseEnter={() => onHover(p.code)}
              onMouseLeave={() => onHover(null)}
              className={
                !p.loaded && p.priority === "urgent" ? "data-table__row--urgent" : undefined
              }
            >
              <td>
                <div className="package-name">
                  <span
                    className="stop-marker"
                    style={{
                      backgroundColor: stopColors[(p.deliveryStop - 1) % stopColors.length]!,
                    }}
                    aria-hidden="true"
                  />
                  <span className="identifier">{p.code}</span>
                </div>
              </td>
              <td>{p.destination}</td>
              <td>Stop {p.deliveryStop}</td>
              <td>{p.weightKg} kg</td>
              <td>
                <span className="table-badges">
                  {p.fragile ? <StatusBadge status="FRAGILE" /> : null}
                  {p.priority === "urgent" ? <StatusBadge status="URGENT" /> : null}
                </span>
              </td>
              <td>
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
    <div className="quality-grid">
      <div
        className={cn(
          "quality-panel",
          violations.length ? "quality-panel--danger" : "quality-panel--success",
        )}
      >
        {violations.length ? (
          <StatusBadge status="BLOCKED" label={`${violations.length} hard violation(s)`} />
        ) : (
          <StatusBadge status="VALID" label="No hard violations" />
        )}
        {violations.length ? (
          <ul>
            {violations.map((v, i) => (
              <li key={`${v.code}-${i}`}>
                <span className="identifier">{v.code}</span> {v.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>Active load satisfies every enforced hard rule.</p>
        )}
      </div>
      <div
        className={cn(
          "quality-panel",
          warnings.length ? "quality-panel--warning" : "quality-panel--neutral",
        )}
      >
        <StatusBadge
          status="WARNING"
          label={`${warnings.length} review warning(s)`}
          tone={warnings.length ? "warning" : "neutral"}
        />
        {warnings.length ? (
          <ul>
            {warnings.map((warning, i) => (
              <li key={`${warning.code}-${i}`}>
                <span className="identifier">{warning.code}</span> {warning.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>No review warnings are attached to the active load.</p>
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
    { label: "Plan created", role: "Agent", icon: Bot, activeAt: 1 },
    { label: "Validated", role: "System", icon: ShieldCheck, activeAt: 2 },
    { label: "Staged", role: "Agent", icon: Bot, activeAt: 3 },
    { label: "Human approval", role: "Human", icon: User, activeAt: 4 },
    { label: "Committed", role: "Agent", icon: Bot, activeAt: 5 },
  ];
  return (
    <ol className="workflow-stepper">
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
          <li
            key={step.label}
            className={cn(
              complete && "workflow-step--complete",
              current && "workflow-step--current",
            )}
          >
            <span className="workflow-step__dot">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="workflow-step__label">{step.label}</span>
            <span className="workflow-step__role">{step.role}</span>
            {index < steps.length - 1 ? (
              <span className="workflow-step__line" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function DecisionMetric({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="decision-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

function IntegrityDetails({ plan }: { plan: PlanSummary }) {
  const [open, setOpen] = useState(false);
  const fields: [string, string | number][] = [
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
    <Collapsible open={open} onOpenChange={setOpen} className="integrity-details">
      <CollapsibleTrigger className="integrity-details__trigger">
        <span>
          <Fingerprint className="h-4 w-4" aria-hidden="true" /> Integrity details
        </span>
        <ChevronDown className={cn("h-4 w-4", open && "rotate-180")} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent className="integrity-details__content">
        <dl>
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd
                className={
                  label.includes("ID") || label.includes("hash") ? "identifier" : undefined
                }
              >
                {value}
              </dd>
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
      <aside className="decision-panel decision-panel--empty">
        <div className="decision-panel__heading">
          <div>
            <h2>Load proposal</h2>
          </div>
          <StatusBadge status="INBOUND" label="Awaiting plan" />
        </div>
        <section className="empty-proposal">
          <div className="empty-proposal__heading">
            <div>
              <p>Agent planning</p>
              <h3>Ready</h3>
            </div>
            <StatusBadge status="VALID" label="Ready" tone="neutral" />
          </div>
          <div>
            <h3>Awaiting agent plan</h3>
            <p>
              The agent can inspect the active load, create a deterministic candidate, validate it,
              and stage it for review.
            </p>
          </div>
        </section>
        <section className="decision-note">
          <div className="decision-note__title">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <div>
              <h3>Authorization boundary</h3>
              <p>Human approval is required before operational commit.</p>
            </div>
          </div>
          <ul className="boundary-list">
            <li>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approval is not a WebMCP tool
            </li>
            <li>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approval does not change the active load
            </li>
            <li>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Database authority verifies execution
            </li>
          </ul>
        </section>
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
    <aside className="decision-panel">
      <div className="decision-panel__heading">
        <div>
          <p className="eyebrow">Human decision</p>
          <h2>Load proposal</h2>
          <span className="identifier">{plan.planCode ?? plan.planId.slice(0, 8)}</span>
        </div>
        <StatusBadge status={plan.status} />
      </div>
      <p className="decision-panel__subhead">
        For truck <span className="identifier">{state.truck.code}</span> · agent-generated candidate
      </p>

      {plan.status === "STAGED" ? (
        <div className={cn("expiry-notice", `expiry-notice--${expiry.tone}`)}>
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          <div>
            <strong>{expiry.label}</strong>
            <span>Proposal expiry is enforced by server authority.</span>
          </div>
        </div>
      ) : null}

      <section className="proposal-summary">
        <div className="section-heading">
          <h3>Plan summary</h3>
          <div className="inline-status-group">
            <StatusBadge
              status={validationValid ? "VALID" : "BLOCKED"}
              label={validationValid ? "Valid" : "Plan invalid"}
              tone={validationValid ? "success" : "danger"}
            />
            <StatusBadge
              status="WARNING"
              label={`${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
              tone={warnings.length ? "warning" : "neutral"}
            />
          </div>
        </div>
        <div className="decision-metrics">
          <DecisionMetric label="Packages placed" value={`${placedCount} / ${targetCount}`} />
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

      {plan.status === "STAGED" ? (
        <section className="authorization-card">
          <div className="authorization-card__title">
            <span className="authorization-icon">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3>Human approval required</h3>
              <span>Approval authorizes this exact staged plan for later commit.</span>
            </div>
          </div>
          <p>Approval itself does not change the active truck load.</p>
          <div className="authorization-actions">
            <button
              type="button"
              disabled={busy || !validationValid || placedCount !== targetCount}
              onClick={onApprove}
              className="button button--primary"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Approve proposal
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="button button--secondary button--danger"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Reject
            </button>
          </div>
        </section>
      ) : null}

      <section className="workflow-section">
        <div className="section-heading">
          <h3>Plan progress</h3>
          <span className="section-caption">Exact proposal lifecycle</span>
        </div>
        <WorkflowStepper plan={plan} />
      </section>

      <section className="review-summary">
        <div className="section-heading">
          <h3>Review checks</h3>
          <span className="section-caption">Warnings do not block review</span>
        </div>
        <div
          className={cn(
            "review-row",
            violations.length ? "review-row--danger" : "review-row--success",
          )}
        >
          <StatusBadge
            status={violations.length ? "BLOCKED" : "VALID"}
            label={
              violations.length ? `${violations.length} hard violation(s)` : "No hard violations"
            }
          />
          {violations.length ? (
            <ul>
              {violations.map((v, i) => (
                <li key={`${v.code}-${i}`}>
                  <span className="identifier">{v.code}</span> {v.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div
          className={cn(
            "review-row",
            warnings.length ? "review-row--warning" : "review-row--neutral",
          )}
        >
          <StatusBadge
            status="WARNING"
            label={`${warnings.length} review warning(s)`}
            tone={warnings.length ? "warning" : "neutral"}
          />
          {warnings.length ? (
            <ul>
              {warnings.map((warning, i) => (
                <li key={`${warning.code}-${i}`}>
                  <span className="identifier">{warning.code}</span> {warning.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {plan.status !== "STAGED" ? (
        <section className="proposal-state-card">
          {plan.status === "APPROVED" ? (
            <>
              <StatusBadge status="APPROVED" label="Human approved" />
              <p>
                Agent may now commit this exact proposal. Active load remains separate until commit.
              </p>
            </>
          ) : plan.status === "EXECUTED" ? (
            <>
              <StatusBadge status="EXECUTED" label="Executed" />
              <p>Approved proposal is now the active truck load. Commit is one-time.</p>
            </>
          ) : plan.status === "EXPIRED" ? (
            <>
              <StatusBadge status="EXPIRED" label="Proposal expired" />
              <p>
                This proposal can no longer be approved or executed. Create a fresh plan from the
                current truck state.
              </p>
            </>
          ) : (
            <>
              <StatusBadge status={plan.status} />
              <p>Approval is only possible while a proposal is staged.</p>
            </>
          )}
        </section>
      ) : null}

      <IntegrityDetails plan={plan} />
    </aside>
  );
}

const actorIcon = { agent: Bot, human: User, system: ShieldCheck };

export function LedgerPanel({ events }: { events: LedgerEvent[] }) {
  if (!events.length) return <p className="empty-state">No events recorded yet.</p>;
  return (
    <ol className="activity-feed">
      {events.map((e) => {
        const Icon = actorIcon[e.actor] ?? Circle;
        const tone: StatusTone =
          e.result === "success" ? "success" : e.result === "blocked" ? "warning" : "danger";
        return (
          <li key={e.id} className="activity-item">
            <span className={cn("activity-item__icon", `activity-item__icon--${tone}`)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="activity-item__body">
              <div className="activity-item__meta">
                <span className="activity-item__title">{e.summary}</span>
                <StatusBadge
                  status={e.result === "blocked" ? "BLOCKED" : e.result.toUpperCase()}
                  label={e.result}
                  tone={tone}
                />
              </div>
              <div className="activity-item__details">
                <span>{e.actor}</span>
                <span className="identifier">{e.toolName ?? e.eventType}</span>
                <time>{new Date(e.occurredAt).toLocaleTimeString()}</time>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function McpStatus({ registered, toolNames }: { registered: boolean; toolNames: string[] }) {
  const modeFor = (name: string) => {
    if (["get_load_state", "get_package_constraints", "get_action_ledger"].includes(name))
      return {
        label: "Read only",
        tone: "neutral" as StatusTone,
        description: "Inspect current operational data",
      };
    if (name === "commit_load_plan")
      return {
        label: "Operational",
        tone: "danger" as StatusTone,
        description: "Apply an approved proposal",
      };
    return {
      label: "Candidate state",
      tone: "agent" as StatusTone,
      description: "Create or validate a proposal",
    };
  };
  return (
    <div className="mcp-surface">
      <div className="mcp-status-row">
        <div className="mcp-status-title">
          <span className="mcp-status-icon">
            <Plug className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3>WebMCP status</h3>
            <p>
              {registered
                ? "The LoadGuard site is connected to the agent tool surface."
                : "No WebMCP host detected. Human controls still work."}
            </p>
          </div>
        </div>
        <StatusBadge
          status={registered ? "VALID" : "WARNING"}
          label={registered ? `Connected · ${toolNames.length} tools` : "Unavailable"}
          tone={registered ? "success" : "warning"}
        />
      </div>
      <div className="mcp-tool-list">
        <p className="eyebrow">Available capabilities</p>
        {toolNames.map((name) => {
          const mode = modeFor(name);
          return (
            <div className="mcp-tool-row" key={name}>
              <span className="identifier">{name}</span>
              <span>{mode.description}</span>
              <StatusBadge status="DRAFT" label={mode.label} tone={mode.tone} />
            </div>
          );
        })}
      </div>
      <div className="security-note">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <span>
          Human approval is intentionally not exposed as a WebMCP tool. Database authority enforces
          the approval boundary.
        </span>
      </div>
    </div>
  );
}
