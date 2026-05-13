# NEXT_ACTION

Add provider status API endpoint.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without an explicit live provider selection.
- Add a server-only API route that reports provider mode and provider env readiness without exposing secret values.
- Use `getProviderStatuses()` and keep response envelopes stable.
- Document the endpoint in `docs/api-contract.md` and `docs/provider-adapters.md`.
- Preserve `NINE_PROVIDER_MODE=mock` as the default and do not run live provider calls.
- Run `npm run typecheck` and `npm run build`.
