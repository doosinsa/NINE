# n8n Worker API Workflows

Use these local worker API calls in n8n `HTTP Request` nodes after the launchd workers are running. This avoids relying on `Execute Command`, which may be unavailable in some n8n runtimes.

These workflows can also be registered through the n8n API:

```bash
npm run n8n:register
```

The script reads `N8N_BASE_URL` and `N8N_API_KEY` from `.env`, then creates or updates the workflows without printing the API key.

## Common Pattern

Each workflow uses:

- `Schedule Trigger`
- `HTTP Request`

Keep notification/failure paging disabled for now. These API workflows do not send Solapi notifications.

## Weekly EPS

Cron: Sunday `10 10 * * 0` KST.

HTTP Request: `POST http://127.0.0.1:3001/api/eps/collect`

JSON body:

```json
{"tickers":["PLTR","NVDA"]}
```

Keep the first Alpha Vantage EPS schedule intentionally narrow. The free tier can reject broad universe collection with burst or daily rate-limit messages.

## Quarterly Earnings

Cron: weekdays during earnings season, for example `20 8 * * 1-5` KST.

HTTP Request: `POST http://127.0.0.1:3002/api/earnings/collect`

## Core Briefs

Cron: Sunday after EPS and earnings, for example `11 10 * * 0` KST.

HTTP Request: `POST http://127.0.0.1:3006/api/briefs/collect`

This uses the mock/status worker until Anthropic live auth is fixed. The live brief worker remains available at `http://127.0.0.1:3004`, but it currently returns Anthropic HTTP 401 with the configured key.

## Discover

Cron: Sunday after Core review, for example `20 10 * * 0` KST.

HTTP Request: `GET http://127.0.0.1:3005/api/discover`

## Daily Prices

Keep this workflow disabled until KIS collection is re-verified from the Mac worker runtime.

Cron:

- KR after market close: `10 16 * * 1-5` KST.
- US after close: `10 7 * * 2-6` KST.

HTTP Request: `POST http://127.0.0.1:3003/api/prices/collect`

## Failure Paging

Failure paging is intentionally omitted from these API workflows. Add it later as a separate workflow after Solapi dispatch policy is approved.
