# n8n Mac Worker Schedule

Use this note set when moving provider collection from the development MacBook to a Mac Mini or another always-on Mac.

The development MacBook sleeps and is not a reliable scheduler host. Use the MacBook n8n/worker setup for manual verification only; rely on scheduled automation only after moving the repo, `.env`, n8n data/config, and launchd setup to an always-on Mac.

## Worker Prerequisites

- Clone this repo onto the Mac worker.
- Copy the local `.env` onto the Mac worker without committing it.
- Keep `.env` default selectors mocked:

```env
NINE_PROVIDER_MODE=mock
NINE_PRICE_PROVIDER=mock
NINE_EPS_PROVIDER=mock
NINE_EARNINGS_PROVIDER=mock
NINE_DISCOVER_SIGNAL_PROVIDER=mock
NINE_LLM_PROVIDER=mock
NINE_NOTIFICATION_PROVIDER=mock
NINE_BASE_URL=http://127.0.0.1:3006
NINE_NOTIFICATION_TO=
```

- Run the local app on the worker before n8n jobs execute:

```bash
cd /Users/doo/Development/NINE
npm run dev -- --hostname 127.0.0.1 --port 3000
```

For production-style local operation, run `npm run build` once and keep `npm run start -- --hostname 127.0.0.1 --port 3000` alive with launchd, pm2, or another local process supervisor.

Provider selectors are read by the Next worker process, not by the collector CLI process. For live provider jobs, start the worker itself with the intended selector and then point the collector command at that worker. Do not expect `NINE_PROVIDER_MODE=live npm run collect:<job>` to change provider behavior if the worker was started in mock mode.

Recommended worker layout:

```bash
# Default mock/status worker.
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run dev -- --hostname 127.0.0.1 --port 3006

# EPS live worker for Alpha Vantage smoke or scheduled EPS collection.
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_EPS_PROVIDER=alpha-vantage npm run dev -- --hostname 127.0.0.1 --port 3001

# Earnings live worker for DART + Alpha Vantage smoke or scheduled earnings collection.
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
DART_BUSINESS_YEAR=2025 NINE_PROVIDER_MODE=live NINE_EARNINGS_PROVIDER=composite-alpha-vantage npm run dev -- --hostname 127.0.0.1 --port 3002

# Price live worker. Keep disabled until KIS live collection is verified from this runtime.
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_PRICE_PROVIDER=composite npm run dev -- --hostname 127.0.0.1 --port 3003

# Core brief live worker.
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_LLM_PROVIDER=anthropic npm run dev -- --hostname 127.0.0.1 --port 3004

# Discover live worker.
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_DISCOVER_SIGNAL_PROVIDER=newsapi NINE_LLM_PROVIDER=anthropic npm run dev -- --hostname 127.0.0.1 --port 3005
```

For a production-style worker, replace `npm run dev` with `npm run start` after `npm run build`.
LaunchAgent templates for the same profiles live under `ops/launchd/`, with the price worker kept under `ops/launchd/disabled/` until KIS is re-verified from the Mac worker runtime.

## n8n Pattern

Ready-to-paste worker API workflow notes are also collected in `ops/n8n/execute-command-workflows.md`.
When `N8N_API_KEY` and `N8N_BASE_URL` are configured, `npm run n8n:register` creates or updates the prepared workflows through the n8n API without printing the API key.

Each workflow uses:

1. Cron node.
2. HTTP Request node.
3. HTTP Request node calls the corresponding local worker API.

Keep notification/failure paging out of the first schedules. Add it later as a separate workflow only after Solapi live notification behavior is intentionally approved.

## Daily Prices

Cron:

- KR collection: weekdays after KR market close, for example `10 16 * * 1-5` KST.
- US collection: weekdays after US close, for example `10 7 * * 2-6` KST.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:prices -- --base-url "$NINE_BASE_URL" --tickers 005930.KS,PLTR
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:prices -- --base-url http://127.0.0.1:3003
```

This command expects a separate price worker already running with `NINE_PROVIDER_MODE=live NINE_PRICE_PROVIDER=composite` on port 3003. Keep this disabled until KIS live collection has been verified from the Mac worker runtime.

Do not run the live KIS-backed price workflow from Vercel production. KIS token requests returned HTTP 403 from Vercel production runtime.

## Weekly EPS

Cron:

- Weekly, Sunday morning KST, for example `10 10 * * 0`.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:eps -- --base-url "$NINE_BASE_URL" --tickers PLTR,NVDA
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:eps -- --base-url http://127.0.0.1:3001
```

This command expects the EPS live worker already running on port 3001 with `NINE_PROVIDER_MODE=live NINE_EPS_PROVIDER=alpha-vantage`.
For n8n HTTP Request schedules, include a JSON body such as `{"tickers":["PLTR","NVDA"]}`. Do not omit the body for Alpha Vantage EPS until a provider path that can handle broad universe collection is confirmed.
Use Alpha Vantage for the current US EPS live path. Finnhub EPS live smoke currently fails with HTTP 403 for `stock/eps-estimate`; do not enable the Finnhub workflow until endpoint or plan access is resolved.

## Quarterly Earnings

Cron:

- Quarterly backfill window, for example weekdays at `20 8 * * 1-5` KST during earnings season.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:earnings -- --base-url "$NINE_BASE_URL" --tickers 005930.KS,PLTR
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:earnings -- --base-url http://127.0.0.1:3002
```

This command expects the earnings live worker already running on port 3002 with `DART_BUSINESS_YEAR=2025 NINE_PROVIDER_MODE=live NINE_EARNINGS_PROVIDER=composite-alpha-vantage`.
Use explicit available DART years for smoke or backfill jobs. `DART_BUSINESS_YEAR=2025` passed for Samsung; current-year `2026` Q1 returned OpenDART status `013` during smoke.
Use Alpha Vantage for US earnings while Yahoo Finance quoteSummary returns HTTP 401.

## Core Briefs

Cron:

- Weekly after EPS and earnings collectors, for example Sunday `11 10 * * 0` KST.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:briefs -- --base-url "$NINE_BASE_URL" --tickers PLTR
```

Safe scheduled command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:briefs -- --base-url http://127.0.0.1:3006
```

This command uses the mock/status worker until Anthropic live auth is fixed. The brief live worker remains available on port 3004 with `NINE_PROVIDER_MODE=live NINE_LLM_PROVIDER=anthropic`, but keep it out of schedules while Anthropic returns HTTP 401.
Generated brief copy must not include `AI가 추천`, `성공 가능성 높음`, or `강추`.

## Discover

Cron:

- Weekly after Core review, for example Sunday `20 10 * * 0` KST.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:discover -- --base-url "$NINE_BASE_URL"
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- -- npm run collect:discover -- --base-url http://127.0.0.1:3005
```

This command expects a Discover live worker already running on port 3005 with `NINE_PROVIDER_MODE=live NINE_DISCOVER_SIGNAL_PROVIDER=newsapi NINE_LLM_PROVIDER=anthropic`.

## Notification Smoke

Run this manually only after recipient, tier policy, and Solapi spend guard are approved.

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_NOTIFICATION_PROVIDER=solapi NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:notifications -- --base-url "$NINE_BASE_URL" --to "$NINE_NOTIFICATION_TO" --tier tier_3 --body "NINE live notification smoke" --ticker PLTR
```

Do not put this smoke command on a recurring Cron schedule.
