# NINE Session State

Last updated: 2026-05-10 KST

## Next Action

Implement real password login using `NINE_PASSWORD_HASH` and `NINE_SESSION_SECRET`.

Acceptance criteria:
- `/api/auth/login` verifies a password against `NINE_PASSWORD_HASH`.
- Successful login sets an HTTP-only session cookie signed or protected with `NINE_SESSION_SECRET`.
- App routes can distinguish authenticated and unauthenticated requests.
- Placeholder auth response is removed.
- `npm run typecheck` and `npm run build` pass.

## Current Status

- GitHub repo connected: `https://github.com/doosinsa/NINE.git`
- Current branch: `main`
- Latest pushed commit: `48e3761 Connect APIs to Supabase`
- Vercel project: `nine`
- Production URL: `https://nine-red-three.vercel.app`
- Latest verified deployment: `https://nine-4v88pj0na-doosinsas-projects.vercel.app`
- Supabase project linked through CLI.
- Supabase migration applied.
- Supabase seed applied.
- Vercel production env has Supabase URL, anon key, service role key, and project ref.
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

## Important Notes

- `.env` exists locally and is ignored by git.
- `.vercelignore` excludes `.env` from CLI deployments.
- `NEXT_PUBLIC_SUPABASE_URL` must be the Supabase origin only, not `/rest/v1`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to client code.
- Vercel preview env is not fully configured; production and development Supabase envs are present.
- `/api/auth/login` is still placeholder and must be implemented before real use.

## Resume Protocol

When the user says `다음 작업 이어가자`, read this file and `NEXT_ACTION.md`, then continue the next action without asking for restatement.
