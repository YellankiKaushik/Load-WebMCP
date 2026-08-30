# Hackathon Readiness

Can we submit today?

YES, with runtime blockers that must be cleared before a live judged demo.

## Working

- React/TanStack/Vite production build passes.
- TypeScript typecheck passes.
- ESLint passes with 0 errors.
- Vitest suite passes: 20 tests covering planner, validator, authority invariants, WebMCP discovery, no approval tool, graceful degradation, session isolation, and judge fixture reset.
- Deterministic `TRK-042` fixture includes urgent inbound `MED-901`.
- Active/candidate state separation is preserved.
- Human approval is not exposed as a WebMCP tool.
- Proposal panel displays approval gate, revision, hash, utilization, weight, moved count, expiry, and validation results.
- Supabase forward migration hardens hash binding, state checks, immutable approved plan items, and commit idempotency.
- README, license, `.env.example`, and completion report exist.

## Still Required

- Run Supabase migrations against the actual project.
- Verify `approve_load_plan`, `commit_load_plan`, stale-plan rejection, hash mismatch rejection, and duplicate commit against live Postgres.
- Run the app with `SUPABASE_SERVICE_ROLE_KEY` configured server-side.
- Smoke-test in a browser/agent host with `document.modelContext`.

## Manual Checks

- Click **Reset scenario**.
- Confirm active load appears and starts near 75-80% utilization.
- Create, validate, and stage a plan.
- Confirm candidate/proposed load renders as green transparent wireframe.
- Attempt commit before approval and confirm `APPROVAL_REQUIRED`.
- Click **Approve proposal** and confirm active coordinates do not change yet.
- Commit after approval and confirm active 3D load updates.
- Repeat commit and confirm `ALREADY_EXECUTED`.
- Confirm ledger records inspect, plan, validate, stage, blocked commit, approve, commit, and verify events.

## Deployment

- Required env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Keep service-role key out of browser bundles.
- Apply `supabase/migrations/20260830114000_loadguard_v03_authority_hardening.sql`.
- Run `bun run build`, `bun run lint`, `bun run test`, and `bun run typecheck` or the `pnpm` fallbacks.

## Demo

Recommended prompt:

```text
Inspect TRK-042 and the urgent MED-901 shipment.
Create and validate the safest load plan that protects fragile cargo
and preserves unloading order. Stage the plan for review, but do not
make any operational change until I approve it.
```
