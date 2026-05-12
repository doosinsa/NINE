# NEXT_ACTION

Add composite KR/US daily price provider wiring.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Add a server-only composite price provider path that can route KR tickers to KIS and US tickers to Yahoo Finance.
- Preserve the current mock price behavior and API response envelopes.
- Update provider docs with the composite price activation path and provider selection rules.
- Run `npm run typecheck` and `npm run build`.
