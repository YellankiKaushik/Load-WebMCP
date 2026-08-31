# LoadGuard Mission Control

LoadGuard Mission Control is the implemented visual and interaction system for the redesigned LoadGuard 3D branch. It keeps the verified product contract intact: the agent proposes, the operator approves, and the application/database enforce the operational boundary.

## Design principles

- Make the active truck state obvious before any secondary tooling.
- Treat the human authorization rail as the highest-trust decision area.
- Separate agent activity, human authority, validation state, and database enforcement visually and verbally.
- Keep dense operational data scannable without making every element the same bordered card.
- Preserve the existing WebMCP, planner, validator, authority, session, and Supabase contracts.

## Visual identity

The interface uses a calm industrial control-room language: dark cool neutral canvas, precise bordered surfaces, compact telemetry, and a prominent 3D workspace. The product should feel like a logistics instrumentation surface rather than a landing page or decorative dashboard.

## Semantic color

- Primary / interactive: electric cyan-blue, used for controls, telemetry emphasis, and candidate proposal affordances.
- Agent / AI: violet-blue, used for agent provenance and candidate-state tooling.
- Success: green, used for valid, approved, executed, and loaded states.
- Warning: amber, used for fragile cargo, proposal expiry, and review warnings.
- Danger: red, used for urgent cargo, rejected, expired, failed, and destructive or blocked operations.
- Neutral: cool grays, used for inactive, inbound, metadata, and secondary surfaces.

Candidate proposal rendering is intentionally cyan/agent-blue and wireframe so it cannot be mistaken for green success or approved execution.

## Typography

Barlow is used for product copy, section labels, body text, controls, and decision language. JetBrains Mono is reserved for operational identifiers and measured values such as `TRK-042`, `PLAN-002`, package codes, timestamps, hashes, coordinates, revision numbers, weight, and utilization.

## Spacing

The layout follows an 8px-based rhythm using 4, 8, 12, 16, 24, 32, 40, and 48px steps. Dense operational data uses tighter spacing, while the 3D workspace and decision rail get more breathing room.

## Grid/layout

The page is organized as:

```text
Command header
Metric strip
3D workspace | Human decision rail
Operational tabs
```

On desktop, the truck workspace and decision rail sit side by side. On tablet and mobile, the decision rail stays high in the page order so human authorization is not buried under developer tooling.

## Surfaces

Page canvas uses a restrained grid-like atmosphere. Primary workspace surfaces frame the 3D truck and human decision rail. Secondary operational surfaces contain the manifest, action ledger, and agent interface. Small nested surfaces are used only for metrics, validation details, warnings, and integrity metadata.

## Borders

Borders are low-contrast cool neutrals by default. Authorization and warning regions receive amber borders. Agent regions receive violet-blue borders. Success and hard-rule validation regions use green. Danger regions use red.

## Radii

Major surfaces use approximately 12px radii. Secondary surfaces use approximately 10px. Small controls and chips use 6 to 8px. The system avoids oversized rounded cards.

## Elevation

Elevation is subtle and functional: shallow shadows separate the command header, telemetry, 3D workspace, decision rail, and operational tabs from the background. There are no large decorative glows.

## Status semantics

Status indicators always combine icon, text, and semantic color. Important states include `VALID`, `WARNING`, `BLOCKED`, `DRAFT`, `STAGED`, `APPROVED`, `EXECUTED`, `EXPIRED`, `REJECTED`, `LOADED`, `INBOUND`, `URGENT`, and `FRAGILE`.

## Iconography

The UI uses Lucide icons exclusively. Trucks, packages, agents, humans, shields, clocks, warnings, plugs, and activity symbols reinforce meaning without introducing another icon family.

## Agent identity

Agent identity is represented with violet-blue status treatment, Bot icons, and the phrase "Agent proposal" or "Agent interface." Agent actions can create, validate, stage, and commit only through the existing tool contract.

## Human authority identity

Human authority is represented with amber decision framing, User and ShieldCheck icons, and explicit copy for staged proposals. Approval remains a UI-only human action and is not exposed as a WebMCP tool.

## 3D visualization semantics

Active cargo renders as solid packages. Candidate proposal placements render as translucent cyan wireframes. Fragile cargo uses amber, urgent cargo uses red, and delivery stops retain distinct secondary colors. The rear door remains marked at `x=0`.

## Motion

Motion is limited to short hover, focus, press, and disclosure transitions. The 3D camera does not auto-rotate. A `prefers-reduced-motion: reduce` rule disables non-essential animation and transition duration.

## Accessibility

Statuses are not color-only; each uses icon and label. Buttons have visible focus rings and practical touch targets. Disabled controls retain readable contrast. The manifest supports horizontal scrolling on narrow screens instead of compressing text into unreadable columns.

## Responsive behavior

- 1440x900 and 1280x800: command header, metric strip, large 3D workspace, sticky human decision rail, and operational tabs.
- 1024x768: stacked workspace and decision areas with telemetry still visible.
- 768x1024: tablet-first sequence with proposal decision before lower operational details.
- 390x844: compact header, critical metrics, decision rail, 3D workspace, and scrollable tabs/table.

## Voice and tone

Copy is concise, operational, and trust-centered. Preferred terms include Active load, Candidate proposal, Validation, Review warning, Human authorization, Approved, Operational commit, Executed, Blocked, Expired, Action ledger, and WebMCP.

## Component patterns

- `CommandHeader`: product identity, WebMCP connection state, production status, reset action.
- `MetricStrip`: truck, load, utilization, and weight telemetry.
- `SceneShell`: 3D workspace framing and legend.
- `ProposalPanel`: plan identity, workflow progress, decision summary, validation, authorization, and integrity details.
- `PackageTable`: operational manifest with flags, status, and hover-to-highlight behavior.
- `LedgerPanel`: audit timeline grouped by actor, tool/event, time, result, and summary.
- `McpStatus`: integrated WebMCP tool presentation, including read-only, candidate-state, and operational-state distinctions.
