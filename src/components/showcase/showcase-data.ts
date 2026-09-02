export const productionUrl = "https://webmcp-openai.kaushikyellanki.workers.dev/";
export const repositoryUrl = "https://github.com/YellankiKaushik/Load-WebMCP";

export const tools = [
  ["get_load_state", "Inspect truck state", "READ ONLY"],
  ["get_package_constraints", "Inspect package constraints", "READ ONLY"],
  ["create_load_plan", "Build candidate plan", "CANDIDATE"],
  ["validate_load_plan", "Validate candidate", "CANDIDATE"],
  ["stage_load_plan", "Stage immutable proposal", "CANDIDATE"],
  ["commit_load_plan", "Apply approved proposal", "OPERATIONAL"],
  ["get_action_ledger", "Inspect audit events", "READ ONLY"],
] as const;

export const workflow = [
  ["01", "Inspect", "Agent reads TRK-042, the active truck load, and package constraints."],
  ["02", "Plan", "A deterministic planner creates a complete candidate load."],
  ["03", "Validate", "An independent validator checks hard loading constraints."],
  ["04", "Stage", "The agent stages an immutable proposal for human review."],
  ["05", "Block", "Commit before approval returns APPROVAL_REQUIRED."],
  ["06", "Authorize", "The operator approves the exact staged proposal in the UI."],
  ["07", "Execute", "The database verifies authority and updates active load state."],
] as const;

export const trustPoints = [
  ["Exact-plan approval", "Human approval is bound to the canonical staged proposal hash."],
  ["Revision protection", "Stale proposals cannot execute against a newer truck revision."],
  ["Expiry", "Old proposals lose authority instead of lingering indefinitely."],
  ["Session isolation", "One operator session cannot authorize another session's proposal."],
  ["Idempotency", "Executed proposals cannot mutate the active load twice."],
  [
    "Auditability",
    "Agent, human, system, and blocked actions are recorded without chain-of-thought.",
  ],
] as const;

export const scenarioFacts = [
  ["Current", "TRK-042", "8/9 loaded, MED-901 inbound, 993/1200 kg, 75.6%, revision 1"],
  ["Agent proposal", "Valid candidate", "9/9 placed, 1011 kg, 78.4%, 0 hard violations"],
  ["Human gate", "APPROVAL_REQUIRED", "Commit is blocked until the exact proposal is approved."],
  ["Execution", "EXECUTED", "MED-901 loaded, active revision 2, duplicate commit blocked."],
] as const;

export const architectureLayers = [
  [
    "Presentation",
    "React 19 + TanStack Start",
    "Landing, technical proof pages, and workspace shell",
  ],
  ["Spatial", "React Three Fiber + Three.js", "3D active/candidate truck-load visualization"],
  [
    "Agent interface",
    "WebMCP document.modelContext",
    "Page-defined tool contract for browser agents",
  ],
  ["Planning", "Deterministic TypeScript planner", "Complete candidate load plan generation"],
  ["Validation", "Independent deterministic validator", "Hard-rule and warning evaluation"],
  ["Server authority", "TanStack server functions", "Server-side operation boundary"],
  [
    "Data / authority",
    "Supabase Postgres + RPC + RLS",
    "Proposal status, hashes, revisions, ledger",
  ],
  ["Deployment", "Cloudflare Workers", "Production runtime for the verified demo"],
] as const;
