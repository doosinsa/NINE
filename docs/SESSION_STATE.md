# NINE Session State

Last updated: 2026-05-12 KST

## Next Action

Run production mobile visual QA for the deployed text-overlap polish.

Acceptance criteria:
- Verify `/candidates`, `/holdings`, and `/stocks/PLTR` at 428px width.
- Confirm long ticker/name text does not overlap score badges or adjacent content.
- Fix and redeploy if visual overlap remains.

## Current Status

- GitHub repo connected: `https://github.com/doosinsa/NINE.git`
- Current branch: `main`
- Latest pushed commit: `a88d067`
- Vercel project: `nine`
- Production URL: `https://nine-red-three.vercel.app`
- Latest verified deployment: `https://nine-2j61qs3gk-doosinsas-projects.vercel.app`
- Supabase project linked through CLI.
- Supabase migration applied.
- Supabase seed applied.
- Vercel production env has Supabase URL, anon key, service role key, project ref, `NINE_PASSWORD_HASH`, and `NINE_SESSION_SECRET`.
- API routes now read Supabase first and fall back to mock data.

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
