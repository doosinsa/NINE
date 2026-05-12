# NEXT_ACTION

Add mock-first weekly EPS collection route.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Add a server-only API route or handler path that collects weekly EPS snapshots through `createExternalProviders().eps`.
- Persist collected EPS estimates to Supabase when configured, with mock fallback behavior when Supabase is unavailable.
- Preserve the current mock provider behavior and API response envelopes.
- Update API/provider docs with the EPS collection route, request shape, and mock/live activation behavior.
- Run `npm run typecheck` and `npm run build`.
