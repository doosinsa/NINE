# NEXT_ACTION

Deploy real impulse search daily cap to production.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Run `npm run typecheck` and `npm run build`.
- Deploy with `vercel deploy --prod --yes`.
- Smoke test production `GET /api/search?q=PLTR`.
- Smoke test production outside-universe `POST /api/search` using a temporary ticker, then remove that test row from `daily_search_log`.
