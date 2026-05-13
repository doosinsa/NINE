# NEXT_ACTION

Resolve remaining live provider smoke blockers.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/live-api-connection-checklist.md`, `docs/provider-adapters.md`, and `docs/RUNBOOK.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default.
- Local provider credentials are present; keep production `NINE_PROVIDER_MODE=mock` until local blockers are resolved.
- Finnhub EPS live smoke currently fails with HTTP 403 for `stock/eps-estimate`; confirm plan/endpoint access or choose a replacement EPS provider before enabling EPS live.
- Yahoo Finance earnings live smoke currently fails with HTTP 401 on `quoteSummary`; composite earnings now returns available provider results instead of failing the full route, but a replacement/compatible US earnings source is still needed before US earnings live rollout.
- DART single-provider earnings smoke passed with `DART_BUSINESS_YEAR=2025`; current-year `2026` Samsung Q1 returned OpenDART status `013` (no data), so set an explicit available business year for smoke/backfill jobs.
- Solapi notification live smoke passed after explicit user approval; do not send additional real LMS/SMS without renewed approval.
- Price, Anthropic brief, and NewsAPI Discover local live smoke passed.
- Do not include provider secret values in chat, docs, commits, or logs.
