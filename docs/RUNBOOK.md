# NINE Runbook

## Local Checks

```bash
git status --short --branch
npm run typecheck
npm run build
```

## Local Dev

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

If port 3000 is stuck:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill <pid>
```

## Supabase

Load env before CLI commands:

```bash
set -a; . ./.env; set +a
```

Link project:

```bash
set -a; . ./.env; set +a; npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
```

Push migrations:

```bash
set -a; . ./.env; set +a; npx supabase db push
```

Seed linked database:

```bash
set -a; . ./.env; set +a; npx supabase db query --linked --file supabase/seed.sql
```

Check seeded data:

```bash
set -a; . ./.env; set +a; npx supabase db query --linked "select count(*) as stock_count from stocks;"
```

## Vercel

Deploy production:

```bash
vercel deploy --prod --yes
```

List env:

```bash
vercel env ls
```

Production smoke test:

```bash
curl -sS https://nine-red-three.vercel.app/api/candidates | head -c 500
```

## Provider Live Activation

First-time setup checklist: `docs/live-api-connection-checklist.md`.

Default stance:

- Keep `NINE_PROVIDER_MODE=mock` unless a single provider surface is being verified.
- Vercel production stays `NINE_PROVIDER_MODE=mock` for provider collection jobs. Use Vercel for UI/API shell and Supabase reads; run live external collection from a Mac/n8n worker.
- KIS token requests passed locally but returned HTTP 403 from Vercel production runtime, so do not retry KR price collection from Vercel until KIS runtime/IP policy is explicitly resolved.
- Do not paste provider secrets into chat, docs, commits, shell history notes, or screenshots.
- Enable one provider selector at a time. Avoid switching every selector to live in one deploy.
- Use a small ticker set first: `005930.KS`, `000660.KS`, `PLTR`, `NVDA`.
- If a live smoke fails, set the selector back to `mock`, redeploy, and keep the failed provider isolated.

Selector env:

```env
NINE_PROVIDER_MODE=live
NINE_PRICE_PROVIDER=mock
NINE_EPS_PROVIDER=mock
NINE_EARNINGS_PROVIDER=mock
NINE_DISCOVER_SIGNAL_PROVIDER=mock
NINE_LLM_PROVIDER=mock
NINE_NOTIFICATION_PROVIDER=mock
```

Provider selectors:

```env
NINE_PRICE_PROVIDER=composite
NINE_EPS_PROVIDER=alpha-vantage
NINE_EARNINGS_PROVIDER=composite-alpha-vantage
NINE_DISCOVER_SIGNAL_PROVIDER=newsapi
NINE_LLM_PROVIDER=anthropic
NINE_NOTIFICATION_PROVIDER=solapi
```

Roll back a single provider by setting its selector to `mock`, or roll back all external calls with:

```env
NINE_PROVIDER_MODE=mock
```

## Live Smoke Checklist

Run live smoke tests one provider at a time after the relevant env values are present in the target environment.

For provider collection jobs, prefer the Mac/n8n worker target. Vercel production smoke is useful for status/read-only checks, but it is not the primary runtime for KIS-backed collection.

Helper command:

```bash
npm run provider:smoke -- --base-url http://127.0.0.1:3006 --suite status
```

The helper defaults to `http://127.0.0.1:3000`; the launchd mock/status worker uses `http://127.0.0.1:3006` to avoid normal local dev port conflicts. Non-local targets require an explicit live target acknowledgement:

```bash
NINE_SMOKE_ALLOW_LIVE=true npm run provider:smoke -- \
  --base-url https://nine-red-three.vercel.app \
  --suite prices \
  --date 2026-05-13
```

Run multiple suites with a comma list, or `--suite all` for status, prices, EPS, earnings, briefs, and Discover:

```bash
NINE_SMOKE_ALLOW_LIVE=true npm run provider:smoke -- \
  --base-url "$NINE_BASE_URL" \
  --suite prices,eps,earnings,briefs,discover \
  --date 2026-05-13
```

Notification smoke is intentionally separate because it can send a real LMS. It requires both live-target acknowledgement and notification acknowledgement:

