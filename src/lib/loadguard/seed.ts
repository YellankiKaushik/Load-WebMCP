// CMP-DEMO-001 — deterministic judge scenario seed for truck TRK-042.

export const SEED_TRUCK = {
    code: "TRK-042",
    lengthCm: 600,
    widthCm: 240,
    heightCm: 260,
    maxWeightKg: 1200,
};

export type SeedBox = {
    code: string;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
    destination: string;
    deliveryStop: number;
    fragile: boolean;
    priority: "normal" | "urgent";
    loaded: boolean;
    position: { x: number; y: number; z: number } | null;
};

/**
 * Existing load: already placed on the trailer (loaded = true).
 * MED-901 is the urgent inbound package that must be inserted at stop 2.
 */
export const SEED_BOXES: SeedBox[] = [
    {
        code: "PKG-101",
        lengthCm: 120,
        widthCm: 100,
        heightCm: 90,
        weightKg: 140,
        destination: "Pune Depot",
        deliveryStop: 1,
        fragile: false,
        priority: "normal",
        loaded: true,
        position: { x: 0, y: 0, z: 0 },
    },
    {
        code: "PKG-102",
        lengthCm: 120,
        widthCm: 100,
        heightCm: 80,
        weightKg: 95,
        destination: "Pune Depot",
        deliveryStop: 1,
        fragile: false,
        priority: "normal",
        loaded: true,
        position: { x: 0, y: 90, z: 0 },
    },
    {
        code: "PKG-103",
        lengthCm: 110,
        widthCm: 110,
        heightCm: 100,
        weightKg: 160,
        destination: "Nashik Hub",
        deliveryStop: 2,
        fragile: false,
        priority: "normal",
        loaded: true,
        position: { x: 0, y: 0, z: 100 },
    },
    {
        code: "PKG-104",
        lengthCm: 140,
        widthCm: 120,
        heightCm: 110,
        weightKg: 210,
        destination: "Surat Yard",
        deliveryStop: 3,
        fragile: false,
        priority: "normal",
        loaded: true,
        position: { x: 120, y: 0, z: 0 },
    },
    {
        code: "PKG-105",
        lengthCm: 140,
        widthCm: 110,
        heightCm: 95,
        weightKg: 185,
        destination: "Surat Yard",
        deliveryStop: 3,
        fragile: false,
        priority: "normal",
        loaded: true,
        position: { x: 120, y: 0, z: 120 },
    },
    {
        code: "PKG-106",
        lengthCm: 100,
        widthCm: 90,
        heightCm: 70,
        weightKg: 45,
        destination: "Ahmedabad DC",
        deliveryStop: 4,
        fragile: true,
        priority: "normal",
        loaded: true,
        position: { x: 260, y: 0, z: 0 },
    },
    {
        code: "MED-901",
        lengthCm: 80,
        widthCm: 60,
        heightCm: 60,
        weightKg: 18,
        destination: "Nashik Hospital",
        deliveryStop: 2,
        fragile: true,
        priority: "urgent",
        loaded: false,
        position: null,
    },
];
