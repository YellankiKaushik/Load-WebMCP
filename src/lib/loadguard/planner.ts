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
    return [...packages].sort((a, b) => {
        if (a.deliveryStop !== b.deliveryStop) return a.deliveryStop - b.deliveryStop;
        if (a.fragile !== b.fragile) return a.fragile ? 1 : -1;
        if (a.weightKg !== b.weightKg) return b.weightKg - a.weightKg;
        const va = volumeCm3(a);
        const vb = volumeCm3(b);
        if (va !== vb) return vb - va;
        return a.code.localeCompare(b.code);
    });
}

/**
 * Deterministic row/lane/stack packing. x = 0 is the rear door, so earlier
 * delivery stops are placed nearest the door. No rotation in v1.
 */
export function createLoadPlan(truck: Truck, packages: Package[]): PlanResult {
    const ordered = sortPackages(packages);
    const placements: Placement[] = [];
    const unplaced: PlanResult["unplaced"] = [];

    let rowX = 0;
    let rowDepth = 0;
    let laneZ = 0;
    let laneWidth = 0;
    let stackY = 0;

    for (const pkg of ordered) {
        if (
            pkg.lengthCm > truck.lengthCm ||
            pkg.widthCm > truck.widthCm ||
            pkg.heightCm > truck.heightCm
        ) {
            unplaced.push({ code: pkg.code, reason: "OVERSIZED" });
            continue;
        }

        let placedHere = false;
        for (let attempt = 0; attempt < 3 && !placedHere; attempt++) {
            const fits =
                stackY + pkg.heightCm <= truck.heightCm + 1e-6 &&
                laneZ + pkg.widthCm <= truck.widthCm + 1e-6 &&
                rowX + pkg.lengthCm <= truck.lengthCm + 1e-6;

            if (fits) {
                placements.push({
                    boxId: pkg.id,
                    boxCode: pkg.code,
                    position: {
                        x: Math.round(rowX * 10) / 10,
                        y: Math.round(stackY * 10) / 10,
                        z: Math.round(laneZ * 10) / 10,
                    },
                    sequence: placements.length,
                });
                stackY += pkg.heightCm;
                laneWidth = Math.max(laneWidth, pkg.widthCm);
                rowDepth = Math.max(rowDepth, pkg.lengthCm);
                placedHere = true;
                break;
            }

            // Advance to the next lane across the trailer width, then the next row.
            if (laneZ + laneWidth + pkg.widthCm <= truck.widthCm + 1e-6) {
                laneZ += laneWidth;
                laneWidth = 0;
                stackY = 0;
            } else {
                rowX += rowDepth;
                rowDepth = 0;
                laneZ = 0;
                laneWidth = 0;
                stackY = 0;
            }
        }

        if (!placedHere) unplaced.push({ code: pkg.code, reason: "NO_SPACE" });
    }

    const placedIds = new Set(placements.map((p) => p.boxId));
    const validation = validatePlan(
        truck,
        packages.filter((p) => placedIds.has(p.id)),
        placements,
    );

    const byId = new Map(packages.map((p) => [p.id, p]));
    const moves = placements
        .filter((item) => {
            const current = byId.get(item.boxId)?.position;
            if (!current) return true;
            return (
                Math.abs(current.x - item.position.x) > 0.5 ||
                Math.abs(current.y - item.position.y) > 0.5 ||
                Math.abs(current.z - item.position.z) > 0.5
            );
        })
        .map((item) => ({
            code: item.boxCode,
            from: byId.get(item.boxId)?.position ?? null,
            to: item.position,
        }));

    return { algorithmVersion: ALGORITHM_VERSION, placements, unplaced, moves, validation };
}
