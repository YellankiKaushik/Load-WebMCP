// Shared LoadGuard 3D domain types. Pure data, safe on client and server.

export type Priority = "normal" | "high" | "urgent";

export type PlanStatus =
  | "DRAFT"
  | "STAGED"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "EXECUTING"
  | "EXECUTED"
  | "FAILED"
  | "SUPERSEDED";

export type Truck = {
  id: string;
  code: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  maxWeightKg: number;
  stateRevision: number;
};

export type Package = {
  id: string;
  code: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  destination: string;
  deliveryStop: number;
  fragile: boolean;
  priority: Priority;
  loaded: boolean;
  position: Position | null;
};

export type Position = { x: number; y: number; z: number };

export type Placement = {
  boxId: string;
  boxCode: string;
  position: Position;
  sequence: number;
};

export type ViolationCode =
  | "OUT_OF_BOUNDS"
  | "COLLISION"
  | "OVER_WEIGHT"
  | "FRAGILE_SUPPORT"
  | "STOP_ORDER_BLOCKED"
  | "INVALID_PACKAGE"
  | "INVALID_POSITION"
  | "DUPLICATE_PLACEMENT"
  | "UNKNOWN_PACKAGE"
  | "FRAGILE_ELEVATED"
  | "LOW_UTILIZATION"
  | "HANDLING_MOVE_REQUIRED";

export type Violation = {
  code: ViolationCode;
  severity: "hard" | "warning";
  boxCodes: string[];
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  violations: Violation[];
  warnings: Violation[];
  score: number;
  utilizationPct: number;
  totalWeightKg: number;
};

/** Every plan/proposal transition the authority layer can report. */
export type PlanErrorCode =
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "HARD_VIOLATIONS"
  | "APPROVAL_REQUIRED"
  | "PLAN_HASH_MISMATCH"
  | "STALE_PLAN"
  | "EXPIRED"
  | "ALREADY_EXECUTED"
  | "EXECUTION_FAILED"
  | "RPC_FAILED";

export type PlanSummary = {
  planId: string;
  planCode: string | null;
  status: PlanStatus;
  createdBy: string;
  algorithmVersion: string;
  planHash: string | null;
  approvedHash: string | null;
  sourceStateRevision: number | null;
  utilizationPct: number | null;
  totalWeightKg: number | null;
  validation: ValidationResult | null;
  placements: Placement[];
  stagedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  executingAt: string | null;
  executedAt: string | null;
  failedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type LedgerEvent = {
  id: string;
  occurredAt: string;
  actor: "agent" | "human" | "system";
  eventType: string;
  toolName: string | null;
  resourceType: string | null;
  resourceId: string | null;
  result: "success" | "blocked" | "failed";
  summary: string;
};

export type LoadState = {
  truck: Truck;
  packages: Package[];
  loadedCount: number;
  stateRevision: number;
  utilizationPct: number;
  totalWeightKg: number;
  activeValidation: ValidationResult;
  latestPlan: PlanSummary | null;
};

/** Structured provenance envelope returned by every WebMCP tool. */
export type ToolEnvelope<T> = {
  source: "loadguard-site";
  tool: string;
  authority: "site-enforced";
  human_authorization: "not-required" | "required-and-verified-in-database";
  state_revision: number | null;
  generated_at: string;
  data: T;
};
