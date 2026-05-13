# NEXT_ACTION

Wait for live API credential readiness.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/live-api-connection-checklist.md`, `docs/provider-adapters.md`, and `docs/RUNBOOK.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default.
- Do not run live provider calls until the user confirms provider accounts and server-only env values are ready.
- If credentials are not ready, pause live activation and ask the user to complete the checklist.
- If credentials are ready, add only the selected provider env values to the target environment and smoke one provider surface at a time.
- Do not include provider secret values in chat, docs, commits, or logs.
