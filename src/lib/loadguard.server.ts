// Server-only LoadGuard data + authority layer. Never imported by client code.
// MODEL INTENT != AUTHORIZATION: agents may plan and stage; only a human can
// approve, and only an approved, unaltered, current proposal can be executed.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALGORITHM_VERSION, createLoadPlan } from "./loadguard/planner";
import { SEED_BOXES, SEED_TRUCK } from "./loadguard/seed";
import type {
  LedgerEvent,
  LoadState,
  Package,
  Placement,
  PlanSummary,
  Truck,
  ValidationResult,
} from "./loadguard/types";
import { validatePlan } from "./loadguard/validator";

export { resolveSessionKey } from "./loadguard/session.server";

const PROPOSAL_TTL_MINUTES = 30;

type Actor = "agent" | "human" | "system";

async function log(
  sessionKey: string,
  event: {
    actor: Actor;
    eventType: string;
    toolName?: string;
    resourceType?: string;
    resourceId?: string;
    result: "success" | "blocked" | "failed";
    summary: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabaseAdmin.from("action_ledger").insert({
    session_key: sessionKey,
    actor: event.actor,
    event_type: event.eventType,
    tool_name: event.toolName ?? null,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    result: event.result,
    summary: event.summary,
    metadata: (event.metadata ?? null) as never,
  });
}

function toTruck(row: Record<string, unknown>): Truck {
  return {
    id: row["id"] as string,
    code: row["code"] as string,
    lengthCm: Number(row["length_cm"]),
    widthCm: Number(row["width_cm"]),
    heightCm: Number(row["height_cm"]),
    maxWeightKg: Number(row["max_weight_kg"]),
    stateRevision: Number(row["state_revision"] ?? 1),
  };
}

function toPackage(row: Record<string, unknown>): Package {
  const x = row["pos_x"];
  return {
    id: row["id"] as string,
    code: row["code"] as string,
    lengthCm: Number(row["length_cm"]),
    widthCm: Number(row["width_cm"]),
    heightCm: Number(row["height_cm"]),
    weightKg: Number(row["weight_kg"]),
    destination: row["destination"] as string,
    deliveryStop: Number(row["delivery_stop"]),
    fragile: Boolean(row["fragile"]),
    priority: (row["priority"] as Package["priority"]) ?? "normal",
    loaded: Boolean(row["loaded"]),
    position:
      x === null || x === undefined
        ? null
        : { x: Number(row["pos_x"]), y: Number(row["pos_y"]), z: Number(row["pos_z"]) },
  };
}

function targetPackages(packages: Package[], includeCodes?: string[]) {
  if (!includeCodes?.length) return packages;
  const include = new Set(includeCodes);
  return packages.filter((p) => p.loaded || include.has(p.code));
}

function packagesForTarget(packages: Package[], targetBoxIds: string[] | null) {
  if (!targetBoxIds?.length) return null;
  const byId = new Map(packages.map((pkg) => [pkg.id, pkg]));
  const target = targetBoxIds.map((id) => byId.get(id));
  return target.every(Boolean) ? (target as Package[]) : null;
}

function coverageMatches(targetBoxIds: string[] | null, placements: Placement[]) {
  if (!targetBoxIds?.length) return false;
  const target = new Set(targetBoxIds);
  if (target.size !== targetBoxIds.length) return false;
  const seen = new Set<string>();
  for (const item of placements) {
    if (!target.has(item.boxId)) return false;
    if (seen.has(item.boxId)) return false;
    seen.add(item.boxId);
  }
  return seen.size === target.size;
}

function equivalentPlacements(a: Placement[], b: Placement[]) {
  const byId = new Map(a.map((item) => [item.boxId, item]));
  if (byId.size !== b.length) return false;
  return b.every((item) => {
    const match = byId.get(item.boxId);
    return (
      match &&
      Math.abs(match.position.x - item.position.x) <= 0.5 &&
      Math.abs(match.position.y - item.position.y) <= 0.5 &&
      Math.abs(match.position.z - item.position.z) <= 0.5
    );
  });
}

export async function resetScenario(sessionKey: string) {
  await supabaseAdmin.from("action_ledger").delete().eq("session_key", sessionKey);
  await supabaseAdmin.from("load_plans").delete().eq("session_key", sessionKey);
  await supabaseAdmin.from("boxes").delete().eq("session_key", sessionKey);
  await supabaseAdmin.from("trucks").delete().eq("session_key", sessionKey);

  const { data: truck, error } = await supabaseAdmin
    .from("trucks")
    .insert({
      session_key: sessionKey,
      code: SEED_TRUCK.code,
      length_cm: SEED_TRUCK.lengthCm,
      width_cm: SEED_TRUCK.widthCm,
      height_cm: SEED_TRUCK.heightCm,
      max_weight_kg: SEED_TRUCK.maxWeightKg,
    })
    .select()
    .single();
  if (error || !truck) throw new Error(error?.message ?? "Failed to seed truck");

  await supabaseAdmin.from("boxes").insert(
    SEED_BOXES.map((b) => ({
      session_key: sessionKey,
      truck_id: truck.id,
      code: b.code,
      length_cm: b.lengthCm,
      width_cm: b.widthCm,
      height_cm: b.heightCm,
      weight_kg: b.weightKg,
      destination: b.destination,
      delivery_stop: b.deliveryStop,
      fragile: b.fragile,
      priority: b.priority,
      loaded: b.loaded,
      pos_x: b.position?.x ?? null,
      pos_y: b.position?.y ?? null,
      pos_z: b.position?.z ?? null,
    })),
  );

  await log(sessionKey, {
    actor: "system",
    eventType: "reset",
    resourceType: "truck",
    resourceId: SEED_TRUCK.code,
    result: "success",
    summary: `Seeded judge scenario for ${SEED_TRUCK.code} with ${SEED_BOXES.length} packages.`,
  });
}

async function loadTruckAndPackages(sessionKey: string) {
  let { data: truckRow } = await supabaseAdmin
    .from("trucks")
    .select("*")
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (!truckRow) {
    await resetScenario(sessionKey);
    const again = await supabaseAdmin
      .from("trucks")
      .select("*")
      .eq("session_key", sessionKey)
      .maybeSingle();
    truckRow = again.data;
  }
  if (!truckRow) throw new Error("Truck unavailable");

  const { data: boxRows } = await supabaseAdmin
    .from("boxes")
    .select("*")
    .eq("session_key", sessionKey)
    .order("code", { ascending: true });

  return {
    truck: toTruck(truckRow as Record<string, unknown>),
    packages: (boxRows ?? []).map((r) => toPackage(r as Record<string, unknown>)),
  };
}

async function planSummary(planId: string, sessionKey?: string): Promise<PlanSummary | null> {
  let planQuery = supabaseAdmin.from("load_plans").select("*").eq("id", planId);
  if (sessionKey) planQuery = planQuery.eq("session_key", sessionKey);

  const { data: plan } = await planQuery.maybeSingle();
  if (!plan) return null;

  const { data: items } = await supabaseAdmin
    .from("load_plan_items")
    .select("*")
    .eq("plan_id", planId)
    .order("sequence", { ascending: true });

  const row = plan as Record<string, unknown>;

  return {
    planId: plan.id,
    planCode: (row["plan_code"] as string | null) ?? null,
    status: plan.status as PlanSummary["status"],
    createdBy: plan.created_by,
    algorithmVersion: plan.algorithm_version,
    planHash: plan.plan_hash,
    approvedHash: plan.approved_hash,
    sourceStateRevision:
      row["source_state_revision"] === null || row["source_state_revision"] === undefined
        ? null
        : Number(row["source_state_revision"]),
    targetBoxIds: Array.isArray(row["target_box_ids"]) ? (row["target_box_ids"] as string[]) : null,
    utilizationPct: plan.utilization_pct === null ? null : Number(plan.utilization_pct),
    totalWeightKg: plan.total_weight_kg === null ? null : Number(plan.total_weight_kg),
    validation: (plan.validation as ValidationResult | null) ?? null,
    placements: (items ?? []).map((i) => ({
      boxId: i.box_id,
      boxCode: i.box_code,
      position: { x: Number(i.pos_x), y: Number(i.pos_y), z: Number(i.pos_z) },
      sequence: i.sequence,
    })),
    stagedAt: plan.staged_at,
    approvedAt: plan.approved_at,
    rejectedAt: plan.rejected_at,
    executingAt: (row["executing_at"] as string | null) ?? null,
    executedAt: plan.executed_at,
    failedAt: (row["failed_at"] as string | null) ?? null,
    expiresAt: plan.expires_at,
    createdAt: plan.created_at,
  } as PlanSummary;
}

async function latestRelevantPlan(sessionKey: string): Promise<PlanSummary | null> {
  const { data } = await supabaseAdmin
    .from("load_plans")
    .select("id")
    .eq("session_key", sessionKey)
    .in("status", [
      "DRAFT",
      "STAGED",
      "APPROVED",
      "REJECTED",
      "EXPIRED",
      "EXECUTING",
      "EXECUTED",
      "FAILED",
    ])
    .order("created_at", { ascending: false })
    .limit(1);
  const id = data?.[0]?.id;
  return id ? planSummary(id, sessionKey) : null;
}

export async function getLoadState(sessionKey: string, actor: Actor = "agent"): Promise<LoadState> {
  const { truck, packages } = await loadTruckAndPackages(sessionKey);
  const loaded = packages.filter((p) => p.loaded && p.position);
  const activeValidation = validatePlan(
    truck,
    loaded,
    loaded.map((p, index) => ({
      boxId: p.id,
      boxCode: p.code,
      position: p.position!,
      sequence: index,
    })),
  );

  if (actor === "agent") {
    await log(sessionKey, {
      actor,
      eventType: "inspect",
      toolName: "get_load_state",
      resourceType: "truck",
      resourceId: truck.code,
      result: "success",
      summary: `Inspected ${truck.code} at revision ${truck.stateRevision}: ${loaded.length} of ${packages.length} packages loaded.`,
    });
  }

  return {
    truck,
    packages,
    loadedCount: loaded.length,
    stateRevision: truck.stateRevision,
    utilizationPct: activeValidation.utilizationPct,
    totalWeightKg: activeValidation.totalWeightKg,
    activeValidation,
    latestPlan: await latestRelevantPlan(sessionKey),
  };
}

export async function getPackageConstraints(sessionKey: string, codes?: string[]) {
  const { truck, packages } = await loadTruckAndPackages(sessionKey);
  const selected = codes?.length ? packages.filter((p) => codes.includes(p.code)) : packages;
  await log(sessionKey, {
    actor: "agent",
    eventType: "inspect",
    toolName: "get_package_constraints",
    resourceType: "truck",
    resourceId: truck.code,
    result: "success",
    summary: `Returned constraints for ${selected.length} package(s).`,
  });
  return {
    truck,
    stateRevision: truck.stateRevision,
    packages: selected.map((p) => ({
      code: p.code,
      lengthCm: p.lengthCm,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      destination: p.destination,
      deliveryStop: p.deliveryStop,
      fragile: p.fragile,
      priority: p.priority,
      loaded: p.loaded,
    })),
    rules: [
      "Packages must stay inside the trailer envelope.",
      "Package volumes must not overlap.",
      `Total weight must not exceed ${truck.maxWeightKg} kg.`,
      "A fragile package must not support a heavier package.",
      "An earlier delivery stop must not be blocked from the rear door (x = 0).",
      "Execution requires explicit human approval of an exact, unaltered proposal.",
    ],
  };
}

export async function createCandidatePlan(sessionKey: string, includeCodes?: string[]) {
  const { truck, packages } = await loadTruckAndPackages(sessionKey);
  const subject = targetPackages(packages, includeCodes);

  const result = createLoadPlan(truck, subject);
  const targetBoxIds = subject.map((pkg) => pkg.id).sort();

  const { count } = await supabaseAdmin
    .from("load_plans")
    .select("id", { count: "exact", head: true })
    .eq("session_key", sessionKey);
  const planCode = `PLAN-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: plan, error } = await supabaseAdmin
    .from("load_plans")
    .insert({
      session_key: sessionKey,
      truck_id: truck.id,
      status: "DRAFT",
      created_by: "agent",
      algorithm_version: ALGORITHM_VERSION,
      utilization_pct: result.validation.utilizationPct,
      total_weight_kg: result.validation.totalWeightKg,
      validation: result.validation as never,
      plan_code: planCode,
      source_state_revision: truck.stateRevision,
      target_box_ids: targetBoxIds,
    } as never)
    .select()
    .single();
  if (error || !plan) throw new Error(error?.message ?? "Failed to create plan");

  if (result.placements.length) {
    await supabaseAdmin.from("load_plan_items").insert(
      result.placements.map((p) => ({
        plan_id: plan.id,
        box_id: p.boxId,
        box_code: p.boxCode,
        pos_x: p.position.x,
        pos_y: p.position.y,
        pos_z: p.position.z,
        sequence: p.sequence,
      })),
    );
  }

  await log(sessionKey, {
    actor: "agent",
    eventType: "plan",
    toolName: "create_load_plan",
    resourceType: "load_plan",
    resourceId: plan.id,
    result: result.validation.valid ? "success" : "blocked",
    summary: `${planCode} (${ALGORITHM_VERSION}) drafted from revision ${truck.stateRevision}: ${result.placements.length}/${targetBoxIds.length} target placements, ${result.validation.violations.length} violation(s), ${result.validation.utilizationPct}% utilization.`,
  });

  return {
    plan: await planSummary(plan.id, sessionKey),
    stateRevision: truck.stateRevision,
    unplaced: result.unplaced,
    moves: result.moves,
    validation: result.validation,
  };
}

/** validate_load: with a planId validates that proposal, otherwise the active load. */
export async function validateLoad(sessionKey: string, planId?: string) {
  const { truck, packages } = await loadTruckAndPackages(sessionKey);

  if (!planId) {
    const loaded = packages.filter((p) => p.loaded && p.position);
    const validation = validatePlan(
      truck,
      loaded,
      loaded.map((p, index) => ({
        boxId: p.id,
        boxCode: p.code,
        position: p.position!,
        sequence: index,
      })),
    );
    await log(sessionKey, {
      actor: "agent",
      eventType: "validate",
      toolName: "validate_load",
      resourceType: "truck",
      resourceId: truck.code,
      result: validation.valid ? "success" : "blocked",
      summary: `Active load at revision ${truck.stateRevision}: ${
        validation.valid ? "no hard violations" : `${validation.violations.length} violation(s)`
      }.`,
    });
    return {
      ok: true as const,
      target: "active" as const,
      stateRevision: truck.stateRevision,
      validation,
    };
  }

  const summary = await planSummary(planId, sessionKey);
  if (!summary) return { ok: false as const, code: "NOT_FOUND" as const };

  const target = packagesForTarget(packages, summary.targetBoxIds);
  const validation = target
    ? validatePlan(truck, target, summary.placements)
    : ({
        valid: false,
        violations: [
          {
            code: "UNPLACED_PACKAGE",
            severity: "hard",
            boxCodes: [],
            message: "Plan target package set is missing or no longer belongs to this session.",
          },
        ],
        warnings: [],
        score: 0,
        utilizationPct: 0,
        totalWeightKg: 0,
      } satisfies ValidationResult);

  await supabaseAdmin
    .from("load_plans")
    .update({
      validation: validation as never,
      utilization_pct: validation.utilizationPct,
      total_weight_kg: validation.totalWeightKg,
    })
    .eq("id", planId)
    .eq("session_key", sessionKey);

  await log(sessionKey, {
    actor: "agent",
    eventType: "validate",
    toolName: "validate_load",
    resourceType: "load_plan",
    resourceId: planId,
    result: validation.valid ? "success" : "blocked",
    summary: validation.valid
      ? `${summary.planCode ?? planId.slice(0, 8)} passes all hard rules.`
      : `${summary.planCode ?? planId.slice(0, 8)} has ${validation.violations.length} violation(s).`,
  });

  return {
    ok: true as const,
    target: "plan" as const,
    stateRevision: truck.stateRevision,
    validation,
  };
}

export async function stagePlan(sessionKey: string, planId: string) {
  const summary = await planSummary(planId, sessionKey);
  if (!summary) return { ok: false as const, code: "NOT_FOUND" };
  if (summary.status !== "DRAFT") {
    return { ok: false as const, code: "INVALID_STATE", status: summary.status };
  }

  const { truck } = await loadTruckAndPackages(sessionKey);
  if (summary.sourceStateRevision !== null && summary.sourceStateRevision !== truck.stateRevision) {
    await log(sessionKey, {
      actor: "agent",
      eventType: "stage",
      toolName: "stage_load_plan",
      resourceType: "load_plan",
      resourceId: planId,
      result: "blocked",
      summary: `Staging blocked: draft was built from revision ${summary.sourceStateRevision}, active load is at ${truck.stateRevision}.`,
    });
    return { ok: false as const, code: "STALE_PLAN" };
  }
  if (!coverageMatches(summary.targetBoxIds, summary.placements)) {
    await log(sessionKey, {
      actor: "agent",
      eventType: "stage",
      toolName: "stage_load_plan",
      resourceType: "load_plan",
      resourceId: planId,
      result: "blocked",
      summary:
        "Staging blocked: proposal does not contain exactly one placement for every target package.",
    });
    return { ok: false as const, code: "PLAN_COVERAGE_MISMATCH" };
  }

  const check = await validateLoad(sessionKey, planId);
  if (!check.ok) return check;
  if (!check.validation.valid) {
    await log(sessionKey, {
      actor: "agent",
      eventType: "stage",
      toolName: "stage_load_plan",
      resourceType: "load_plan",
      resourceId: planId,
      result: "blocked",
      summary: "Staging blocked: plan has hard violations.",
    });
    return { ok: false as const, code: "VALIDATION_FAILED", validation: check.validation };
  }

  const { data: hash, error: hashError } = await supabaseAdmin.rpc("canonical_plan_hash", {
    p_plan_id: planId,
  });
  if (hashError || typeof hash !== "string") {
    await log(sessionKey, {
      actor: "agent",
      eventType: "stage",
      toolName: "stage_load_plan",
      resourceType: "load_plan",
      resourceId: planId,
      result: "failed",
      summary: "Staging failed: canonical plan hash could not be calculated.",
    });
    return { ok: false as const, code: "RPC_FAILED" };
  }
  const expiresAt = new Date(Date.now() + PROPOSAL_TTL_MINUTES * 60_000).toISOString();

  await supabaseAdmin
    .from("load_plans")
    .update({
      status: "STAGED",
      staged_at: new Date().toISOString(),
      plan_hash: hash,
      expires_at: expiresAt,
    })
    .eq("id", planId)
    .eq("session_key", sessionKey);

  await log(sessionKey, {
    actor: "agent",
    eventType: "stage",
    toolName: "stage_load_plan",
    resourceType: "load_plan",
    resourceId: planId,
    result: "success",
    summary: `Proposal ${summary.planCode ?? planId.slice(0, 8)} staged and awaiting human approval.`,
  });

  return { ok: true as const, plan: await planSummary(planId, sessionKey) };
}

export async function approvePlan(sessionKey: string, planId: string) {
  const before = await planSummary(planId, sessionKey);
  const { data } = await supabaseAdmin.rpc("approve_load_plan", {
    p_session_key: sessionKey,
    p_plan_id: planId,
  });
  const result = (data ?? { ok: false, code: "RPC_FAILED" }) as {
    ok: boolean;
    code?: string;
  };

  await log(sessionKey, {
    actor: "human",
    eventType: "approve",
    resourceType: "load_plan",
    resourceId: planId,
    result: result.ok ? "success" : "blocked",
    summary: result.ok
      ? `Operator approved proposal ${before?.planCode ?? planId.slice(0, 8)} exactly as staged.`
      : `Approval refused (${result.code}).`,
  });

  return { ...result, plan: await planSummary(planId, sessionKey) };
}

export async function rejectPlan(sessionKey: string, planId: string) {
  const before = await planSummary(planId, sessionKey);
  const { data } = await supabaseAdmin.rpc("reject_load_plan", {
    p_session_key: sessionKey,
    p_plan_id: planId,
  });
  const result = (data ?? { ok: false, code: "RPC_FAILED" }) as {
    ok: boolean;
    code?: string;
  };

  await log(sessionKey, {
    actor: "human",
    eventType: "reject",
    resourceType: "load_plan",
    resourceId: planId,
    result: result.ok ? "success" : "blocked",
    summary: result.ok
      ? `Operator rejected proposal ${before?.planCode ?? planId.slice(0, 8)}.`
      : `Rejection refused (${result.code}).`,
  });

  return { ...result, plan: await planSummary(planId, sessionKey) };
}

export async function commitPlan(sessionKey: string, planId: string) {
  const before = await planSummary(planId, sessionKey);
  if (before) {
    const { truck, packages } = await loadTruckAndPackages(sessionKey);
    const target = packagesForTarget(packages, before.targetBoxIds);
    const validation = target
      ? validatePlan(truck, target, before.placements)
      : ({
          valid: false,
          violations: [
            {
              code: "UNPLACED_PACKAGE",
              severity: "hard",
              boxCodes: [],
              message: "Plan target package set is missing or no longer belongs to this session.",
            },
          ],
          warnings: [],
          score: 0,
          utilizationPct: 0,
          totalWeightKg: 0,
        } satisfies ValidationResult);

    if (!coverageMatches(before.targetBoxIds, before.placements)) {
      await log(sessionKey, {
        actor: "agent",
        eventType: "commit",
        toolName: "commit_load_plan",
        resourceType: "load_plan",
        resourceId: planId,
        result: "blocked",
        summary:
          "Commit preflight blocked: approved proposal does not cover every target package exactly once.",
      });
      return {
        ok: false as const,
        code: "PLAN_COVERAGE_MISMATCH",
        validation,
        plan: before,
      };
    }

    if (!validation.valid) {
      await log(sessionKey, {
        actor: "agent",
        eventType: "commit",
        toolName: "commit_load_plan",
        resourceType: "load_plan",
        resourceId: planId,
        result: "blocked",
        summary: "Commit preflight blocked: approved proposal no longer validates cleanly.",
      });
      return { ok: false as const, code: "VALIDATION_FAILED", validation, plan: before };
    }
  }

  const { data } = await supabaseAdmin.rpc("commit_load_plan", {
    p_session_key: sessionKey,
    p_plan_id: planId,
  });
  const result = (data ?? { ok: false, code: "RPC_FAILED" }) as {
    ok: boolean;
    code?: string;
    items_applied?: number;
    state_revision?: number;
  };

  const label = before?.planCode ?? planId.slice(0, 8);
  await log(sessionKey, {
    actor: "agent",
    eventType: "commit",
    toolName: "commit_load_plan",
    resourceType: "load_plan",
    resourceId: planId,
    result: result.ok ? "success" : "blocked",
    summary: result.ok
      ? `Committed human-approved proposal ${label} (${result.items_applied} placements, load now at revision ${result.state_revision}).`
      : `Commit refused by database authority check (${result.code}).`,
  });

  const plan = await planSummary(planId, sessionKey);
  if (result.ok && before?.targetBoxIds) {
    const active = await getLoadState(sessionKey, "system");
    const targetActive = active.packages.filter((pkg) => before.targetBoxIds?.includes(pkg.id));
    const activePlacements = targetActive
      .filter((pkg) => pkg.loaded && pkg.position)
      .map((pkg, sequence) => ({
        boxId: pkg.id,
        boxCode: pkg.code,
        position: pkg.position!,
        sequence,
      }));
    if (
      !active.activeValidation.valid ||
      !equivalentPlacements(before.placements, activePlacements)
    ) {
      await log(sessionKey, {
        actor: "system",
        eventType: "commit_verification",
        toolName: "commit_load_plan",
        resourceType: "load_plan",
        resourceId: planId,
        result: "failed",
        summary:
          "Post-commit verification failed: active load does not exactly match the approved target plan.",
      });
      return {
        ...result,
        ok: false as const,
        code: "EXECUTION_VERIFICATION_FAILED",
        activeValidation: active.activeValidation,
        plan,
      };
    }
  }

  return { ...result, plan };
}

export async function getLedger(sessionKey: string, limit = 40): Promise<LedgerEvent[]> {
  const { data } = await supabaseAdmin
    .from("action_ledger")
    .select("*")
    .eq("session_key", sessionKey)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    actor: row.actor as LedgerEvent["actor"],
    eventType: row.event_type,
    toolName: row.tool_name,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    result: row.result as LedgerEvent["result"],
    summary: row.summary,
  }));
}

export async function getPlan(planId: string) {
  return planSummary(planId);
}
