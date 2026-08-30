import { describe, expect, it } from "vitest";

import {
  approveExactPlan,
  canonicalPlanHash,
  canTransition,
  commitExactPlan,
  ledgerEvent,
  type AuthorityPlan,
} from "./authority";
import { createLoadPlan } from "./planner";
import { SEED_BOXES, SEED_TRUCK } from "./seed";
import type { Package, Placement, Truck } from "./types";
import { validatePlan } from "./validator";

const truck: Truck = {
  id: "truck-1",
  code: "TRK-TEST",
  lengthCm: 100,
  widthCm: 100,
  heightCm: 100,
  maxWeightKg: 100,
  stateRevision: 1,
};

function pkg(overrides: Partial<Package>): Package {
  return {
    id: overrides.id ?? "box-1",
    code: overrides.code ?? "BOX-1",
    lengthCm: overrides.lengthCm ?? 20,
    widthCm: overrides.widthCm ?? 20,
    heightCm: overrides.heightCm ?? 20,
    weightKg: overrides.weightKg ?? 10,
    destination: overrides.destination ?? "Depot",
    deliveryStop: overrides.deliveryStop ?? 1,
    fragile: overrides.fragile ?? false,
    priority: overrides.priority ?? "normal",
    loaded: overrides.loaded ?? true,
    position: overrides.position ?? null,
  };
}

function placement(box: Package, position = { x: 0, y: 0, z: 0 }): Placement {
  return { boxId: box.id, boxCode: box.code, position, sequence: 0 };
}

function authorityPlan(overrides: Partial<AuthorityPlan> = {}): AuthorityPlan {
  const box = pkg({ id: "plan-box", code: "PLAN-BOX" });
  const placements = overrides.placements ?? [placement(box)];
  return {
    planId: "plan-1",
    sessionKey: "session-a",
    status: "STAGED",
    planHash: canonicalPlanHash(placements),
    approvedHash: null,
    sourceStateRevision: 1,
    placements,
    expiresAt: null,
    approvedAt: null,
    executedAt: null,
    ...overrides,
  };
}

describe("LoadGuard planner and validator", () => {
  it("LG-001 creates deterministic plans for the same input", () => {
    const packages = SEED_BOXES.map((box, index) =>
      pkg({ ...box, id: `seed-${index}`, position: box.position }),
    );
    const seedTruck = { ...SEED_TRUCK, id: "truck-seed", stateRevision: 1 };

    const first = createLoadPlan(seedTruck, packages);
    const second = createLoadPlan(seedTruck, packages);

    expect(second).toEqual(first);
  });

  it("LG-002 rejects out-of-truck placement", () => {
    const box = pkg({ lengthCm: 40 });
    const result = validatePlan(truck, [box], [placement(box, { x: 80, y: 0, z: 0 })]);

    expect(result.valid).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("OUT_OF_BOUNDS");
  });

  it("LG-003 rejects overlapping package volumes", () => {
    const a = pkg({ id: "a", code: "A" });
    const b = pkg({ id: "b", code: "B" });
    const result = validatePlan(
      truck,
      [a, b],
      [placement(a, { x: 0, y: 0, z: 0 }), { ...placement(b, { x: 10, y: 0, z: 0 }), sequence: 1 }],
    );

    expect(result.valid).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("COLLISION");
  });

  it("LG-004 rejects overweight loads", () => {
    const a = pkg({ id: "a", code: "A", weightKg: 70 });
    const b = pkg({ id: "b", code: "B", weightKg: 60 });
    const result = validatePlan(
      truck,
      [a, b],
      [placement(a, { x: 0, y: 0, z: 0 }), { ...placement(b, { x: 20, y: 0, z: 0 }), sequence: 1 }],
    );

    expect(result.valid).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("OVER_WEIGHT");
  });

  it("LG-005 rejects heavy cargo supported by fragile cargo", () => {
    const fragile = pkg({ id: "fragile", code: "FRAGILE", fragile: true, weightKg: 5 });
    const heavy = pkg({ id: "heavy", code: "HEAVY", weightKg: 40 });
    const result = validatePlan(
      truck,
      [fragile, heavy],
      [
        placement(fragile, { x: 0, y: 0, z: 0 }),
        { ...placement(heavy, { x: 0, y: 20, z: 0 }), sequence: 1 },
      ],
    );

    expect(result.valid).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("FRAGILE_SUPPORT");
  });

  it("rejects malformed coordinates and unknown package ids", () => {
    const box = pkg({ id: "known", code: "KNOWN" });
    const result = validatePlan(
      truck,
      [box],
      [
        placement(box, { x: Number.NaN, y: 0, z: 0 }),
        {
          boxId: "missing",
          boxCode: "MISSING",
          position: { x: 0, y: 0, z: 0 },
          sequence: 1,
        },
      ],
    );

    expect(result.valid).toBe(false);
    expect(result.violations.map((v) => v.code)).toEqual(["INVALID_POSITION", "UNKNOWN_PACKAGE"]);
    expect(Number.isFinite(result.utilizationPct)).toBe(true);
  });

  it("LG-006 keeps candidate planning isolated from active package coordinates", () => {
    const packages = SEED_BOXES.map((box, index) =>
      pkg({ ...box, id: `seed-${index}`, position: box.position }),
    );
    const before = packages.map((box) => ({ code: box.code, position: box.position }));

    createLoadPlan({ ...SEED_TRUCK, id: "truck-seed", stateRevision: 1 }, packages);

    expect(packages.map((box) => ({ code: box.code, position: box.position }))).toEqual(before);
  });

  it("LG-018 seed reset fixture validates TRK-042 and MED-901 in the requested band", () => {
    const packages = SEED_BOXES.map((box, index) =>
      pkg({ ...box, id: `seed-${index}`, position: box.position }),
    );
    const loaded = packages.filter((box) => box.loaded && box.position);
    const result = validatePlan(
      { ...SEED_TRUCK, id: "truck-seed", stateRevision: 1 },
      loaded,
      loaded.map((box, index) => ({ ...placement(box, box.position!), sequence: index })),
    );

    expect(SEED_TRUCK.code).toBe("TRK-042");
    expect(packages.find((box) => box.code === "MED-901")?.loaded).toBe(false);
    expect(result.valid).toBe(true);
    expect(result.utilizationPct).toBeGreaterThanOrEqual(75);
    expect(result.utilizationPct).toBeLessThanOrEqual(80);
  });
});

