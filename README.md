# LoadGuard 3D

Agent-native load planning with human-controlled execution.

LoadGuard 3D is a WebMCP-enabled 3D truck loading demo for the OpenAI WebMCP Challenge 2026. A WebMCP-capable agent can inspect truck state, reason over package constraints, create a deterministic candidate load plan, validate it, stage it, and attempt to commit it. The commit is blocked until a human approves the exact staged proposal in the application UI.

Core invariant:

```text
agent reasoning != human authorization
model text != authorization
```

The application/database state is the authority.

## Why WebMCP Matters

The page exposes a deliberately small WebMCP tool surface through `document.modelContext`. The agent does not need to guess from DOM controls, and the human sees the same state the agent is operating on:

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
5. `commit_load_plan` fails with `APPROVAL_REQUIRED`.
6. The human clicks **Approve proposal**.
7. Approval records the canonical hash of the exact staged proposal.
8. The agent calls `commit_load_plan` with only the proposal id.
9. The database verifies status, hash, expiry, session, and truck revision before updating active package coordinates.

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
- `supabase/migrations/` - tables, RLS, RPCs, hash binding, commit authority

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
pnpm run lint
pnpm run test
pnpm run typecheck
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
```

The 3D scene renders active load as solid packages and proposed/candidate load as a green transparent wireframe. After commit, the approved proposal becomes the active load.

## Reset

Use the **Reset scenario** button in the UI to restore the deterministic `TRK-042` fixture with urgent inbound `MED-901`. Reset is server-authoritative and clears stale proposals, plan items, approval state, and ledger entries for the current session.

## WebMCP Browser Requirement

The normal site works without WebMCP. Tool registration is available only in a browser/agent runtime that exposes `document.modelContext`.

## Attribution

LoadGuard 3D builds on the SmartLoad-3D inspiration/base referenced in `docs/Final Open AI - Web MCP.md` and preserves that attribution. The LoadGuard additions are the WebMCP capability surface, deterministic planner/validator hardening, proposal authority model, action ledger, and human-authorized exact-plan commit workflow.
