# NEXT_ACTION

Make Discover send-to-Core create scoring intake rows.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Update `POST /api/discover` so Supabase mode checks existing stocks from the database, not mock data.
- When adding new Discover tickers, create both `stocks` and default `manual_scores` rows so detail/candidates APIs can handle the intake.
- Preserve mock fallback behavior when Supabase is unavailable.
- Smoke test Discover send-to-Core with a temporary ticker, then remove any test rows.
- Run `npm run typecheck` and `npm run build`.
