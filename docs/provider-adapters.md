# External Provider Adapters

NINE keeps provider calls behind server-only adapters. API routes and UI code should not call KIS, DART, Finnhub, Yahoo Finance, NewsAPI, KITA, Anthropic, SEC EDGAR, or Solapi directly.

Canonical entry point:

```ts
import { createExternalProviders } from "@/lib/server/providers";
```

## Current Mode

`NINE_PROVIDER_MODE=mock` is the supported mode today.

Mock adapters return stable local data so route handlers can be wired without external accounts, secrets, network calls, payment, or provider rate-limit risk.

`NINE_PROVIDER_MODE=live` intentionally throws until live adapters are implemented and required env values are present.

## Current Wiring

- `GET /api/discover` reads Supabase first, then falls back to `createExternalProviders()` for mock Discover signals and mock Claude-style clustering, then falls back to static mock data if provider initialization fails.
- KIS has a live KR daily price adapter shell. It is inactive by default and only replaces the mock price provider when both `NINE_PROVIDER_MODE=live` and `NINE_PRICE_PROVIDER=kis` are set.
- Yahoo Finance has a live US daily price adapter shell. It is inactive by default and only replaces the mock price provider when both `NINE_PROVIDER_MODE=live` and `NINE_PRICE_PROVIDER=yahoo-finance` are set.
- NewsAPI has a live Discover signal adapter shell. It is inactive by default and only replaces the mock Discover signal provider when both `NINE_PROVIDER_MODE=live` and `NINE_DISCOVER_SIGNAL_PROVIDER=newsapi` are set.
- Anthropic has a live LLM adapter shell. It is inactive by default and only replaces the mock LLM provider when both `NINE_PROVIDER_MODE=live` and `NINE_LLM_PROVIDER=anthropic` are set.
- Finnhub has a live EPS adapter shell. It is inactive by default and only replaces the mock EPS provider when both `NINE_PROVIDER_MODE=live` and `NINE_EPS_PROVIDER=finnhub` are set.

## Adapter Surfaces

- `price.fetchDailyPrices`: KIS for KR, Yahoo Finance for US.
- `eps.fetchWeeklyEps`: Naver/Hankyung later for KR, Finnhub for US.
- `earnings.fetchQuarterlyEarnings`: DART for KR, Yahoo Finance/SEC sources for US.
- `llm.generateCoreBrief`: Claude Haiku JSON brief with bear case required.
- `llm.extractDiscoverThemes`: Claude Haiku Discover clustering.
- `discoverSignals.fetchDiscoverSignals`: NewsAPI, KITA export signals, and curated capex signals.
- `notifications.send`: Solapi LMS for tiered alerts and health checks.

## KIS Daily Price Shell

Activation env:

```env
NINE_PROVIDER_MODE=live
NINE_PRICE_PROVIDER=kis
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_MARKET_DIV_CODE=J
KIS_DAILY_PRICE_TR_ID=FHKST03010100
```

The shell uses KIS `POST /oauth2/tokenP` for an access token, then `GET /uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice` with `FID_COND_MRKT_DIV_CODE`, `FID_INPUT_ISCD`, `FID_INPUT_DATE_1`, `FID_INPUT_DATE_2`, `FID_PERIOD_DIV_CODE=D`, and `FID_ORG_ADJ_PRC=1`. It maps `output2` OHLCV fields into NINE `DailyPrice` rows with `source: "kis"`.

This adapter only accepts KR ticker codes that normalize to six digits, including forms like `005930`, `005930.KS`, and `005930.KQ`. US price collection remains a separate Yahoo Finance provider surface.

## Yahoo Finance Daily Price Shell

Activation env:

```env
NINE_PROVIDER_MODE=live
NINE_PRICE_PROVIDER=yahoo-finance
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com
```

The shell uses Yahoo Finance chart responses from `GET /v8/finance/chart/{symbol}` with `period1`, `period2`, `interval=1d`, `events=history`, and `includeAdjustedClose=true`. It maps quote arrays into NINE `DailyPrice` rows with `source: "yahoo-finance"`.

This adapter skips KR ticker formats and accepts US symbols such as `PLTR`, `NVDA`, and class-share inputs like `BRK.B`, which are normalized to Yahoo's `BRK-B` request format. Yahoo Finance is a configurable external source surface, not a client-side dependency; keep replacement-provider decisions isolated inside this adapter.

## NewsAPI Shell

Activation env:

```env
NINE_PROVIDER_MODE=live
NINE_DISCOVER_SIGNAL_PROVIDER=newsapi
NEWS_API_KEY=
NEWS_API_BASE_URL=https://newsapi.org
NEWS_API_LANGUAGE=en
NEWS_API_DISCOVER_QUERIES=AI semiconductor,defense electronics,energy infrastructure,robotics automation,biotech platform
```

The shell uses NewsAPI `/v2/everything` with `X-Api-Key`, `q`, `from`, `to`, `language`, `sortBy=publishedAt`, and `pageSize=20`. It maps article counts into a rough news signal and does not attempt stock recommendation or ticker extraction. KITA export signals and Claude theme clustering remain separate adapter surfaces.

## Anthropic Shell

Activation env:

```env
NINE_PROVIDER_MODE=live
NINE_LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_VERSION=2023-06-01
ANTHROPIC_MAX_TOKENS=1200
```

The shell uses Anthropic Messages API `POST /v1/messages` with `x-api-key`, `anthropic-version`, and JSON request/response bodies. It asks for JSON-only output and parses that into existing `LlmBrief` and `DiscoverTheme` contracts. Prompts explicitly preserve NINE's non-recommendation stance and banned copy rules.

## Finnhub EPS Shell

Activation env:

```env
NINE_PROVIDER_MODE=live
NINE_EPS_PROVIDER=finnhub
FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1
FINNHUB_EPS_FREQ=quarterly
```

The shell uses Finnhub `GET /stock/eps-estimate` with `symbol` and `freq`. It maps Finnhub `epsAvg` into NINE's `EpsEstimate.consensus`, `numberAnalysts` into `analystCount`, and keeps `dataSource: "finnhub"`. It skips non-US ticker formats such as `.KS` and `.KQ`; KR EPS remains a separate Naver/Hankyung/KR provider surface.

## Required Before Live Calls

- KIS Developers app key/secret and base URL.
- DART OpenAPI key.
- Finnhub API key.
- NewsAPI or compatible news provider key.
- KITA export data API key or confirmed no-key access pattern.
- Anthropic API key and model name.
- Solapi API key/secret and sender.
- SEC EDGAR user-agent email.
- Yahoo Finance base URL or replacement provider policy decision.

Keep all secrets server-only. Do not add provider keys to `NEXT_PUBLIC_*`.
