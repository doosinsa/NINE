# NINE Session State

Last updated: 2026-05-11 KST

## Next Action

Connect search and Discover pages to their API routes.

Acceptance criteria:
- Search page uses `/api/search` for universe lookup and outside-universe analysis start.
- Discover page uses `/api/discover` for themes and send-to-Core.
- UI does not invent API fields beyond `src/types/contracts.ts`.
- `npm run typecheck` and `npm run build` pass.

## Current Status

- GitHub repo connected: `https://github.com/doosinsa/NINE.git`
- Current branch: `main`
- Latest pushed commit: `e72983e Implement password auth`
- Vercel project: `nine`
- Production URL: `https://nine-red-three.vercel.app`
- Latest verified deployment: `https://nine-gbj5xte25-doosinsas-projects.vercel.app`
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
