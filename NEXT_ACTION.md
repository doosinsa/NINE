# NEXT_ACTION

Deploy actionable quarterly review workflow to production.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Run `npm run typecheck` and `npm run build`.
- Deploy with `vercel deploy --prod --yes`.
- Smoke test production `/api/quarterly-reviews` and `/reviews` with a valid session cookie.
- Verify `/reviews` at 428px width on production.
