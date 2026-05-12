# NEXT_ACTION

Wire provider adapters into API workflows.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Use `createExternalProviders()` in the next mock-backed workflow where it reduces direct mock-data coupling.
- Keep `NINE_PROVIDER_MODE=mock` as the default; do not make live external calls yet.
- Preserve existing response envelopes and UI contracts.
- Run `npm run typecheck` and `npm run build`.
