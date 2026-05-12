# NEXT_ACTION

Add Yahoo Finance earnings provider adapter shell.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Add a server-only Yahoo Finance earnings provider shell for US earnings snapshots.
- Keep it inactive by default and only activate it with `NINE_PROVIDER_MODE=live` plus an explicit earnings provider selection.
- Preserve the current mock provider behavior and API response envelopes.
- Update provider docs and environment docs with the Yahoo Finance earnings activation path and required env.
- Run `npm run typecheck` and `npm run build`.
