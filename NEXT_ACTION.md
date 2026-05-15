# NEXT_ACTION

Continue Mac/n8n provider collector hardening with failure notification hooks.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/live-api-connection-checklist.md`, `docs/provider-adapters.md`, and `docs/RUNBOOK.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default.
- Local provider credentials are present; production also has price provider env names, but keep production `NINE_PROVIDER_MODE=mock` for provider collection jobs.
- Production price live rollout was attempted and rolled back: `NINE_PRICE_PROVIDER=composite` failed because KIS token request returned HTTP 403 from Vercel production runtime.
- Before retrying production KR price live, verify whether KIS app credentials allow server-to-server calls from Vercel's US runtime or move the collection job to an approved runtime such as the Mac mini/n8n host.
- PRD now defines Vercel as UI/API shell and Mac/n8n worker as the external provider collection runtime.
- `npm run collect:prices` now exists and was smoke-tested locally with `005930.KS,PLTR`.
- `npm run collect:eps` now exists and was smoke-tested locally with `PLTR,NVDA`.
- `npm run collect:earnings` now exists and was smoke-tested locally with `005930.KS,PLTR`.
- `npm run collect:briefs` now exists and was smoke-tested locally with `PLTR`.
- `npm run collect:discover` now exists and was smoke-tested locally.
- `npm run collect:notifications` now exists and was smoke-tested locally in mock mode. It always requires `NINE_COLLECT_ALLOW_NOTIFICATIONS=true` and `--to` or `NINE_NOTIFICATION_TO`.
- Next implementation target: add safe failure-notification hooks or n8n wrapper guidance around the collector scripts. Keep real Solapi sends gated behind explicit approval/acknowledgement.
- Finnhub EPS live smoke currently fails with HTTP 403 for `stock/eps-estimate`; confirm plan/endpoint access or choose a replacement EPS provider before enabling EPS live.
- Yahoo Finance earnings live smoke currently fails with HTTP 401 on `quoteSummary`; composite earnings now returns available provider results instead of failing the full route, but a replacement/compatible US earnings source is still needed before US earnings live rollout.
- DART single-provider earnings smoke passed with `DART_BUSINESS_YEAR=2025`; current-year `2026` Samsung Q1 returned OpenDART status `013` (no data), so set an explicit available business year for smoke/backfill jobs.
- Solapi notification live smoke passed after explicit user approval; do not send additional real LMS/SMS without renewed approval.
- Price, Anthropic brief, and NewsAPI Discover local live smoke passed.
- Do not include provider secret values in chat, docs, commits, or logs.
