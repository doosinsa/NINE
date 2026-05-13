# NEXT_ACTION

Prepare first live API connection checklist.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md` and `docs/RUNBOOK.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default.
- Do not run live provider calls until the user confirms the needed provider accounts and server-only env values are ready.
- Add a concise checklist for the user's pre-live API setup steps: provider accounts, key names, Vercel env placement, selector order, first smoke order, rollback.
- Do not include provider secret values.
- Update `docs/SESSION_STATE.md` with the handoff.
- Run `npm run typecheck` and `npm run build`.
