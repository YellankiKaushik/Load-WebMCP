# Security And Authorization

LoadGuard's central safety property is:

```text
Agent reasoning is not authorization.
Model text is not authorization.
```

The agent can propose. The human approves. The server and database enforce the commit
contract.

## Authorization Boundary

- Approval is absent from WebMCP.
- Approval is available only through the human-facing LoadGuard UI.
- Approval records the exact staged proposal hash.
- Approval itself does not mutate the active truck load.
- Commit accepts only a proposal id, never fresh package coordinates.

## Database Enforcement

The commit authority verifies:

- proposal exists and belongs to the current session
- proposal status is approved
- approved hash matches the staged proposal hash
- proposal has not expired
- source truck revision still matches
- target package coverage is complete
- proposal has not already executed

If any check fails, the operational state remains unchanged.

## Active And Candidate Separation

Candidate plans are stored as proposal snapshots. They can be drafted, validated, staged,
approved, rejected, expired, or executed without being confused with active cargo until a
valid approved commit succeeds.

## Session Isolation

LoadGuard uses per-session fixture state for the judge workflow. Resetting the scenario
restores `TRK-042`, clears stale proposals for the session, and keeps tests deterministic.

## Secrets

- `.env` and `.env.*` are ignored except `.env.example`.
- `.env.example` contains names and empty placeholders only.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to browser code,
  README screenshots, logs, or public docs.
- Cloudflare and Supabase secrets are managed outside the repository.

## Audit Trail

The action ledger records agent, human, and system events such as inspection, validation,
staging, blocked pre-approval commit, human approval, successful commit, and duplicate
commit refusal. It records operational evidence, not chain-of-thought.
