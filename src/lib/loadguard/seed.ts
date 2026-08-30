// CMP-DEMO-001 — deterministic judge scenario seed for truck TRK-042.

export const SEED_TRUCK = {
  code: "TRK-042",
  lengthCm: 330,
  widthCm: 190,
  heightCm: 150,
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
  priority: "normal" | "high" | "urgent";
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
    lengthCm: 115,
    widthCm: 90,
    heightCm: 75,
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
    lengthCm: 115,
    widthCm: 90,
    heightCm: 70,
    weightKg: 95,
    destination: "Pune Depot",
    deliveryStop: 1,
    fragile: false,
    priority: "normal",
    loaded: true,
    position: { x: 0, y: 75, z: 0 },
  },
  {
    code: "PKG-103",
    lengthCm: 115,
    widthCm: 100,
    heightCm: 105,
    weightKg: 160,
    destination: "Nashik Hub",
    deliveryStop: 2,
    fragile: false,
    priority: "normal",
    loaded: true,
    position: { x: 0, y: 0, z: 90 },
  },
  {
    code: "PKG-104",
    lengthCm: 115,
    widthCm: 95,
    heightCm: 95,
    weightKg: 210,
    destination: "Surat Yard",
    deliveryStop: 3,
    fragile: false,
    priority: "normal",
    loaded: true,
    position: { x: 115, y: 0, z: 0 },
  },
  {
    code: "PKG-105",
    lengthCm: 115,
    widthCm: 95,
    heightCm: 95,
    weightKg: 185,
    destination: "Surat Yard",
    deliveryStop: 3,
    fragile: false,
    priority: "normal",
    loaded: true,
    position: { x: 115, y: 0, z: 95 },
  },
  {
    code: "PKG-106",
    lengthCm: 100,
    widthCm: 95,
    heightCm: 80,
    weightKg: 45,
    destination: "Ahmedabad DC",
    deliveryStop: 4,
    fragile: true,
    priority: "normal",
    loaded: true,
    position: { x: 230, y: 70, z: 0 },
  },
  {
    code: "PKG-107",
    lengthCm: 100,
    widthCm: 95,
    heightCm: 70,
    weightKg: 70,
    destination: "Ahmedabad DC",
    deliveryStop: 4,
    fragile: false,
    priority: "high",
    loaded: true,
    position: { x: 230, y: 0, z: 0 },
  },
  {
    code: "PKG-108",
    lengthCm: 100,
    widthCm: 95,
    heightCm: 95,
    weightKg: 88,
    destination: "Vadodara Crossdock",
    deliveryStop: 5,
    fragile: false,
    priority: "normal",
    loaded: true,
    position: { x: 230, y: 0, z: 95 },
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
