# NEXT_ACTION

Add the first live provider adapter shell.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Pick the lowest-risk provider surface for a live adapter shell, likely NewsAPI Discover signals.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without keys.
- Preserve the current mock adapter behavior and API response envelopes.
- Update provider docs with the live adapter's required env and activation path.
- Run `npm run typecheck` and `npm run build`.
