# NEXT_ACTION

Add provider status diagnostics page.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Add an authenticated/internal diagnostics UI that reads `GET /api/providers/status`.
- Show provider mode, configured state, missing env names, and purpose without exposing secret values.
- Keep the page calm and mobile-safe; do not add charts or recommendation copy.
- Preserve `NINE_PROVIDER_MODE=mock` as the default and do not run live provider calls.
- Run `npm run typecheck` and `npm run build`.
