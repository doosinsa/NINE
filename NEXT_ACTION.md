# NEXT_ACTION

Make impulse search daily cap use real search log.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Replace the hardcoded `/api/search` daily cap count with `daily_search_log` when Supabase is configured.
- Keep mock fallback behavior when Supabase is unavailable.
- Update shared contracts/docs only if response shape changes.
- Smoke test `GET /api/search?q=PLTR` and outside-universe `POST /api/search`.
- Run `npm run typecheck` and `npm run build`.
