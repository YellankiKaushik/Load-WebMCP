// CMP-VAL-001 — deterministic load validator. Pure functions only.
import type { Package, Placement, Truck, ValidationResult, Violation } from "./types";

type Placed = {
    pkg: Package;
    x: number;
    y: number;
    z: number;
};

function overlaps(a0: number, a1: number, b0: number, b1: number) {
    return a0 < b1 - 1e-6 && b0 < a1 - 1e-6;
}

export function volumeCm3(p: Package) {
    return p.lengthCm * p.widthCm * p.heightCm;
}

export function truckVolumeCm3(t: Truck) {
    return t.lengthCm * t.widthCm * t.heightCm;
}

export function validatePlan(
    truck: Truck,
    packages: Package[],
    placements: Placement[],
): ValidationResult {
    const byId = new Map(packages.map((p) => [p.id, p]));
    const placed: Placed[] = [];
    const violations: Violation[] = [];

    for (const item of placements) {
        const pkg = byId.get(item.boxId);
        if (!pkg) continue;
        placed.push({ pkg, x: item.position.x, y: item.position.y, z: item.position.z });
    }

    // BR-VAL-006 — dimensions/weight must be positive finite numbers.
    for (const { pkg } of placed) {
        const nums = [pkg.lengthCm, pkg.widthCm, pkg.heightCm, pkg.weightKg];
        if (nums.some((n) => !Number.isFinite(n) || n <= 0)) {
            violations.push({
                code: "INVALID_PACKAGE",
                severity: "hard",
                boxCodes: [pkg.code],
                message: `${pkg.code} has invalid dimensions or weight.`,
            });
        }
    }

    // BR-VAL-001 — inside truck bounds.
    for (const p of placed) {
        const inside =
            p.x >= -1e-6 &&
            p.y >= -1e-6 &&
            p.z >= -1e-6 &&
            p.x + p.pkg.lengthCm <= truck.lengthCm + 1e-6 &&
            p.y + p.pkg.heightCm <= truck.heightCm + 1e-6 &&
            p.z + p.pkg.widthCm <= truck.widthCm + 1e-6;
        if (!inside) {
            violations.push({
                code: "OUT_OF_BOUNDS",
                severity: "hard",
                boxCodes: [p.pkg.code],
                message: `${p.pkg.code} extends outside the trailer envelope.`,
            });
        }
    }

    // BR-VAL-002 — axis-aligned overlap.
    for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
            const a = placed[i]!;
            const b = placed[j]!;
            if (
                overlaps(a.x, a.x + a.pkg.lengthCm, b.x, b.x + b.pkg.lengthCm) &&

                overlaps(a.y, a.y + a.pkg.heightCm, b.y, b.y + b.pkg.heightCm) &&
                overlaps(a.z, a.z + a.pkg.widthCm, b.z, b.z + b.pkg.widthCm)
            ) {
                violations.push({
                    code: "COLLISION",
                    severity: "hard",
                    boxCodes: [a.pkg.code, b.pkg.code],
                    message: `${a.pkg.code} and ${b.pkg.code} occupy the same space.`,
                });
            }
        }
    }

    // BR-VAL-003 — total weight.
    const totalWeightKg = placed.reduce((sum, p) => sum + p.pkg.weightKg, 0);
    if (truck.maxWeightKg > 0 && totalWeightKg > truck.maxWeightKg + 1e-6) {
        violations.push({
            code: "OVER_WEIGHT",
            severity: "hard",
            boxCodes: [],
            message: `Load weight ${totalWeightKg.toFixed(1)} kg exceeds the ${truck.maxWeightKg} kg limit.`,
        });
    }

    // BR-VAL-004 — a fragile package must not support a heavier package.
    for (const lower of placed) {
        if (!lower.pkg.fragile) continue;
        const top = lower.y + lower.pkg.heightCm;
        for (const upper of placed) {
            if (upper === lower) continue;
            const restsOn = Math.abs(upper.y - top) < 1;
            if (!restsOn) continue;
            if (
                overlaps(lower.x, lower.x + lower.pkg.lengthCm, upper.x, upper.x + upper.pkg.lengthCm) &&
                overlaps(lower.z, lower.z + lower.pkg.widthCm, upper.z, upper.z + upper.pkg.widthCm) &&
                upper.pkg.weightKg > lower.pkg.weightKg
            ) {
                violations.push({
                    code: "FRAGILE_SUPPORT",
                    severity: "hard",
                    boxCodes: [lower.pkg.code, upper.pkg.code],
                    message: `${upper.pkg.code} (${upper.pkg.weightKg} kg) sits on fragile ${lower.pkg.code}.`,
                });
            }
        }
    }

    // BR-VAL-005 — unloading order accessibility from the rear door at x = 0.
    for (const a of placed) {
        for (const b of placed) {
            if (a === b) continue;
            if (b.pkg.deliveryStop <= a.pkg.deliveryStop) continue;
            if (b.x >= a.x) continue;
            if (
                overlaps(a.y, a.y + a.pkg.heightCm, b.y, b.y + b.pkg.heightCm) &&
                overlaps(a.z, a.z + a.pkg.widthCm, b.z, b.z + b.pkg.widthCm)
            ) {
                violations.push({
                    code: "STOP_ORDER_BLOCKED",
                    severity: "hard",
                    boxCodes: [a.pkg.code, b.pkg.code],
                    message: `${b.pkg.code} (stop ${b.pkg.deliveryStop}) blocks ${a.pkg.code} (stop ${a.pkg.deliveryStop}) from the rear door.`,
                });
            }
        }
    }

    const usedVolume = placed.reduce((sum, p) => sum + volumeCm3(p.pkg), 0);
    const utilizationPct = truckVolumeCm3(truck)
        ? Math.round((usedVolume / truckVolumeCm3(truck)) * 1000) / 10
        : 0;

    // Advisory findings — never block approval or execution.
    const warnings: Violation[] = [];
    for (const p of placed) {
        if (p.pkg.fragile && p.y > 1) {
            warnings.push({
                code: "FRAGILE_ELEVATED",
                severity: "warning",
                boxCodes: [p.pkg.code],
                message: `Fragile ${p.pkg.code} is stacked ${Math.round(p.y)} cm above the deck.`,
            });
        }
    }
    if (placed.length && utilizationPct < 35) {
        warnings.push({
            code: "LOW_UTILIZATION",
            severity: "warning",
            boxCodes: [],
            message: `Trailer volume utilization is only ${utilizationPct}%.`,
        });
    }

    const hard = violations.filter((v) => v.severity === "hard").length;
    const score = Math.max(0, Math.round(utilizationPct - hard * 15 - warnings.length * 2));

    return {
        valid: hard === 0,
        violations,
        warnings,
        score,
        utilizationPct,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
    };
}
