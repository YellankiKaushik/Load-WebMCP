# Repository Agent Guide

Do not rewrite published history: no force pushes, rebases, amendments, or squashes of
commits that may already be pushed.

When changing LoadGuard, preserve the verified product contract:

- exactly seven WebMCP tools
- no human approval WebMCP tool
- deterministic planner and validator behavior
- active/candidate separation
- proposal hash and approved-hash binding
- revision, expiry, session, idempotency, and database authority checks
- Supabase RLS/RPC semantics and service-role boundary

Use Bun and the committed `bun.lock`. Before commits, run:

```sh
bun install --frozen-lockfile
bun run build
bun run typecheck
bun run lint
bun run test
git diff --check
```

Never commit `.env`, secret values, production credentials, or screenshots that reveal
private project settings.
