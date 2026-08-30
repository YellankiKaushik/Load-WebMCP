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

declare global {
    interface Document {
        modelContext?: ModelContext;
    }
}

function ok(value: unknown): ToolResult {
    return { content: [{ type: "text", text: JSON.stringify(value) }] };
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
            execute: async () => ok(await fetchLoadState({ data: { sessionKey, actor: "agent" } })),
        },
        {
            name: "get_package_constraints",
            description:
                "Return package constraints (size, weight, destination, delivery stop, fragility, priority) and the loading rules enforced by the site.",
            inputSchema: {
                type: "object",
                properties: {
                    codes: { type: "array", items: { type: "string" }, description: "Optional package codes." },
                },
                additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: async (args) =>
                ok(
                    await fetchPackageConstraints({
                        data: { sessionKey, codes: (args["codes"] as string[]) ?? undefined },
                    }),
                ),
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
                const result = await planLoad({
                    data: { sessionKey, includeCodes: (args["include_codes"] as string[]) ?? undefined },
                });
                onChange();
                return ok({
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
            description: "Validate a stored plan against all hard loading rules and return its violations.",
            inputSchema: {
                type: "object",
                properties: { plan_id: { type: "string" } },
                required: ["plan_id"],
                additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: async (args) => {
                const result = await validateLoadPlan({
                    data: { sessionKey, planId: String(args["plan_id"]) },
                });
                onChange();
                return ok(result);
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
                const result = await stageLoadPlan({
                    data: { sessionKey, planId: String(args["plan_id"]) },
                });
                onChange();
                return ok(result);
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
                const result = await commitLoadPlan({
                    data: { sessionKey, planId: String(args["proposal_id"]) },
                });
                onChange();
                return ok(result);
            },
        },
        {
            name: "get_action_ledger",
            description: "Return the recent action ledger for this session (agent, human and system events).",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true },
            execute: async () => ok(await fetchActionLedger({ data: { sessionKey } })),
        },
    ];

    if (!mc?.registerTool) {
        return { registered: false, toolNames: tools.map((t) => t.name), unregister: () => { } };
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
