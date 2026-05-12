# NEXT_ACTION

Add provider operations runbook and live smoke checklist.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Document the provider activation sequence for live API connection.
- Add a live smoke checklist for one provider at a time, including required env, test tickers, rollback to mock mode, and no-secret handling.
- Include the recommended n8n schedule order for collection routes without enabling any live calls.
- Preserve `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without explicit keys and provider selections.
- Run `npm run typecheck` and `npm run build`.
