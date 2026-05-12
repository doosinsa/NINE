# NEXT_ACTION

Deploy Discover scoring intake rows to production.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Run `npm run typecheck` and `npm run build`.
- Deploy with `vercel deploy --prod --yes`.
- Smoke test production Discover send-to-Core with a temporary ticker.
- Confirm the temporary ticker creates both `stocks` and `manual_scores`, then remove the test `stocks` row and verify cascade cleanup.