```bash
NINE_SMOKE_ALLOW_LIVE=true NINE_SMOKE_ALLOW_NOTIFICATIONS=true npm run provider:smoke -- \
  --base-url "$NINE_BASE_URL" \
  --suite notifications \
  --to 01000000000
```

The helper prints endpoint summaries only. It does not read or print provider secret values.

### Prices

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_PRICE_PROVIDER=composite
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_MARKET_DIV_CODE=J
KIS_DAILY_PRICE_TR_ID=FHKST03010100
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com
```

Smoke:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/prices/collect" \
  -H 'Content-Type: application/json' \
  -d '{"tickers":["005930.KS","PLTR"],"date":"2026-05-13"}'
```

Expected: `ok: true`, `providerMode: "live"`, KR row with `dataSource: "kis"`, US row with `dataSource: "yahoo-finance"`.

### EPS

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_EPS_PROVIDER=alpha-vantage
ALPHA_VANTAGE_API_KEY=
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co
```

Smoke:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/eps/collect" \
  -H 'Content-Type: application/json' \
  -d '{"tickers":["PLTR","NVDA"],"snapshotDate":"2026-05-13"}'
```

Expected: `ok: true`, `providerMode: "live"`, EPS rows with `dataSource: "alpha-vantage"`.

Finnhub remains available through `NINE_EPS_PROVIDER=finnhub`, but the available account currently gets HTTP 403 from `stock/eps-estimate`, so do not enable it until plan access is confirmed.

### Earnings

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_EARNINGS_PROVIDER=composite-alpha-vantage
DART_API_KEY=
DART_BASE_URL=https://opendart.fss.or.kr
DART_CORP_CODE_MAP={"005930":"00126380","000660":"00164779"}
DART_BUSINESS_YEAR=2025
DART_REPORT_CODE=11013
DART_FS_DIV=CFS
ALPHA_VANTAGE_API_KEY=
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co
```

Smoke:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/earnings/collect" \
  -H 'Content-Type: application/json' \
  -d '{"tickers":["005930.KS","PLTR"]}'
```

Expected: `ok: true`, `providerMode: "live"`, KR row with `dataSource: "dart"`, US row with `dataSource: "alpha-vantage"` when provider data is available.

Yahoo Finance remains available through `NINE_EARNINGS_PROVIDER=yahoo-finance` or the legacy `composite` selector, but quoteSummary currently returns HTTP 401 in live smoke. Prefer Alpha Vantage for US earnings until a Yahoo-compatible source is confirmed.

### Briefs

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_VERSION=2023-06-01
ANTHROPIC_MAX_TOKENS=1200
```

Smoke:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/briefs/collect" \
  -H 'Content-Type: application/json' \
  -d '{"tickers":["PLTR"]}'
```

Expected: `ok: true`, `providerMode: "live"`, and no banned copy: `AI가 추천`, `성공 가능성 높음`, `강추`.

### Discover

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_DISCOVER_SIGNAL_PROVIDER=newsapi
NEWS_API_KEY=
NEWS_API_BASE_URL=https://newsapi.org
NEWS_API_LANGUAGE=en
NEWS_API_DISCOVER_QUERIES=AI semiconductor,defense electronics,energy infrastructure,robotics automation,biotech platform
```

Smoke:

```bash
curl -sS "$NINE_BASE_URL/api/discover" | head -c 1000
```

Expected: `ok: true`, existing Discover response envelope preserved.

### Notifications

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_NOTIFICATION_PROVIDER=solapi
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=
SOLAPI_BASE_URL=https://api.solapi.com
SOLAPI_MESSAGE_TYPE=LMS
SOLAPI_COUNTRY=82
```

Smoke only to your own phone number:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/notifications/send" \
  -H 'Content-Type: application/json' \
  -d '{"tier":"tier_3","to":"01000000000","body":"NINE live notification smoke","ticker":"PLTR"}'
