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
- NewsAPI has a live Discover signal adapter shell. It is inactive by default and only replaces the mock Discover signal provider when both `NINE_PROVIDER_MODE=live` and `NINE_DISCOVER_SIGNAL_PROVIDER=newsapi` are set.
- Anthropic has a live LLM adapter shell. It is inactive by default and only replaces the mock LLM provider when both `NINE_PROVIDER_MODE=live` and `NINE_LLM_PROVIDER=anthropic` are set.

## Adapter Surfaces

- `price.fetchDailyPrices`: KIS for KR, Yahoo Finance for US.
- `eps.fetchWeeklyEps`: Naver/Hankyung later for KR, Finnhub for US.
- `earnings.fetchQuarterlyEarnings`: DART for KR, Yahoo Finance/SEC sources for US.
- `llm.generateCoreBrief`: Claude Haiku JSON brief with bear case required.
- `llm.extractDiscoverThemes`: Claude Haiku Discover clustering.
- `discoverSignals.fetchDiscoverSignals`: NewsAPI, KITA export signals, and curated capex signals.
- `notifications.send`: Solapi LMS for tiered alerts and health checks.

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
