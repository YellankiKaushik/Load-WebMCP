# Design System

LoadGuard uses the V2.2 **Operations Studio** interface: a light, professional logistics
application shell with a dark 3D visualization viewport and a clear human decision rail.

## Principles

- Make the truck, current load, and 3D state immediately visible.
- Keep the human authorization rail beside the 3D workspace on desktop.
- Show WebMCP as an integrated product capability, not a developer console.
- Use whitespace, hierarchy, and light surfaces before adding borders.
- Preserve the verified WebMCP, planner, validator, authority, session, and Supabase contracts.

## Visual Language

- Main shell: light neutral background.
- Primary surfaces: white cards with subtle borders.
- Accent: product blue for primary actions and progress.
- Candidate plan: cyan wireframe in the 3D viewport.
- Success: green for valid, approved, executed, and loaded.
- Warning: amber for review warnings and fragile cargo.
- Danger: red for urgent, rejected, expired, failed, or blocked states.

The 3D viewport may remain dark for contrast, but the application shell is not dark mode.

## Typography

Human-readable UI uses a conventional sans-serif stack. Monospace is reserved for
identifiers and machine-facing strings such as `TRK-042`, `MED-901`, `PLAN-002`, tool
names, hashes, UUIDs, timestamps, coordinates, and revision values.

## Layout

Desktop layout:

```text
Top product header
Workspace title
KPI strip
3D load visualization | Human decision rail
Manifest / Activity / WebMCP tabs
```

At desktop and laptop widths, the 3D visualization remains dominant and the decision rail
stays beside it. Tablet/mobile widths stack intentionally, with human decision content
kept before lower-priority detail tabs.

## Component Patterns

- `CommandHeader`: product identity, WebMCP state, subtle local environment badge, reset action.
- `MetricStrip`: loaded packages, utilization, and weight.
- `SceneShell`: 3D workspace frame, legend, active/candidate status, rear-door orientation.
- `ProposalPanel`: proposal status, plan summary, validation, lifecycle, authorization, and integrity details.
- `PackageTable`: logistics manifest with destination, stop, weight, handling, and status.
- `LedgerPanel`: human-readable audit feed with technical metadata secondary.
- `McpStatus`: compact WebMCP capability list and approval-boundary note.
- `AgentConsole`: visually secondary local demonstration tools.

## Interaction Semantics

Active cargo renders as solid packages. Candidate placements render as translucent cyan
wireframes. Approval controls remain human UI controls. WebMCP tools can inspect, plan,
validate, stage, and commit an approved proposal, but they cannot approve.
