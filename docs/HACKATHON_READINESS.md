# Hackathon Readiness

Can we submit today?

YES, after applying the new forward migration and completing the live retest sequence below.

## Working

- React/TanStack/Vite production build passes.
- TypeScript typecheck passes.
- ESLint passes with 0 errors.
- Vitest suite passes: 28 tests covering planner, validator, complete plan coverage, authority invariants, WebMCP discovery, no approval tool, graceful degradation, session isolation, and judge fixture reset.
- Deterministic `TRK-042` fixture includes urgent inbound `MED-901`.
- Active/candidate state separation is preserved.
- Human approval is not exposed as a WebMCP tool.
- Proposal panel displays approval gate, revision, hash, utilization, weight, moved count, expiry, and validation results.
- Supabase forward migrations harden hash binding, target coverage, state checks, immutable approved plan items, and commit idempotency.
- README, license, `.env.example`, and completion report exist.

## Still Required

- Apply the new forward migration `supabase/migrations/20260830190000_loadguard_plan_target_coverage.sql` against the actual project.
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
- Apply `supabase/migrations/20260830114000_loadguard_v03_authority_hardening.sql` and `supabase/migrations/20260830190000_loadguard_plan_target_coverage.sql`.
- Run `bun run build`, `bun run lint`, `bun run test`, and `bun run typecheck` or the `pnpm` fallbacks.

## Demo

Recommended prompt:

```text
Inspect TRK-042 and the urgent MED-901 shipment.
Create and validate the safest load plan that protects fragile cargo
and preserves unloading order. Stage the plan for review, but do not
make any operational change until I approve it.
```

## LIVE INTEGRATION DEFECT FOUND AND REPAIRED

Observed failure: the first live Supabase run produced a proposal that validated as safe with only 7 placements, then committed into a 9-package active state with collisions involving `PKG-103`, `PKG-104`, and `PKG-105`.

Root cause: planner and stored-plan validation validated only proposal placement IDs, so required loaded packages omitted from the proposal were ignored during validation and metrics but retained their old active coordinates at commit.

Repair: plans now represent the complete intended post-commit target snapshot. `target_box_ids` is persisted on each plan, `load_plan_items` must contain exactly one row for every target package, and staging/approval/commit fail closed on coverage mismatch.

New tests: LG-019 through LG-026 cover omitted package invalidation, retained-active collision prevention, complete TRK-042 + MED-901 planning, truthful proposal metrics, commit equivalence, post-commit active validation, and staging/approval coverage blocking.

Live retest status: pending. Do not claim live PASS until the new migration is applied and the exact retest flow succeeds against the Supabase project.

Repository verification: repair commit `93ba7a1e17d68b2071549a9ac032b681dd2a6460` was pushed normally to `origin/main`; final local and remote SHAs match and the working tree is clean. The new migration must still be applied through the normal Supabase deployment workflow before live retest.
