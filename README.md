# LoadGuard 3D

Agent-native 3D truck load planning with human-controlled execution.

LoadGuard 3D is a WebMCP-enabled truck loading demo for the OpenAI WebMCP Challenge 2026. A WebMCP-capable agent can inspect truck state, read package constraints, create a deterministic candidate load plan, validate it, stage it, and request execution. Operational execution is blocked until a human approves the exact staged proposal in the application UI.

Current status:

```text
PRODUCTION VERIFIED — READY FOR DEVPOST SUBMISSION
```

Core invariant:

```text
agent reasoning != human authorization
model text != authorization
```

The application and database are the authority.

## Production Verification Status

LoadGuard 3D has completed final production deployment and end-to-end WebMCP verification.

Production deployment:

```text
Provider: Cloudflare Workers
URL: https://webmcp-openai.kaushikyellanki.workers.dev/
```

Verified live Supabase state:

- Remote migrations applied successfully.
- Local and remote migration histories match.
- Core tables exist: `trucks`, `boxes`, `load_plans`, `load_plan_items`, `action_ledger`.
- Protected functions exist: `approve_load_plan`, `reject_load_plan`, `commit_load_plan`, `canonical_plan_hash`.
- RLS is enabled on all five core tables.
- Protected RPC privileges are locked down: `anon` cannot execute, `authenticated` cannot execute, `service_role` can execute.

Verified production baseline:

- `TRK-042`
- 8/9 loaded
- 75.6% utilization
- 993/1200 kg
- `MED-901` inbound
- Active validation valid
- 3D scene working

Verified production WebMCP state:

- LoadGuard opened in the OpenAI WebMCP-capable browser.
- The page reported `Tools registered on document.modelContext`.
- Exactly seven WebMCP tools were verified.
- There is no human approval WebMCP tool.

Verified judge workflow:

- `TRK-042` began at revision 1 with 8/9 packages loaded.
- Urgent fragile `MED-901` was inbound.
- The agent inspected state, retrieved constraints, created a deterministic plan, validated it, and staged it.
- Pre-approval commit returned `APPROVAL_REQUIRED` and did not mutate the active load.
- Human approval through the UI recorded the staged hash and did not mutate the active load.
- Agent commit after approval executed the proposal.
- `MED-901` became loaded at `x=115, y=95, z=0`.
- Active state remained valid with 0 hard violations.
- Truck revision advanced from 1 to 2.
- Replayed commit returned `ALREADY_EXECUTED` without another mutation.

## Why WebMCP Matters

The page exposes a deliberately small WebMCP tool surface through `document.modelContext`. The agent does not need to infer state from DOM controls, and the human can review the same proposal the agent is operating on.

Verified tools:

- `get_load_state`
- `get_package_constraints`
- `create_load_plan`
- `validate_load_plan`
- `stage_load_plan`
- `commit_load_plan`
- `get_action_ledger`

There is intentionally no `approve_load_plan`, `authorize_plan`, or equivalent WebMCP tool. Approval is a human-facing UI action.

## Human-Agent Workflow

1. Reset the deterministic judge scenario.
2. The agent inspects `TRK-042` and urgent package `MED-901`.
3. The agent creates and validates a candidate plan.
4. The agent stages the plan as an immutable proposal.
5. `commit_load_plan` fails with `APPROVAL_REQUIRED` before human approval.
6. The human clicks **Approve proposal** in the UI.
7. Approval records the canonical hash of the exact staged proposal.
8. Approval itself does not mutate the active load.
9. The agent calls `commit_load_plan` with only the proposal id.
10. The database verifies status, hash, expiry, session, complete target coverage, and truck revision before updating active package coordinates.
11. Repeating commit returns `ALREADY_EXECUTED` without reapplying the plan.

## Verified Judge Fixture

Clean fixture:

```text
TRK-042
revision 1
8/9 loaded
75.6% utilization
993/1200 kg
MED-901 inbound
```

Verified staged proposal:

```text
PLAN-002
proposal id: a75f4db6-b1d2-4824-aa7c-7ad8f3677600
status before approval: STAGED
target packages: 9
placements: 9
unplaced: 0
validation: valid
hard violations: 0
total weight: 1011 kg
utilization: 78.4%
MED-901 planned position: x=115, y=95, z=0
```

Verified post-commit state:

