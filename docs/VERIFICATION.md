# Verification

Production URL:

```text
https://webmcp-openai.kaushikyellanki.workers.dev/
```

## Production Baseline

Verified baseline fixture:

```text
TRK-042
revision 1
8/9 loaded
75.6% utilization
993/1200 kg
MED-901 inbound
active validation VALID
3D scene working
```

## WebMCP Discovery

Production was opened in a WebMCP-capable browser. The page reported tools registered on
`document.modelContext`.

Verified tool count: 7

```text
get_load_state
get_package_constraints
create_load_plan
validate_load_plan
stage_load_plan
commit_load_plan
get_action_ledger
```

No approval tool was exposed.

## Production Judge Flow

The production WebMCP planning flow was verified:

```text
get_load_state
get_package_constraints
create_load_plan
validate_load_plan
stage_load_plan
```

Verified staged proposal evidence:

```text
Plan code: PLAN-002
Proposal id: a75f4db6-b1d2-4824-aa7c-7ad8f3677600
Status before approval: STAGED
Target placements: 9/9
Validation: valid
Hard violations: 0
Total weight: 1011 kg
Utilization: 78.4%
Warnings: FRAGILE_ELEVATED PKG-106, FRAGILE_ELEVATED MED-901
```

Before approval, `commit_load_plan` returned:

```text
ok: false
code: APPROVAL_REQUIRED
status: STAGED
```

Active state remained:

```text
8/9 loaded
MED-901 INBOUND
revision 1
```

After human approval through the UI, WebMCP commit returned:

```text
ok: true
status: EXECUTED
state_revision: 2
```

Final active state:

```text
9 placements applied
9/9 loaded
MED-901 loaded = true
MED-901 position = x=115, y=95, z=0
revision 2
1011 kg
78.4%
active validation valid
hard violations 0
```

A second commit attempt returned:

```text
ok: false
code: ALREADY_EXECUTED
status: EXECUTED
items_applied: 9
```

No additional active mutation occurred.

## Quality Gate

Final checks:

```text
bun install --frozen-lockfile  PASS
bun run build                  PASS
bun run typecheck              PASS
bun run lint                   PASS, 0 errors
bun run test                   PASS, 28 tests
git diff --check               PASS
```

The lint run retains five known Fast Refresh warnings in shadcn-style UI helper files.

## Responsive QA

The V2.2 responsive hotfix was verified on production at:

```text
1440x900  PASS
1280x800  PASS
1180x800  PASS
1100x800  PASS
1024x768  PASS
390x844   PASS
```

At `1180x800`, the 3D visualization and human decision rail remain side by side with no
horizontal overflow.

## Secret Safety

`.env` is ignored and untracked. Tracked files contain no real Supabase service-role key,
Cloudflare token, or private credential.
