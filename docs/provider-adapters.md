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

## Adapter Surfaces

- `price.fetchDailyPrices`: KIS for KR, Yahoo Finance for US.
- `eps.fetchWeeklyEps`: Naver/Hankyung later for KR, Finnhub for US.
- `earnings.fetchQuarterlyEarnings`: DART for KR, Yahoo Finance/SEC sources for US.
- `llm.generateCoreBrief`: Claude Haiku JSON brief with bear case required.
- `llm.extractDiscoverThemes`: Claude Haiku Discover clustering.
- `discoverSignals.fetchDiscoverSignals`: NewsAPI, KITA export signals, and curated capex signals.
- `notifications.send`: Solapi LMS for tiered alerts and health checks.

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
