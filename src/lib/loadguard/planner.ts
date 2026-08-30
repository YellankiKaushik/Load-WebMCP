// CMP-PLAN-001 — deterministic load planner (planner-v1). Pure functions only.
import type { Package, Placement, Truck, ValidationResult } from "./types";
import { validatePlan, volumeCm3 } from "./validator";

export const ALGORITHM_VERSION = "planner-v1";

export type PlanResult = {
  algorithmVersion: string;
  placements: Placement[];
  unplaced: { code: string; reason: string }[];
  moves: { code: string; from: Package["position"]; to: Placement["position"] }[];
  validation: ValidationResult;
};

function sortPackages(packages: Package[]): Package[] {
  const priorityRank: Record<Package["priority"], number> = {
    urgent: 0,
    high: 1,
    normal: 2,
  };

  return [...packages].sort((a, b) => {
    if (a.deliveryStop !== b.deliveryStop) return a.deliveryStop - b.deliveryStop;
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    if (a.fragile !== b.fragile) return a.fragile ? 1 : -1;
    if (a.weightKg !== b.weightKg) return b.weightKg - a.weightKg;
    const va = volumeCm3(a);
    const vb = volumeCm3(b);
    if (va !== vb) return vb - va;
    return a.code.localeCompare(b.code);
  });
}

function positionsDiffer(a: Package["position"], b: Placement["position"]) {
  if (!a) return true;
  return Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5 || Math.abs(a.z - b.z) > 0.5;
}

function placementFor(pkg: Package, position: Placement["position"], sequence: number): Placement {
  return {
    boxId: pkg.id,
    boxCode: pkg.code,
    position: {
      x: Math.round(position.x * 10) / 10,
      y: Math.round(position.y * 10) / 10,
      z: Math.round(position.z * 10) / 10,
    },
    sequence,
  };
}

function candidatePositions(
  truck: Truck,
  packagesById: Map<string, Package>,
  placements: Placement[],
) {
  const xs = new Set<number>([0]);
  const ys = new Set<number>([0]);
  const zs = new Set<number>([0]);

  for (const item of placements) {
    const pkg = packagesById.get(item.boxId);
    if (!pkg) continue;
    xs.add(item.position.x);
    xs.add(item.position.x + pkg.lengthCm);
    ys.add(item.position.y + pkg.heightCm);
    zs.add(item.position.z);
    zs.add(item.position.z + pkg.widthCm);
  }

  xs.add(truck.lengthCm);
  ys.add(truck.heightCm);
  zs.add(truck.widthCm);

  const candidates: Placement["position"][] = [];
  for (const x of xs) {
    for (const y of ys) {
      for (const z of zs) {
        if (x < 0 || y < 0 || z < 0) continue;
        if (x > truck.lengthCm || y > truck.heightCm || z > truck.widthCm) continue;
        candidates.push({
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          z: Math.round(z * 10) / 10,
        });
      }
    }
  }

  return candidates.sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
}

/**
 * Complete-snapshot planner. Existing loaded packages are retained exactly
 * when they already have coordinates; required inbound packages are inserted
 * deterministically into the remaining 3D envelope. Placements are the intended
 * post-commit load, while moves are only reporting metadata.
 */
export function createLoadPlan(truck: Truck, packages: Package[]): PlanResult {
  const ordered = sortPackages(packages);
  const packagesById = new Map(packages.map((pkg) => [pkg.id, pkg]));
  const placements: Placement[] = ordered
    .filter((pkg) => pkg.loaded && pkg.position)
    .map((pkg, sequence) => placementFor(pkg, pkg.position!, sequence));
  const unplaced: PlanResult["unplaced"] = [];
  let plannedWeightKg = placements.reduce(
    (sum, item) => sum + (packagesById.get(item.boxId)?.weightKg ?? 0),
    0,
  );

  for (const pkg of ordered) {
    if (placements.some((item) => item.boxId === pkg.id)) continue;

    if (plannedWeightKg + pkg.weightKg > truck.maxWeightKg + 1e-6) {
      unplaced.push({ code: pkg.code, reason: "OVER_WEIGHT" });
      continue;
    }

    if (
      pkg.lengthCm > truck.lengthCm ||
      pkg.widthCm > truck.widthCm ||
      pkg.heightCm > truck.heightCm
    ) {
      unplaced.push({ code: pkg.code, reason: "OVERSIZED" });
      continue;
    }

    let placedHere = false;
    for (const position of candidatePositions(truck, packagesById, placements)) {
      const candidate = placementFor(pkg, position, placements.length);
      const trialPlacements = [...placements, candidate];
      const trialPackages = ordered.filter((item) =>
        trialPlacements.some((placement) => placement.boxId === item.id),
      );
      if (validatePlan(truck, trialPackages, trialPlacements).valid) {
        placements.push(candidate);
        plannedWeightKg += pkg.weightKg;
        placedHere = true;
        break;
      }
    }

    if (!placedHere) unplaced.push({ code: pkg.code, reason: "NO_SPACE" });
  }

  const normalizedPlacements = placements.map((item, sequence) => ({ ...item, sequence }));
  const unplacedReasons = Object.fromEntries(unplaced.map((item) => [item.code, item.reason]));
  const validation = validatePlan(truck, packages, normalizedPlacements, unplacedReasons);
  const moves = normalizedPlacements
    .filter((item) =>
      positionsDiffer(packagesById.get(item.boxId)?.position ?? null, item.position),
    )
    .map((item) => ({
      code: item.boxCode,
      from: packagesById.get(item.boxId)?.position ?? null,
      to: item.position,
    }));

  return {
    algorithmVersion: ALGORITHM_VERSION,
    placements: normalizedPlacements,
    unplaced,
    moves,
    validation,
  };
}
