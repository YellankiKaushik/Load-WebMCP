# WebMCP Integration

LoadGuard uses WebMCP to expose a narrow, deterministic logistics capability surface from
the page itself. The browser agent interacts with `document.modelContext`; the website
defines tool names, schemas, effects, and authority boundaries.

The judge-facing landing page lives at `/`. The operational WebMCP workspace lives at
`/workspace`, where the tool surface is registered.

## Tool Surface

Exactly seven tools are registered:

| Tool                      | Purpose                                                                              | Effect            |
| ------------------------- | ------------------------------------------------------------------------------------ | ----------------- |
| `get_load_state`          | Return normalized active truck state, package positions, utilization, and validation | Read only         |
| `get_package_constraints` | Return dimensions, weight, stop order, priority, fragility, and loading rules        | Read only         |
| `create_load_plan`        | Generate a deterministic candidate plan                                              | Candidate state   |
| `validate_load_plan`      | Validate a stored candidate against hard rules                                       | Candidate state   |
| `stage_load_plan`         | Persist a validated draft as immutable human-review proposal                         | Candidate state   |
| `commit_load_plan`        | Apply an already human-approved proposal exactly as staged                           | Operational state |
| `get_action_ledger`       | Return recent agent, human, and system events                                        | Read only         |

Human approval is intentionally not a WebMCP tool. No `approve_load_plan`,
`approve_proposal`, `human_approve`, or equivalent agent-callable approval mechanism is
registered.

## Why This Matters

Without WebMCP, an agent would need to infer state from visible DOM and click controls.
LoadGuard instead gives the agent explicit planning tools while preventing the same tool
surface from granting approval authority.

```text
Agent can inspect, plan, validate, stage, and request commit.
Agent cannot approve.
Human approval remains a UI-only action.
Database authority decides whether commit is allowed.
```

## Graceful Degradation

The application remains usable in normal browsers. If `document.modelContext` is not
available, LoadGuard shows WebMCP as unavailable while preserving the human UI and server
flows.

## Judge Interaction

The expected WebMCP sequence is:

```text
get_load_state
get_package_constraints
create_load_plan
validate_load_plan
stage_load_plan
commit_load_plan -> APPROVAL_REQUIRED before human approval
```

After the operator approves the exact staged proposal in the UI, the agent can call
`commit_load_plan` with only the proposal id. Duplicate execution returns
`ALREADY_EXECUTED`.
