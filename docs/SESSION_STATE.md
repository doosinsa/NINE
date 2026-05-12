# NINE Session State

Last updated: 2026-05-12 KST

## Next Action

Add the Anthropic LLM provider adapter shell.

Acceptance criteria:
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without keys.
- Add a server-only Anthropic adapter shell for Core briefs and Discover clustering.
- Preserve the current mock LLM behavior and API response envelopes.
- Update provider docs with the Anthropic adapter's required env and activation path.
- Run `npm run typecheck` and `npm run build`.

## Current Status

- GitHub repo connected: `https://github.com/doosinsa/NINE.git`
- Current branch: `main`
- Latest deployed app commit: `e67b3df`
- Vercel project: `nine`
- Production URL: `https://nine-red-three.vercel.app`
- Latest verified deployment: `https://nine-ezp4dfeqv-doosinsas-projects.vercel.app`
- Supabase project linked through CLI.
- Supabase migration applied.
- Supabase seed applied.
- Vercel production env has Supabase URL, anon key, service role key, project ref, `NINE_PASSWORD_HASH`, and `NINE_SESSION_SECRET`.
- API routes now read Supabase first and fall back to mock data.
- External provider adapter interfaces and mock implementations exist under `src/lib/server/providers`.
- `GET /api/discover` now uses the provider adapter fallback path before static mock data.
- NewsAPI Discover signal adapter shell exists, inactive by default.

## Verified

- `npm run typecheck` passed.
- `npm run build` passed.
- Local API smoke tests passed for:
  - `/api/candidates`
  - `/api/stocks/PLTR`
  - `/api/discover`
- Production smoke test passed for:
  - `https://nine-red-three.vercel.app/api/candidates`
- Production auth smoke test passed after deploying `e72983e`:
  - Wrong password returned `401 UNAUTHORIZED`.
  - Correct password returned `200 OK`.
  - `/candidates` without a cookie redirected to `/login`.
  - `/candidates` with the session cookie returned `200 OK`.
- Stock detail decision implementation verified locally:
  - `/api/stocks/PLTR` returned a valid `StockDetailResponse`.
  - Detail page now loads current API score data instead of hardcoded stock data.
  - `Pass`, `Watch`, and `Buy` save through `/api/scores/manual`.
  - Buy modal keeps the 3 Thesis Kill requirement and supports buy date.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- Candidates page API implementation verified locally:
  - `/api/candidates` returned `200 OK`.
  - `/candidates` returned `200 OK` with a valid session cookie.
  - Page now reads `CandidatesResponse` and applies filters client-side.
  - Cards route to API tickers.
- Holdings/reviews API implementation verified locally:
  - `/api/holdings` returned `200 OK`.
  - `/api/quarterly-reviews` returned `200 OK`.
  - `/holdings` returned `200 OK` with a valid session cookie.
  - `/reviews` returned `200 OK` with a valid session cookie.
  - Holding screen remains free of price movement, P/L, realtime prices, and charts.
- Search/Discover API implementation verified locally:
  - `/api/search?q=PLTR` returned `200 OK`.
  - `/api/discover` returned `200 OK`.
  - `/search` returned `200 OK` with a valid session cookie.
  - `/discover` returned `200 OK` with a valid session cookie.
  - Discover send-to-Core POST returned `200 OK` using an existing ticker.
- Production deployment verified after deploying `5358397`:
  - Deployment URL: `https://nine-a93z0eglg-doosinsas-projects.vercel.app`
  - Alias: `https://nine-red-three.vercel.app`
  - Wrong login returned `401`.
  - Correct login returned `200`.
  - `/candidates` without a cookie redirected to `/login`.
  - `/candidates`, `/holdings`, `/reviews`, `/search`, `/discover`, and `/stocks/PLTR` returned `200` with a valid cookie.
  - `/api/candidates`, `/api/holdings`, `/api/quarterly-reviews`, `/api/search?q=PLTR`, and `/api/discover` returned `200`.