```text
MED-901 loaded: YES
MED-901 position: x=115, y=95, z=0
active validation: VALID
hard violations: 0
revision: 1 -> 2
loaded: 9/9
weight: 1011/1200 kg
utilization: 78.4%
```

The final valid plan may include non-blocking `FRAGILE_ELEVATED` review warnings for `PKG-106` and `MED-901`. These are warnings, not hard validation failures.

## Latest Local Verification

The 2026-08-31 production documentation freeze reran the release gate without changing application logic:

```text
bun install --frozen-lockfile  PASS
bun run build                  PASS
bun run typecheck              PASS
bun run lint                   PASS, 0 errors and 5 existing Fast Refresh warnings
bun run test                   PASS, 2 test files and 28 tests
git diff --check    PASS
```

`.env` remained ignored and untracked. No committed secret values were found in the tracked tree.

## Architecture

The current stack is preserved:

- React 19
- TanStack Start and TanStack Router
- Vite
- TypeScript
- Tailwind CSS
- Radix/shadcn-style UI
- React Three Fiber and Three.js
- Supabase
- TanStack Query
- Zod

Important modules:

- `src/lib/loadguard/planner.ts` - deterministic planner, `planner-v1`
- `src/lib/loadguard/validator.ts` - independent deterministic validator
- `src/lib/loadguard/authority.ts` - pure authority-state helpers used by tests
- `src/lib/loadguard/webmcp.ts` - WebMCP adapter
- `src/lib/loadguard.server.ts` - server-only Supabase authority layer
- `src/components/loadguard/TruckScene.tsx` - active/proposed 3D rendering
- `supabase/migrations/` - tables, RLS, RPCs, hash binding, complete target coverage, commit authority

## Local Setup

This repository includes `bun.lock`, so Bun is preferred when available:

```sh
bun install
bun run dev
```

If Bun is unavailable, `pnpm` works as a fallback:

```sh
pnpm install --no-lockfile
pnpm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and provide project-local values:

```text
SUPABASE_URL=
SUPABASE_PROJECT_ID=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code. It is used only by server functions.

## Supabase Setup

Apply migrations from a fresh Supabase project:

```sh
supabase db push
```

For local Supabase, start the stack first:

```sh
supabase start
supabase db reset
```

Verified migration history:

```text
20260829192707
20260829192733
20260830024805
20260830114000
20260830190000
```

Protected RPCs are granted to `service_role` and revoked from browser roles. Normal application access flows through TanStack Start server functions.

## Run Commands

```sh
bun run build
bun run lint
bun run test
bun run typecheck
```

Fallback:

```sh
pnpm run build
pnpm run typecheck
pnpm run lint
pnpm run test
git diff --check
```

## Judge Demo

Recommended ChatGPT prompt:

```text
Inspect TRK-042 and the urgent MED-901 shipment.
Create and validate the safest load plan that protects fragile cargo
and preserves unloading order. Stage the plan for review, but do not
make any operational change until I approve it.
```

Expected sequence:

```text
get_load_state
get_package_constraints
create_load_plan
validate_load_plan
stage_load_plan
commit_load_plan -> APPROVAL_REQUIRED
human clicks Approve proposal
commit_load_plan -> EXECUTED
get_load_state
get_action_ledger
second commit -> ALREADY_EXECUTED
```

The 3D scene renders active load as solid packages and proposed/candidate load as a green transparent wireframe. After commit, the approved proposal becomes the active load.

## Reset

Use the **Reset scenario** button in the UI to restore the deterministic `TRK-042` fixture with urgent inbound `MED-901`. Reset is server-authoritative and clears stale proposals, plan items, approval state, and ledger entries for the current session.

## WebMCP Browser Requirement

The normal site works without WebMCP. Tool registration is available only in a browser/agent runtime that exposes `document.modelContext`.

## Documentation

- `docs/CODEX_COMPLETION_REPORT.md` - completion and live verification report
- `docs/HACKATHON_READINESS.md` - final readiness checklist
- `docs/REPOSITORY_SAFETY_REPORT.md` - repository, secret, and authority safety status
- `docs/Final Open AI - Web MCP.md` - original challenge-oriented documentation and attribution

## Attribution

LoadGuard 3D builds on the SmartLoad-3D inspiration/base referenced in `docs/Final Open AI - Web MCP.md` and preserves that attribution. The LoadGuard additions are the WebMCP capability surface, deterministic planner/validator hardening, proposal authority model, action ledger, complete target coverage checks, and human-authorized exact-plan commit workflow.