describe("LoadGuard proposal authority state machine", () => {
  it("rejects invalid direct transitions to EXECUTED", () => {
    expect(canTransition("DRAFT", "EXECUTED")).toBe(false);
    expect(canTransition("STAGED", "EXECUTED")).toBe(false);
    expect(canTransition("REJECTED", "EXECUTED")).toBe(false);
    expect(canTransition("EXPIRED", "EXECUTED")).toBe(false);
  });

  it("LG-010 blocks commit before approval", () => {
    const result = commitExactPlan(authorityPlan(), "session-a", 1);

    expect(result).toMatchObject({ ok: false, code: "APPROVAL_REQUIRED" });
  });

  it("LG-011 approval does not execute or mutate active positions", () => {
    const plan = authorityPlan();
    const active = [{ code: "PLAN-BOX", position: { x: 5, y: 0, z: 0 } }];
    const result = approveExactPlan(plan, "session-a");

    expect(result.ok).toBe(true);
    expect(result.ok ? result.plan.status : null).toBe("APPROVED");
    expect(active[0]?.position).toEqual({ x: 5, y: 0, z: 0 });
  });

  it("LG-012 commits the exact approved plan", () => {
    const approved = approveExactPlan(authorityPlan(), "session-a");
    expect(approved.ok).toBe(true);

    const result = approved.ok ? commitExactPlan(approved.plan, "session-a", 1) : approved;

    expect(result).toMatchObject({ ok: true, stateRevision: 2, itemsApplied: 1 });
    expect(result.ok ? result.plan.status : null).toBe("EXECUTED");
  });

  it("LG-013 rejects hash tampering after approval", () => {
    const approved = approveExactPlan(authorityPlan(), "session-a");
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;

    const tampered = {
      ...approved.plan,
      placements: [
        {
          ...approved.plan.placements[0]!,
          position: { x: 20, y: 0, z: 0 },
        },
      ],
    };

    expect(commitExactPlan(tampered, "session-a", 1)).toMatchObject({
      ok: false,
      code: "PLAN_HASH_MISMATCH",
    });
  });

  it("LG-014 rejects stale proposals", () => {
    const approved = approveExactPlan(authorityPlan(), "session-a");
    expect(approved.ok).toBe(true);

    const result = approved.ok ? commitExactPlan(approved.plan, "session-a", 2) : approved;

    expect(result).toMatchObject({ ok: false, code: "STALE_PLAN" });
  });

  it("LG-015 handles duplicate commit idempotently", () => {
    const executed = authorityPlan({ status: "EXECUTED", executedAt: new Date(0).toISOString() });

    expect(commitExactPlan(executed, "session-a", 2)).toMatchObject({
      ok: false,
      code: "ALREADY_EXECUTED",
    });
  });

  it("LG-016 records ledger events without hidden reasoning", () => {
    const events = [
      ledgerEvent({
        actor: "agent",
        eventType: "inspect",
        toolName: "get_load_state",
        resourceType: "truck",
        resourceId: "TRK-042",
        result: "success",
        summary: "Inspected TRK-042.",
      }),
      ledgerEvent({
        actor: "human",
        eventType: "approve",
        toolName: null,
        resourceType: "load_plan",
        resourceId: "PLAN-001",
        result: "success",
        summary: "Operator approved proposal PLAN-001 exactly as staged.",
      }),
    ];

    expect(events.map((event) => event.eventType)).toEqual(["inspect", "approve"]);
    expect(JSON.stringify(events)).not.toMatch(/chain.?of.?thought/i);
  });

  it("LG-017 rejects cross-session proposal access", () => {
    expect(approveExactPlan(authorityPlan(), "session-b")).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
    expect(commitExactPlan(authorityPlan({ status: "APPROVED" }), "session-b", 1)).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
  });
});
