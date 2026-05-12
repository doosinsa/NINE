# NINE Environment

Do not put secret values in this file.

## Local `.env`

Required now:

```env
SUPABASE_PROJECT_REF=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
```

Required for next auth task:

```env
NINE_PASSWORD_HASH=
NINE_SESSION_SECRET=
```

`NINE_PASSWORD_HASH` uses:

```txt
scrypt:N:r:p:salt:key
```

Generate a local value with:

```sh
node -e "const { randomBytes, scryptSync } = require('node:crypto'); const password = process.argv[1]; const n = 16384, r = 8, p = 1; const salt = randomBytes(16); const key = scryptSync(password, salt, 32, { N: n, r, p, maxmem: 64 * 1024 * 1024 }); console.log(['scrypt', n, r, p, salt.toString('base64url'), key.toString('base64url')].join(':'));" 'replace-with-password'
```

Generate `NINE_SESSION_SECRET` with:

```sh
openssl rand -base64 32
```

Provider adapter mode:

```env
NINE_PROVIDER_MODE=mock
NINE_PRICE_PROVIDER=mock
NINE_DISCOVER_SIGNAL_PROVIDER=mock
NINE_LLM_PROVIDER=mock
NINE_EPS_PROVIDER=mock
NINE_EARNINGS_PROVIDER=mock
NINE_NOTIFICATION_PROVIDER=mock
```

Use `mock` until provider accounts are ready. `live` should only be enabled for a provider surface after that surface has a live adapter and its required env values are configured.

Future provider keys and settings:

```env
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_VERSION=2023-06-01
ANTHROPIC_MAX_TOKENS=1200
KIS_APP_KEY=
KIS_APP_SECRET=
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_MARKET_DIV_CODE=J
KIS_DAILY_PRICE_TR_ID=FHKST03010100
DART_API_KEY=
DART_BASE_URL=https://opendart.fss.or.kr
DART_CORP_CODE_MAP=
DART_BUSINESS_YEAR=
DART_REPORT_CODE=11013
DART_FS_DIV=CFS
FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1
FINNHUB_EPS_FREQ=quarterly
NEWS_API_KEY=
NEWS_API_BASE_URL=https://newsapi.org
NEWS_API_LANGUAGE=en
NEWS_API_DISCOVER_QUERIES=AI semiconductor,defense electronics,energy infrastructure,robotics automation,biotech platform
KITA_API_KEY=
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=
SOLAPI_BASE_URL=https://api.solapi.com
SOLAPI_MESSAGE_TYPE=LMS
SOLAPI_COUNTRY=82
SEC_USER_AGENT_EMAIL=
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com
```

## Vercel Production Env

Already configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `NINE_PASSWORD_HASH`
- `NINE_SESSION_SECRET`

Needed before live external provider calls:

- `NINE_PROVIDER_MODE=live`
- `NINE_PRICE_PROVIDER=composite` for KR and US prices together, or `kis`/`yahoo-finance` for a single price surface
- `NINE_DISCOVER_SIGNAL_PROVIDER=newsapi`
- `NINE_LLM_PROVIDER=anthropic`
- `NINE_EPS_PROVIDER=finnhub`
- `NINE_EARNINGS_PROVIDER=dart`
- `NINE_NOTIFICATION_PROVIDER=solapi`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_VERSION`
- `ANTHROPIC_MAX_TOKENS`
- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_BASE_URL`
- `KIS_MARKET_DIV_CODE`
- `KIS_DAILY_PRICE_TR_ID`
- `DART_API_KEY`
- `DART_BASE_URL`
- `DART_CORP_CODE_MAP`
- `DART_BUSINESS_YEAR`
- `DART_REPORT_CODE`
- `DART_FS_DIV`
- `FINNHUB_API_KEY`
- `FINNHUB_BASE_URL`
- `FINNHUB_EPS_FREQ`
- `NEWS_API_KEY`
- `NEWS_API_BASE_URL`
- `NEWS_API_LANGUAGE`
- `NEWS_API_DISCOVER_QUERIES`
- `KITA_API_KEY`
- `SOLAPI_API_KEY`
- `SOLAPI_API_SECRET`
- `SOLAPI_SENDER`
- `SOLAPI_BASE_URL`
- `SOLAPI_MESSAGE_TYPE`
- `SOLAPI_COUNTRY`
- `SEC_USER_AGENT_EMAIL`
- `YAHOO_FINANCE_BASE_URL`

## URL Format

`NEXT_PUBLIC_SUPABASE_URL` must be:

```txt
https://<project-ref>.supabase.co
```

It must not include `/rest/v1`.