- Mobile polish implementation verified locally:
  - Candidate cards, holding cards, and stock detail headers now guard long names/tickers with `min-w-0`, wrapping, and non-shrinking score badges.
  - Stock detail score labels now reserve score width and wrap labels instead of overlapping.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- Mobile polish production deployment verified after deploying `a88d067`:
  - Deployment URL: `https://nine-2j61qs3gk-doosinsas-projects.vercel.app`
  - Alias: `https://nine-red-three.vercel.app`
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - `/candidates`, `/holdings`, and `/stocks/PLTR` returned `200` with a valid production session cookie.
- Mobile polish production visual QA passed at 428px:
  - `/candidates`, `/holdings`, and `/stocks/PLTR` rendered with no viewport overflow.
  - Long names/tickers did not overlap score badges or adjacent text.
  - Stock detail action buttons were confirmed usable after scrolling; buttons ended at `718px`, bottom nav started at `861px`.
  - Screenshots were generated under `/tmp/nine-visual-qa/`.
- MVP gap audit selected the next build slice:
  - PRD Scenario B needs actionable quarterly Thesis Kill review, but `/reviews` currently only renders saved review records.
  - This task does not require new external provider secrets, account login, payment, or destructive changes.
- Actionable quarterly review workflow verified locally:
  - `QuarterlyReviewsResponse` now includes `items`, one per current holding, with the latest review attached.
  - `/reviews` lets each holding set 0-3 triggered Thesis Kill conditions, see the system recommendation, choose Hold/Reduce 50/Sell All, add a note, and save.
  - `/api/quarterly-reviews` GET returned `200`; invalid POST validation returned `400`; authenticated `/reviews` returned `200`.
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - Local 428px visual QA passed for `/reviews`; no viewport overflow, and the save button ended at `728.75px` above bottom nav starting at `861px`.
- Actionable quarterly review workflow production deployment verified after deploying `490c8a7`:
  - Deployment URL: `https://nine-9jai338j9-doosinsas-projects.vercel.app`
  - Alias: `https://nine-red-three.vercel.app`
  - `npm run build` passed; `npm run typecheck` passed after build regenerated `.next/types`.
  - `/api/quarterly-reviews` returned `200` with `items.length = 1`.
  - `/reviews` returned `200` with a valid production session cookie.
  - Production 428px visual QA passed for `/reviews`; no viewport overflow.
  - Production bottom check confirmed save button ended at `728.75px` above bottom nav starting at `861px`.
- Real impulse search daily cap implementation verified locally:
  - `/api/search` now counts `daily_search_log` for the current KST date when Supabase is configured.
  - Supabase-unavailable fallback keeps the existing mock usage behavior.
  - `GET /api/search?q=PLTR` returned `200` with a valid result and daily cap from the log.
  - Outside-universe `POST /api/search` returned `200`, recorded a temporary `NINECAPTEST` log row, and returned `requiresOutsideUniverseAnalysis: true`.
  - The temporary `NINECAPTEST` row was deleted after verification; `GET /api/search?q=PLTR` returned daily cap `0/10` afterward.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- Real impulse search daily cap production deployment verified after deploying `e6aecc3`:
  - Deployment URL: `https://nine-gmf8sddy2-doosinsas-projects.vercel.app`
  - Alias: `https://nine-red-three.vercel.app`
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - Production `GET /api/search?q=PLTR` returned `200`, result present, daily cap `0/10`.
  - Production outside-universe `POST /api/search` with `NINEPRODCAPTEST` returned `200`, daily cap `1/10`, `requiresOutsideUniverseAnalysis: true`.
  - The temporary `NINEPRODCAPTEST` row was deleted; `GET /api/search?q=PLTR` returned daily cap `0/10` afterward.
