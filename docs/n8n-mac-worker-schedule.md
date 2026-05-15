# n8n Mac Worker Schedule

Use this note set when moving provider collection from the development MacBook to a Mac Mini or another always-on Mac.

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
NINE_BASE_URL=http://127.0.0.1:3000
NINE_NOTIFICATION_TO=
```

- Run the local app on the worker before n8n jobs execute:

```bash
cd /Users/doo/Development/NINE
npm run dev -- --hostname 127.0.0.1 --port 3000
```

For production-style local operation, run `npm run build` once and keep `npm run start -- --hostname 127.0.0.1 --port 3000` alive with launchd, pm2, or another local process supervisor.

## n8n Pattern

Each workflow uses:

1. Cron node.
2. Execute Command node.
3. Command starts with `cd /Users/doo/Development/NINE`.
4. Command loads `.env` with `set -a; . ./.env; set +a`.
5. Command uses `npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:<job> ...`.

Keep `NINE_COLLECT_FAILURE_NOTIFY=true` only on workflows where a collector failure should page your own phone. Keep `NINE_COLLECT_ALLOW_NOTIFICATIONS=true` only after Solapi live notification behavior has been intentionally approved.

## Daily Prices

Cron:

- KR collection: weekdays after KR market close, for example `10 16 * * 1-5` KST.
- US collection: weekdays after US close, for example `10 7 * * 2-6` KST.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:prices -- --base-url "$NINE_BASE_URL" --tickers 005930.KS,PLTR
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_PRICE_PROVIDER=composite NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:prices -- --base-url "$NINE_BASE_URL"
```

Do not run the live KIS-backed price workflow from Vercel production. KIS token requests returned HTTP 403 from Vercel production runtime.

## Weekly EPS

Cron:

- Weekly, Sunday morning KST, for example `10 10 * * 0`.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:eps -- --base-url "$NINE_BASE_URL" --tickers PLTR,NVDA
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_EPS_PROVIDER=finnhub NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:eps -- --base-url "$NINE_BASE_URL"
```

Finnhub EPS live smoke currently fails with HTTP 403 for `stock/eps-estimate`. Do not enable this workflow until endpoint or plan access is resolved.

## Quarterly Earnings

Cron:

- Quarterly backfill window, for example weekdays at `20 8 * * 1-5` KST during earnings season.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:earnings -- --base-url "$NINE_BASE_URL" --tickers 005930.KS,PLTR
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_EARNINGS_PROVIDER=composite NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:earnings -- --base-url "$NINE_BASE_URL"
```

Use explicit available DART years for smoke or backfill jobs. `DART_BUSINESS_YEAR=2025` passed for Samsung; current-year `2026` Q1 returned OpenDART status `013` during smoke.

## Core Briefs

Cron:

- Weekly after EPS and earnings collectors, for example Sunday `11 10 * * 0` KST.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:briefs -- --base-url "$NINE_BASE_URL" --tickers PLTR
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_LLM_PROVIDER=anthropic NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:briefs -- --base-url "$NINE_BASE_URL"
```

Generated brief copy must not include `AI가 추천`, `성공 가능성 높음`, or `강추`.

## Discover

Cron:

- Weekly after Core review, for example Sunday `20 10 * * 0` KST.

Mock smoke command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:discover -- --base-url "$NINE_BASE_URL"
```

Live command:

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_DISCOVER_SIGNAL_PROVIDER=newsapi NINE_LLM_PROVIDER=anthropic NINE_COLLECT_FAILURE_NOTIFY=true NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:with-failure-notify -- --to "$NINE_NOTIFICATION_TO" -- npm run collect:discover -- --base-url "$NINE_BASE_URL"
```

## Notification Smoke

Run this manually only after recipient, tier policy, and Solapi spend guard are approved.

```bash
cd /Users/doo/Development/NINE
set -a; . ./.env; set +a
NINE_PROVIDER_MODE=live NINE_NOTIFICATION_PROVIDER=solapi NINE_COLLECT_ALLOW_NOTIFICATIONS=true npm run collect:notifications -- --base-url "$NINE_BASE_URL" --to "$NINE_NOTIFICATION_TO" --tier tier_3 --body "NINE live notification smoke" --ticker PLTR
```

Do not put this smoke command on a recurring Cron schedule.
