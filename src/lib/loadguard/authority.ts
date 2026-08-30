import type { LedgerEvent, Placement, PlanStatus } from "./types";

export type AuthorityPlan = {
  planId: string;
  sessionKey: string;
  status: PlanStatus;
  planHash: string;
  approvedHash: string | null;
  sourceStateRevision: number;
  placements: Placement[];
  expiresAt: string | null;
  approvedAt: string | null;
  executedAt: string | null;
};

export type AuthorityResult =
  | { ok: true; plan: AuthorityPlan; stateRevision?: number; itemsApplied?: number }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "APPROVAL_REQUIRED"
        | "INVALID_STATE_TRANSITION"
        | "PLAN_HASH_MISMATCH"
        | "STALE_PLAN"
        | "EXPIRED"
        | "ALREADY_EXECUTED";
      status?: PlanStatus;
    };

export const ALLOWED_TRANSITIONS: Record<PlanStatus, PlanStatus[]> = {
  DRAFT: ["STAGED", "SUPERSEDED"],
  STAGED: ["APPROVED", "REJECTED", "EXPIRED", "SUPERSEDED"],
  APPROVED: ["EXECUTING", "EXPIRED", "SUPERSEDED"],
  EXECUTING: ["EXECUTED", "FAILED"],
  EXECUTED: [],
  REJECTED: [],
  EXPIRED: [],
  FAILED: [],
  SUPERSEDED: [],
};

function normalizedNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}

function stablePlanPayload(placements: Placement[]) {
  return [...placements]
    .sort((a, b) => a.sequence - b.sequence || a.boxCode.localeCompare(b.boxCode))
    .map((item) => ({
      boxId: item.boxId,
      boxCode: item.boxCode,
      sequence: item.sequence,
      x: normalizedNumber(item.position.x),
      y: normalizedNumber(item.position.y),
      z: normalizedNumber(item.position.z),
    }));
}

export function canonicalPlanHash(placements: Placement[]) {
  const payload = JSON.stringify(stablePlanPayload(placements));
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function canTransition(from: PlanStatus, to: PlanStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function approveExactPlan(
  plan: AuthorityPlan | null,
  sessionKey: string,
  observedHash = plan ? canonicalPlanHash(plan.placements) : null,
): AuthorityResult {
  if (!plan || plan.sessionKey !== sessionKey) return { ok: false, code: "NOT_FOUND" };
  if (plan.status !== "STAGED") {
    return { ok: false, code: "INVALID_STATE_TRANSITION", status: plan.status };
  }
  if (plan.expiresAt && new Date(plan.expiresAt).getTime() < Date.now()) {
    return { ok: false, code: "EXPIRED", status: plan.status };
  }
  if (plan.planHash !== observedHash) return { ok: false, code: "PLAN_HASH_MISMATCH" };

  return {
    ok: true,
    plan: {
      ...plan,
      status: "APPROVED",
      approvedHash: observedHash,
      approvedAt: new Date(0).toISOString(),
    },
  };
}

export function commitExactPlan(
  plan: AuthorityPlan | null,
  sessionKey: string,
  activeStateRevision: number,
  observedHash = plan ? canonicalPlanHash(plan.placements) : null,
): AuthorityResult {
  if (!plan || plan.sessionKey !== sessionKey) return { ok: false, code: "NOT_FOUND" };
  if (plan.status === "EXECUTED") {
    return { ok: false, code: "ALREADY_EXECUTED", status: "EXECUTED" };
  }
  if (plan.status !== "APPROVED") {
    return { ok: false, code: "APPROVAL_REQUIRED", status: plan.status };
  }
  if (plan.expiresAt && new Date(plan.expiresAt).getTime() < Date.now()) {
    return { ok: false, code: "EXPIRED", status: plan.status };
  }
  if (plan.approvedHash !== observedHash) return { ok: false, code: "PLAN_HASH_MISMATCH" };
  if (plan.sourceStateRevision !== activeStateRevision) return { ok: false, code: "STALE_PLAN" };

  return {
    ok: true,
    plan: {
      ...plan,
      status: "EXECUTED",
      executedAt: new Date(0).toISOString(),
    },
    stateRevision: activeStateRevision + 1,
    itemsApplied: plan.placements.length,
  };
}

export function ledgerEvent(
  event: Omit<LedgerEvent, "id" | "occurredAt"> & { id?: string; occurredAt?: string },
): LedgerEvent {
  return {
    id: event.id ?? "ledger-test-event",
    occurredAt: event.occurredAt ?? new Date(0).toISOString(),
    actor: event.actor,
    eventType: event.eventType,
    toolName: event.toolName,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    result: event.result,
    summary: event.summary,
  };
}