```

Expected: `ok: true`, `providerMode: "live"`, `sent: true`, `providerMessageId` present. Roll back to `NINE_NOTIFICATION_PROVIDER=mock` immediately after the first successful test unless notifications are intentionally enabled.

## n8n Schedule Order

Recommended order for provider-backed collection jobs:

The worker can be developed on the MacBook and moved later to Mac Mini. Keep the same repo, `.env`, and command schedule.

Detailed Mac worker workflow commands are in `docs/n8n-mac-worker-schedule.md`.
Ready-to-paste n8n worker API workflow notes are in `ops/n8n/execute-command-workflows.md`.
If `N8N_API_KEY` and `N8N_BASE_URL` are configured in `.env`, register or update the prepared workflows with:

```bash
npm run n8n:register
```

The prepared EPS workflow uses a narrow JSON body, `{"tickers":["PLTR","NVDA"]}`, because Alpha Vantage free-tier EPS collection can fail if the full Supabase universe is requested at once.

### Local Collector Scripts

Run the local Next app on the Mac/n8n worker, then schedule collector commands against that local app. Keep `NINE_PROVIDER_MODE=mock` as the default in `.env`.

Provider selectors are read by the Next worker process. For live collection, start a dedicated worker process with the intended live selector, then point the collector script at that worker's `--base-url`. Setting `NINE_PROVIDER_MODE=live` only on the collector CLI process does not change provider behavior when the worker was started in mock mode.

Example live worker processes:

```bash
NINE_PROVIDER_MODE=live NINE_EPS_PROVIDER=alpha-vantage npm run dev -- --hostname 127.0.0.1 --port 3001
DART_BUSINESS_YEAR=2025 NINE_PROVIDER_MODE=live NINE_EARNINGS_PROVIDER=composite-alpha-vantage npm run dev -- --hostname 127.0.0.1 --port 3002
NINE_PROVIDER_MODE=live NINE_PRICE_PROVIDER=composite npm run dev -- --hostname 127.0.0.1 --port 3003
NINE_PROVIDER_MODE=live NINE_LLM_PROVIDER=anthropic npm run dev -- --hostname 127.0.0.1 --port 3004
NINE_PROVIDER_MODE=live NINE_DISCOVER_SIGNAL_PROVIDER=newsapi NINE_LLM_PROVIDER=anthropic npm run dev -- --hostname 127.0.0.1 --port 3005
```

For persistent Mac worker processes, use the LaunchAgent templates in `ops/launchd/`. Keep `ops/launchd/disabled/com.doo.nine.worker.prices.plist` disabled until KIS collection is re-verified from the Mac worker runtime.

Daily price smoke:

```bash
npm run collect:prices -- --base-url http://127.0.0.1:3000 --tickers 005930.KS,PLTR
```

Live daily price collection from the Mac worker:

```bash
npm run collect:prices -- \
  --base-url http://127.0.0.1:3003 \
  --tickers 005930.KS,PLTR
```

This expects a price live worker already running on port 3003 with `NINE_PROVIDER_MODE=live NINE_PRICE_PROVIDER=composite`.

Weekly EPS smoke:

```bash
npm run collect:eps -- --base-url http://127.0.0.1:3000 --tickers PLTR,NVDA
```

Live weekly EPS collection from the Mac worker:

```bash
npm run collect:eps -- \
  --base-url http://127.0.0.1:3001 \
  --tickers PLTR,NVDA
```

This expects the EPS live worker already running on port 3001 with `NINE_PROVIDER_MODE=live NINE_EPS_PROVIDER=alpha-vantage`.

Quarterly earnings smoke:

```bash
npm run collect:earnings -- --base-url http://127.0.0.1:3000 --tickers 005930.KS,PLTR
```

Live quarterly earnings collection from the Mac worker:

```bash
npm run collect:earnings -- \
  --base-url http://127.0.0.1:3002 \
  --tickers 005930.KS,PLTR
