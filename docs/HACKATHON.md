# Hackathon

Project: LoadGuard 3D

Creator: Kaushik Yellanki

Challenge: OpenAI WebMCP Challenge 2026

Tagline: Agent-native load planning with human-controlled execution.

Production: https://webmcp-openai.kaushikyellanki.workers.dev/

Live workspace: https://webmcp-openai.kaushikyellanki.workers.dev/workspace

Repository: https://github.com/YellankiKaushik/Load-WebMCP

## Problem

Operational planning often benefits from agent reasoning, but execution authority should
not be granted just because an agent generated a plan. Truck loading is a concrete way to
show that boundary: a plan must preserve unloading order, respect weight and geometry,
protect fragile cargo, and remain auditable.

## Solution

LoadGuard lets a WebMCP-capable agent inspect the active truck and package constraints,
create a deterministic 3D candidate load plan, validate it, and stage it for human review.
The operator then approves or rejects the exact staged proposal in the UI.

Kaushik implemented LoadGuard as a site-defined operational contract: seven WebMCP tools
for inspection, planning, validation, staging, execution request, and audit review, with
approval deliberately kept outside the agent-callable surface.

```text
The agent reasons.
The operator authorizes.
The website defines and enforces the contract.
```

## Technical Differentiation

- WebMCP-native tool surface registered by the page.
- Exactly seven tools: read state, read constraints, create plan, validate, stage, commit, read ledger.
- No WebMCP approval tool.
- Deterministic planner plus independent validator.
- Proposal hash binding and approved-hash verification.
- Revision, expiry, session, complete-coverage, and idempotency checks.
- Database-enforced authority through Supabase RPCs and RLS.
- 3D visualization separates active cargo from candidate cargo.
- Action ledger records agent, human, and system events.

## Demo Narrative

1. Reset `TRK-042` to the judge baseline: 8/9 loaded, `MED-901` inbound, 993 kg, 75.6%.
2. Ask the agent to inspect the truck and urgent medical shipment.
3. The agent creates, validates, and stages a plan: 9/9 placed, 1011 kg, 78.4%, valid.
4. Before approval, commit is refused with `APPROVAL_REQUIRED`.
5. The human approves the exact staged plan in the UI.
6. The agent commits only the proposal id.
7. Database authority executes the plan and advances the truck to revision 2.
8. A duplicate commit is refused with `ALREADY_EXECUTED`.

## Why It Matters

LoadGuard demonstrates a practical human-agent collaboration pattern for the web. The
result is not a chat demo wrapped around a UI. The website itself owns the operational
contract and exposes the safe parts of that contract to the agent while Supabase RPCs and
RLS enforce execution authority.
