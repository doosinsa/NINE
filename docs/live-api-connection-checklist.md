# Live API Connection Checklist

Use this checklist before the first live provider connection. Keep `NINE_PROVIDER_MODE=mock` until the specific provider surface is ready to smoke test.

Do not paste provider secret values into chat, tracked files, screenshots, or shell history notes. Provider keys belong only in local/Mac worker `.env` or Vercel server-side env. For provider collection jobs, prefer the Mac/n8n worker runtime; Vercel production should remain `NINE_PROVIDER_MODE=mock` unless a specific provider has been proven safe from that runtime.

## 1. Account Readiness

Confirm these accounts or access paths before changing production env:

- KIS Developers: app key, app secret, and production base URL for KR daily price collection.
- DART OpenAPI: API key and corporate code mappings for KR tickers to test first.
- Alpha Vantage: API key for replacement US EPS snapshots and US quarterly EPS earnings.
- Finnhub: API key for US EPS snapshots if the account has access to `stock/eps-estimate`.
- NewsAPI or compatible provider: API key for Discover news signals.
- Anthropic: API key and intended Haiku model name for briefs and Discover clustering.
- Solapi: API key, API secret, and verified sender number for LMS notification smoke.
- Yahoo Finance: approved base URL or replacement provider decision for US prices and earnings.
- SEC EDGAR: user-agent email for later US filing/transcript requests.
- KITA: API key or confirmed no-key access pattern for later export signals.

## 2. Server-Only Env Names

Set only the env names needed for the provider being tested. Do not use `NEXT_PUBLIC_*` for provider secrets.

Baseline selectors:

```env
NINE_PROVIDER_MODE=mock
NINE_PRICE_PROVIDER=mock
NINE_EPS_PROVIDER=mock
NINE_EARNINGS_PROVIDER=mock
NINE_DISCOVER_SIGNAL_PROVIDER=mock
NINE_LLM_PROVIDER=mock
NINE_NOTIFICATION_PROVIDER=mock
```

Provider env names:

```env
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_MARKET_DIV_CODE=J
KIS_DAILY_PRICE_TR_ID=FHKST03010100
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com
YAHOO_FINANCE_QUOTE_SUMMARY_BASE_URL=https://query2.finance.yahoo.com
FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1
FINNHUB_EPS_FREQ=quarterly
ALPHA_VANTAGE_API_KEY=
ALPHA_VANTAGE_BASE_URL=https://www.alphavantage.co
DART_API_KEY=
DART_BASE_URL=https://opendart.fss.or.kr
DART_CORP_CODE_MAP=
DART_BUSINESS_YEAR=
DART_REPORT_CODE=11013
DART_FS_DIV=CFS
NEWS_API_KEY=
NEWS_API_BASE_URL=https://newsapi.org
NEWS_API_LANGUAGE=en
NEWS_API_DISCOVER_QUERIES=AI semiconductor,defense electronics,energy infrastructure,robotics automation,biotech platform
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_VERSION=2023-06-01
ANTHROPIC_MAX_TOKENS=1200
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=
SOLAPI_BASE_URL=https://api.solapi.com
SOLAPI_MESSAGE_TYPE=LMS
SOLAPI_COUNTRY=82
SEC_USER_AGENT_EMAIL=
KITA_API_KEY=
```

## 3. Runtime Placement

Use Mac/n8n worker placement for provider collection jobs. The current development MacBook is acceptable for building and smoke testing; move the same repo and `.env` to Mac Mini or another always-on Mac for scheduled operation.

Vercel placement is limited:

- Keep `NINE_PROVIDER_MODE=mock` in Vercel production.
- Do not rely on Vercel production for KIS-backed price collection; KIS token requests returned HTTP 403 from Vercel production runtime during live smoke.
- Vercel can still host UI, auth, status, and Supabase-backed API reads.
- Add live provider secrets to Vercel only when a specific production API surface intentionally needs them and has passed a runtime-specific smoke test.

Mac/n8n worker example for first price smoke:

```env
NINE_PROVIDER_MODE=live
NINE_PRICE_PROVIDER=composite
NINE_EPS_PROVIDER=mock
NINE_EARNINGS_PROVIDER=mock
NINE_DISCOVER_SIGNAL_PROVIDER=mock
NINE_LLM_PROVIDER=mock
NINE_NOTIFICATION_PROVIDER=mock
```

## 4. First Smoke Order

Use small payloads and one provider surface at a time.

1. Status: `npm run provider:smoke -- --base-url "$NINE_BASE_URL" --suite status`
2. Prices: `NINE_PRICE_PROVIDER=composite`, then smoke `prices` with `005930.KS,PLTR`.
3. EPS: prefer `NINE_EPS_PROVIDER=alpha-vantage` unless Finnhub plan access to `stock/eps-estimate` has been confirmed, then smoke `eps` with `PLTR,NVDA`.
4. Earnings: prefer `NINE_EARNINGS_PROVIDER=composite-alpha-vantage` for KR DART + US Alpha Vantage unless Yahoo quoteSummary compatibility has been confirmed, then smoke `earnings` with `005930.KS,PLTR`.
5. Briefs: `NINE_LLM_PROVIDER=anthropic`, then smoke `briefs` with `PLTR`.
6. Discover: `NINE_DISCOVER_SIGNAL_PROVIDER=newsapi`, then smoke `discover`.
7. Notifications: `NINE_NOTIFICATION_PROVIDER=solapi`, then smoke `notifications` only to your own phone number.

For non-local targets, the helper must be called with explicit acknowledgement. Do not use this as the default path for KIS price collection on Vercel production.

```bash
NINE_SMOKE_ALLOW_LIVE=true npm run provider:smoke -- \
  --base-url "$NINE_BASE_URL" \
  --suite prices \
  --date 2026-05-13
```

Notification smoke requires an additional acknowledgement:

```bash
NINE_SMOKE_ALLOW_LIVE=true NINE_SMOKE_ALLOW_NOTIFICATIONS=true npm run provider:smoke -- \
  --base-url "$NINE_BASE_URL" \
  --suite notifications \
  --to 01000000000
```

## 5. Pass Criteria

- `GET /api/providers/status` returns `ok: true`.
- The target provider reports `configured: true` with no secret values in the response.
- Smoke responses keep the `{ ok: true, data }` envelope.
- Smoke responses report `providerMode: "live"` only for the intended live test.
- Persisted row counts look plausible for the small payload.
- Brief copy does not include `AI가 추천`, `성공 가능성 높음`, or `강추`.
- No holding-focused screen shows price movement, portfolio P/L, realtime prices, or charts.

## 6. Rollback

Rollback should be one env edit, followed by redeploy:

```env
NINE_PROVIDER_MODE=mock
```

For a single provider rollback, keep global live mode and set only the failed selector to mock:

```env
NINE_PRICE_PROVIDER=mock
NINE_EPS_PROVIDER=mock
NINE_EARNINGS_PROVIDER=mock
NINE_DISCOVER_SIGNAL_PROVIDER=mock
NINE_LLM_PROVIDER=mock
NINE_NOTIFICATION_PROVIDER=mock
```

After rollback, rerun:

```bash
npm run provider:smoke -- --base-url "$NINE_BASE_URL" --suite status
```

The expected fallback state is `providerMode: "mock"` or the failed provider selector reporting mock behavior again.