```

This expects the earnings live worker already running on port 3002 with `DART_BUSINESS_YEAR=2025 NINE_PROVIDER_MODE=live NINE_EARNINGS_PROVIDER=composite-alpha-vantage`.

Core brief smoke:

```bash
npm run collect:briefs -- --base-url http://127.0.0.1:3000 --tickers PLTR
```

Safe scheduled Core brief collection from the Mac worker:

```bash
npm run collect:briefs -- \
  --base-url http://127.0.0.1:3006 \
  --tickers PLTR
```

This uses the mock/status worker until Anthropic live auth is fixed. The brief live worker remains available on port 3004 with `NINE_PROVIDER_MODE=live NINE_LLM_PROVIDER=anthropic`, but keep it out of schedules while Anthropic returns HTTP 401.

Discover smoke:

```bash
npm run collect:discover -- --base-url http://127.0.0.1:3000
```

Live Discover collection from the Mac worker:

```bash
npm run collect:discover -- \
  --base-url http://127.0.0.1:3005
```

This expects a Discover live worker already running on port 3005 with `NINE_PROVIDER_MODE=live NINE_DISCOVER_SIGNAL_PROVIDER=newsapi NINE_LLM_PROVIDER=anthropic`.

Notification dispatch smoke:

```bash
NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:notifications -- \
  --base-url http://127.0.0.1:3000 \
  --to 01000000000
```

Collector failure wrapper:

```bash
NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- \
  --to 01000000000 \
  -- npm run collect:prices -- --base-url http://127.0.0.1:3000 --tickers 005930.KS,PLTR
```

Live notification dispatch from the Mac worker:

```bash
NINE_PROVIDER_MODE=live NINE_NOTIFICATION_PROVIDER=solapi NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:notifications -- \
  --base-url http://127.0.0.1:3000 \
  --tier tier_3 \
  --to 01000000000 \
  --body "NINE live notification smoke" \
  --ticker PLTR
```

Do not schedule live notification dispatch until the recipient, tier policy, and Solapi spend guard are intentionally approved. The notification collector always requires `NINE_COLLECT_ALLOW_NOTIFICATIONS=true`, even in mock mode, because the target worker can be running with live Solapi selectors.
The failure wrapper is opt-in and only notifies when `NINE_COLLECT_FAILURE_NOTIFY=true` or `--notify-failure` is used. Leave it off for routine jobs unless you want the Mac/n8n worker to page your own phone number on collector failure.

n8n pattern:

1. Cron node starts the job.
2. HTTP Request node calls the local worker API, such as `POST http://127.0.0.1:3001/api/eps/collect`.
3. Keep failure paging out of these first schedules; add notification workflows separately only after Solapi dispatch is approved.

When `--tickers` is omitted, the API routes use Supabase `stocks` when configured and fall back to mock tickers otherwise. The scripts print only summary counts, persistence status, provider mode, and data source names.

Recommended order for provider-backed collection jobs:

1. Daily prices: local collector script or local `POST /api/prices/collect`
2. Weekly EPS snapshots: local collector script or local `POST /api/eps/collect`
3. Quarterly earnings snapshots: local collector script or local `POST /api/earnings/collect`
4. Core briefs after EPS/earnings refresh: local collector script or local `POST /api/briefs/collect`
5. Discover refresh: local collector script or local `GET /api/discover`
6. Notifications only after scoring/brief data is current: local collector script, failure wrapper, or local `POST /api/notifications/send`

Use narrow ticker payloads during initial rollout. Move to full-universe payloads only after live smoke tests and persisted row counts look normal.

For long-running operations, prefer scripts such as:

```bash
npm run collect:prices -- --date 2026-05-13 --tickers 005930.KS,PLTR
npm run collect:eps -- --snapshot-date 2026-05-13 --tickers PLTR,NVDA
npm run collect:earnings -- --tickers 005930.KS,PLTR
npm run collect:briefs -- --tickers PLTR
npm run collect:discover
NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:notifications -- --to 01000000000
NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to 01000000000 -- npm run collect:discover
```

These scripts should load `.env`, call provider adapters, upsert Supabase rows, and optionally send Solapi failure notifications without requiring a public Vercel function.

## Git

After a completed checkpoint:

```bash
git status --short --branch
git add <files>
git commit -m "<message>"
git push
```
