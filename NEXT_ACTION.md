# NEXT_ACTION

Add provider live smoke helper script.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Add a local-only helper script or documented npm command for running provider smoke requests with explicit base URL and payloads.
- Keep the helper mock-safe by default and require explicit env to target live provider selectors.
- Do not include or print provider secret values.
- Update `docs/RUNBOOK.md` with usage.
- Run `npm run typecheck` and `npm run build`.
