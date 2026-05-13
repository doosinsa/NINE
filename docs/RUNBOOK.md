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
NINE_EPS_PROVIDER=finnhub
NINE_EARNINGS_PROVIDER=composite
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
npm run provider:smoke -- --base-url http://127.0.0.1:3000 --suite status
```

The helper defaults to `http://127.0.0.1:3000` and the read-only `status` suite. Non-local targets require an explicit live target acknowledgement:

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
NINE_EPS_PROVIDER=finnhub
FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1
FINNHUB_EPS_FREQ=quarterly
```

Smoke:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/eps/collect" \
  -H 'Content-Type: application/json' \
  -d '{"tickers":["PLTR","NVDA"],"snapshotDate":"2026-05-13"}'
```

Expected: `ok: true`, `providerMode: "live"`, EPS rows with `dataSource: "finnhub"`.

### Earnings

Required env:

```env
NINE_PROVIDER_MODE=live
NINE_EARNINGS_PROVIDER=composite
DART_API_KEY=
DART_BASE_URL=https://opendart.fss.or.kr
DART_CORP_CODE_MAP={"005930":"00126380","000660":"00164779"}
DART_BUSINESS_YEAR=2026
DART_REPORT_CODE=11013
DART_FS_DIV=CFS
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com
YAHOO_FINANCE_QUOTE_SUMMARY_BASE_URL=https://query2.finance.yahoo.com
```

Smoke:

```bash
curl -sS -X POST "$NINE_BASE_URL/api/earnings/collect" \
  -H 'Content-Type: application/json' \
  -d '{"tickers":["005930.KS","PLTR"]}'
```

Expected: `ok: true`, `providerMode: "live"`, KR row with `dataSource: "dart"`, US row with `dataSource: "yahoo-finance"` when provider data is available.

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

Recommended order for provider-backed collection jobs:

1. Daily prices: local collector script or local `POST /api/prices/collect`
2. Weekly EPS snapshots: local collector script or local `POST /api/eps/collect`
3. Quarterly earnings snapshots: local collector script or local `POST /api/earnings/collect`
4. Core briefs after EPS/earnings refresh: local collector script or local `POST /api/briefs/collect`
5. Discover refresh: local collector script or local `GET /api/discover`
6. Notifications only after scoring/brief data is current: local `POST /api/notifications/send`

Use narrow ticker payloads during initial rollout. Move to full-universe payloads only after live smoke tests and persisted row counts look normal.

For long-running operations, prefer scripts such as:

```bash
npm run collect:prices -- --date 2026-05-13 --tickers 005930.KS,PLTR
```

These scripts should load `.env`, call provider adapters, upsert Supabase rows, and send Solapi failure notifications without requiring a public Vercel function.

## Git

After a completed checkpoint:

```bash
git status --short --branch
git add <files>
git commit -m "<message>"
git push
```
