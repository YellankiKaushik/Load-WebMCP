// CMP-MCP-001 — WebMCP tool registry adapter.
// Registers a deliberately small tool surface on document.modelContext.
// Human approval is intentionally NOT exposed as a tool.
import {
  commitLoadPlan,
  fetchActionLedger,
  fetchLoadState,
  fetchPackageConstraints,
  planLoad,
  stageLoadPlan,
  validateLoadPlan,
} from "@/lib/loadguard.functions";

type ToolResult = { content: { type: "text"; text: string }[] };

type ToolDescriptor = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};

type ModelContext = {
  registerTool: (tool: ToolDescriptor) => { unregister?: () => void } | void;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const LOADGUARD_WEBMCP_TOOL_NAMES = [
  "get_load_state",
  "get_package_constraints",
  "create_load_plan",
  "validate_load_plan",
  "stage_load_plan",
  "commit_load_plan",
  "get_action_ledger",
] as const;

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

function ok(value: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

function error(code: string, message: string): ToolResult {
  return ok({
    ok: false,
    code,
    message,
    source: {
      sourceType: "webmcp_error",
      containsUntrustedContent: false,
      observedAt: new Date().toISOString(),
    },
  });
}

function envelope(tool: string, stateRevision: number | null, data: unknown): ToolResult {
  return ok({
    ok: true,
    source: {
      sourceType: "loadguard_webmcp_tool",
      tool,
      stateRevision,
      observedAt: new Date().toISOString(),
      containsUntrustedContent: false,
    },
    authority: "site-enforced",
    data,
  });
}

function onlyKeys(args: Record<string, unknown>, allowed: string[]) {
  return Object.keys(args).every((key) => allowed.includes(key));
}

function optionalStringArray(args: Record<string, unknown>, key: string) {
  const value = args[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Expected an array of strings.");
  }
  return value;
}

function requiredUuid(args: Record<string, unknown>, key: string) {
  const value = args[key];
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new Error(`Expected ${key} to be a UUID.`);
  }
  return value;
}

export function registerLoadGuardTools(
  sessionKey: string,
  onChange: () => void,
): { registered: boolean; toolNames: string[]; unregister: () => void } {
  const mc = typeof document !== "undefined" ? document.modelContext : undefined;
  const tools: ToolDescriptor[] = [
    {
      name: "get_load_state",
      description:
        "Return the normalized state of the active truck: dimensions, weight limit, packages, positions, utilization and current violations.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        if (!onlyKeys(args, [])) return error("INVALID_REQUEST", "Unknown argument.");
        const state = await fetchLoadState({ data: { sessionKey, actor: "agent" } });
        return envelope("get_load_state", state.stateRevision, state);
      },
    },
    {
      name: "get_package_constraints",
      description:
        "Return package constraints (size, weight, destination, delivery stop, fragility, priority) and the loading rules enforced by the site.",
      inputSchema: {
        type: "object",
        properties: {
          codes: {
            type: "array",
            items: { type: "string" },
            description: "Optional package codes.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        if (!onlyKeys(args, ["codes"])) return error("INVALID_REQUEST", "Unknown argument.");
        try {
          const constraints = await fetchPackageConstraints({
            data: { sessionKey, codes: optionalStringArray(args, "codes") },
          });
          return envelope("get_package_constraints", constraints.stateRevision, constraints);
        } catch (err) {
          return error("INVALID_REQUEST", err instanceof Error ? err.message : "Invalid input.");
        }
      },
    },
    {
      name: "create_load_plan",
      description:
        "Generate a deterministic candidate load plan. This only creates a DRAFT proposal and never changes the active load.",
      inputSchema: {
        type: "object",
        properties: {
          include_codes: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
      execute: async (args) => {
        if (!onlyKeys(args, ["include_codes"])) {
          return error("INVALID_REQUEST", "Unknown argument.");
        }
        let includeCodes: string[] | undefined;
        try {
          includeCodes = optionalStringArray(args, "include_codes");
        } catch (err) {
          return error("INVALID_REQUEST", err instanceof Error ? err.message : "Invalid input.");
        }
        const result = await planLoad({
          data: { sessionKey, includeCodes },
        });
        onChange();
        return envelope("create_load_plan", result.stateRevision, {
          plan_id: result.plan?.planId,
          status: result.plan?.status,
          utilization_pct: result.validation.utilizationPct,
          total_weight_kg: result.validation.totalWeightKg,
          moves: result.moves,
          unplaced: result.unplaced,
          validation: result.validation,
        });
      },
    },
    {
      name: "validate_load_plan",
      description:
        "Validate a stored plan against all hard loading rules and return its violations.",
      inputSchema: {
        type: "object",
        properties: { plan_id: { type: "string" } },
        required: ["plan_id"],
        additionalProperties: false,
      },
      execute: async (args) => {
        if (!onlyKeys(args, ["plan_id"])) return error("INVALID_REQUEST", "Unknown argument.");
        let planId: string;
        try {
          planId = requiredUuid(args, "plan_id");
        } catch (err) {
          return error("INVALID_REQUEST", err instanceof Error ? err.message : "Invalid input.");
        }
        const result = await validateLoadPlan({
          data: { sessionKey, planId },
        });
        onChange();
        return envelope("validate_load_plan", result.ok ? result.stateRevision : null, result);
      },
    },
    {
      name: "stage_load_plan",
      description:
        "Persist a validated draft plan as an immutable proposal awaiting human approval. Does not activate it.",
      inputSchema: {
        type: "object",
        properties: { plan_id: { type: "string" } },
        required: ["plan_id"],
        additionalProperties: false,
      },
      execute: async (args) => {
        if (!onlyKeys(args, ["plan_id"])) return error("INVALID_REQUEST", "Unknown argument.");
        let planId: string;
        try {
          planId = requiredUuid(args, "plan_id");
        } catch (err) {
          return error("INVALID_REQUEST", err instanceof Error ? err.message : "Invalid input.");
        }
        const result = await stageLoadPlan({
          data: { sessionKey, planId },
        });
        onChange();
        return envelope(
          "stage_load_plan",
          result.ok ? (result.plan?.sourceStateRevision ?? null) : null,
          result,
        );
      },
    },
    {
      name: "commit_load_plan",
      description:
        "Apply an already human-approved proposal exactly as staged. Accepts only a proposal id; fails if the proposal is not APPROVED, is stale, expired, altered, or already executed.",
      inputSchema: {
        type: "object",
        properties: { proposal_id: { type: "string" } },
        required: ["proposal_id"],
        additionalProperties: false,
      },
      execute: async (args) => {
        if (!onlyKeys(args, ["proposal_id"])) {
          return error("INVALID_REQUEST", "Unknown argument.");
        }
        let planId: string;
        try {
          planId = requiredUuid(args, "proposal_id");
        } catch (err) {
          return error("INVALID_REQUEST", err instanceof Error ? err.message : "Invalid input.");
        }
        const result = await commitLoadPlan({
          data: { sessionKey, planId },
        });
        onChange();
        return envelope(
          "commit_load_plan",
          "state_revision" in result && typeof result.state_revision === "number"
            ? result.state_revision
            : null,
          result,
        );
      },
    },
    {
      name: "get_action_ledger",
      description:
        "Return the recent action ledger for this session (agent, human and system events).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        if (!onlyKeys(args, [])) return error("INVALID_REQUEST", "Unknown argument.");
        return envelope("get_action_ledger", null, await fetchActionLedger());
      },
    },
  ];

  if (!mc?.registerTool) {
    return { registered: false, toolNames: tools.map((t) => t.name), unregister: () => {} };
  }

  const handles = tools.map((tool) => mc.registerTool(tool));

  return {
    registered: true,
    toolNames: tools.map((t) => t.name),
    unregister: () => {
      for (const handle of handles) handle?.unregister?.();
    },
  };
}