- Discover scoring intake implementation verified locally:
  - `POST /api/discover` now checks existing tickers from Supabase `stocks` when Supabase is configured.
  - New Discover tickers create both `stocks` and default `manual_scores` rows.
  - Supabase-unavailable fallback keeps mock existing ticker behavior.
  - Existing ticker `PLTR` returned as skipped.
  - Temporary ticker `NINEDISCOTEST` returned as added, then `/api/stocks/NINEDISCOTEST` returned `200` with `source: discover`, `totalScore: 0`, and `decision: watch`.
  - `/api/candidates` handled the temporary intake ticker.
  - Temporary `NINEDISCOTEST` `stocks` row was deleted; `manual_scores` was verified deleted by cascade.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- Discover scoring intake production deployment verified after deploying `e67b3df`:
  - Deployment URL: `https://nine-ezp4dfeqv-doosinsas-projects.vercel.app`
  - Alias: `https://nine-red-three.vercel.app`
  - `npm run build` passed; `npm run typecheck` passed after build regenerated `.next/types`.
  - Production `POST /api/discover` with temporary ticker `NINEPRODDISCOTEST` returned `200` with the ticker in `addedTickers`.
  - Production `/api/stocks/NINEPRODDISCOTEST` returned `200` with `source: discover`, `totalScore: 0`, `decision: watch`, and watermark `이 점수는 prep이지 신탁이 아님`.
  - Supabase `stocks` and `manual_scores` rows were created for the temporary ticker.
  - Temporary `NINEPRODDISCOTEST` `stocks` row was deleted; `manual_scores` was verified deleted by cascade.
- External provider adapter scaffold verified locally:
  - Added server-only provider contracts for prices, EPS, earnings, Claude briefs, Discover signals, and Solapi notifications.
  - Added mock provider implementations so live keys are not required yet.
  - Added provider configuration/status helpers with `NINE_PROVIDER_MODE=mock` default behavior.
  - Updated `.env.example` and `docs/ENVIRONMENT.md` with provider placeholders only, no secrets.
  - Added `docs/provider-adapters.md` documenting required live provider accounts and env values.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- Provider adapter wiring verified locally:
  - `GET /api/discover` now reads Supabase first, then `createExternalProviders()` mock Discover signals and mock Claude-style clustering, then static mock data as a final fallback.
  - Existing `DiscoverResponse` envelope and fields were preserved.
  - Local `GET /api/discover` returned `200`.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- NewsAPI Discover signal adapter shell verified locally:
  - Added a server-only NewsAPI `/v2/everything` adapter shell for Discover signals.
  - The adapter is inactive by default and only activates with `NINE_PROVIDER_MODE=live` plus `NINE_DISCOVER_SIGNAL_PROVIDER=newsapi`.
  - Added `NEWS_API_BASE_URL`, `NEWS_API_LANGUAGE`, and `NEWS_API_DISCOVER_QUERIES` placeholders.
  - Updated provider docs with the activation path.
  - Local `GET /api/discover` returned `200` with existing response envelope.
  - `npm run typecheck` passed.
  - `npm run build` passed.
- Auth implementation verified locally with temporary env values:
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - Wrong password returned `401 UNAUTHORIZED`.
  - Correct password returned `200 OK` and set `nine_session` as HTTP-only.
  - `/candidates` without a cookie redirected to `/login`.
  - `/candidates` with the session cookie returned `200 OK`.

## Important Notes

- `.env` exists locally and is ignored by git.
- `.vercelignore` excludes `.env` from CLI deployments.
- `NEXT_PUBLIC_SUPABASE_URL` must be the Supabase origin only, not `/rest/v1`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to client code.
- Vercel preview env is not fully configured; production and development Supabase envs are present.
- `/api/auth/login` now verifies `NINE_PASSWORD_HASH` using scrypt format `scrypt:N:r:p:salt:key`.
- Successful login sets an HTTP-only `nine_session` cookie signed with `NINE_SESSION_SECRET`.
- `(main)` app routes redirect unauthenticated requests to `/login`.
- Local `.env` auth values are configured and ignored by git.
- Current local/prod login password was set during the session; do not write the plain password into tracked docs.

## Resume Protocol

When the user says `다음 작업 이어가자`, read this file and `NEXT_ACTION.md`, then continue the next action without asking for restatement.
