# NINE API Contract

All API responses use one envelope:

```ts
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

Canonical TypeScript contracts live in `src/types/contracts.ts`.

## Endpoints

### `GET /api/candidates`
Returns the weekly review list.

Response data: `CandidatesResponse`

### `GET /api/stocks/:ticker`
Returns one stock detail with latest score, latest LLM brief, recent EPS snapshots, and the fixed thesis watermark.

Response data: `StockDetailResponse`

### `POST /api/scores/manual`
Saves manual demand/supply scores and optional decision metadata.

Request: `ManualScoreRequest`

Rules:
- `scoreDemand` and `scoreSupply` must be integers from 0 to 3.
- `decision: "buy"` requires `thesisKill1`, `thesisKill2`, and `thesisKill3`.
- A buy decision below 7 points returns a warning but is not blocked.

Response data: `ManualScoreResponse`

### `GET /api/holdings`
Returns holding cards without price movement or chart data.

Response data: `HoldingsResponse`

### `GET /api/quarterly-reviews`
Returns quarterly review progress and saved reviews.

Response data: `QuarterlyReviewsResponse`

Response includes `items`, one per current holding:

```ts
type QuarterlyReviewItem = {
  holding: Holding;
  latestReview: QuarterlyReview | null;
};
```

### `POST /api/quarterly-reviews`
Saves one quarterly review decision.

Request: `QuarterlyReviewRequest`

Rules:
- `killConditionsTriggered` must be an integer from 0 to 3.
- `action` must be `hold`, `reduce_50`, or `sell_all`.

Response data: `QuarterlyReview`

### `GET /api/search?q=:query`
Searches the current universe. If no match exists, `requiresOutsideUniverseAnalysis` is `true`.

Response data: `SearchResponse`

`dailyCap` is counted from `daily_search_log` for the current KST date when Supabase is configured, and falls back to mock usage otherwise.

### `POST /api/search`
Starts outside-universe analysis and consumes the daily ad-hoc search cap.

Request:

```ts
{ ticker: string }
```

Response data: `SearchResponse`

### `GET /api/discover`
Returns this week's Discover themes.

Response data: `DiscoverResponse`

### `POST /api/discover`
Sends selected Discover tickers into Core universe intake.

Request: `DiscoverSendToCoreRequest`

When Supabase is configured, new tickers create both `stocks` rows and default `manual_scores` rows so they can enter the next scoring cycle. Existing tickers are returned as `skippedTickers`.

Response data: `DiscoverSendToCoreResponse`

### `POST /api/prices/collect`
Collects daily OHLCV snapshots through the configured server-only price provider.

Request: `DailyPriceCollectionRequest`

```ts
{
  tickers?: string[];
  date?: string; // YYYY-MM-DD, defaults to current KST date
}
```

When `tickers` is omitted, the route collects the current Supabase `stocks` universe if Supabase is configured, otherwise the mock universe. With `NINE_PROVIDER_MODE=mock`, the route uses mock prices and does not require external provider secrets. When Supabase is configured, collected rows are upserted into `prices`; without Supabase, the response still returns collected mock/provider rows with `persisted: false`.

Response data: `DailyPriceCollectionResponse`

### `POST /api/eps/collect`
Collects weekly consensus EPS snapshots through the configured server-only EPS provider.

Request: `WeeklyEpsCollectionRequest`

```ts
{
  tickers?: string[];
  snapshotDate?: string; // YYYY-MM-DD, defaults to current KST date
}
```

When `tickers` is omitted, the route collects the current Supabase `stocks` universe if Supabase is configured, otherwise the mock universe. With `NINE_PROVIDER_MODE=mock`, the route uses mock EPS estimates and does not require external provider secrets. When Supabase is configured, collected rows are upserted into `eps_estimates`; without Supabase, the response still returns collected mock/provider rows with `persisted: false`.

Response data: `WeeklyEpsCollectionResponse`

### `POST /api/earnings/collect`
Collects quarterly earnings snapshots through the configured server-only earnings provider.

Request: `QuarterlyEarningsCollectionRequest`

```ts
{
  tickers?: string[];
}
```

When `tickers` is omitted, the route collects the current Supabase `stocks` universe if Supabase is configured, otherwise the mock universe. With `NINE_PROVIDER_MODE=mock`, the route uses mock earnings snapshots and does not require external provider secrets. When Supabase is configured, collected rows are upserted into `earnings`; without Supabase, the response still returns collected mock/provider rows with `persisted: false`.

Response data: `QuarterlyEarningsCollectionResponse`

### `POST /api/briefs/collect`
Generates Core LLM briefs through the configured server-only LLM provider.

Request: `CoreBriefCollectionRequest`

```ts
{
  tickers?: string[];
}
```

When `tickers` is omitted, the route uses the current Supabase `stocks` universe if Supabase is configured, otherwise the mock universe. With `NINE_PROVIDER_MODE=mock`, the route uses the mock LLM provider and does not require external provider secrets. When Supabase is configured, generated rows are inserted into `llm_briefs`; without Supabase, the response still returns generated mock/provider rows with `persisted: false`.

Response data: `CoreBriefCollectionResponse`

### `POST /api/auth/login`
Verifies the single app password against `NINE_PASSWORD_HASH`. On success, sets an HTTP-only session cookie protected with `NINE_SESSION_SECRET`.

Request:

```ts
LoginRequest
```

Response data:

```ts
LoginResponse
```
