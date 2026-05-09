# NINE Agent Guide

Read `prd.md` before changing behavior. NINE is a personal investment prep tool, not a recommendation engine.

## Non-Negotiables
- Do not add automated trading, backtesting, realtime price alerts, technical charting, social sharing, or SaaS/multi-user features.
- Do not show price movement, portfolio P/L, realtime prices, or charts on holding-focused screens.
- Always preserve the watermark copy: `이 점수는 prep이지 신탁이 아님`.
- LLM copy must never say `AI가 추천`, `성공 가능성 높음`, or `강추`.
- Buy flow must require three thesis kill conditions before save.

## Ownership
- Backend owns `supabase/`, `src/app/api/`, `src/lib/server/`, `src/types/contracts.ts`, `.env.example`, and backend docs.
- Frontend owns UI routes and components under `src/app` and `src/components`, except `src/app/api`.
- Shared API/type changes start in `src/types/contracts.ts`, then route handlers, then frontend.
- Frontend should not query Supabase tables directly. Use API routes or shared contracts.

## Backend Rules
- Supabase service role key is server-only. Never expose it to client components or `NEXT_PUBLIC_*`.
- Keep response envelopes stable: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- Use typed contracts from `src/types/contracts.ts` for all route request/response shapes.
- Add indexes for new query paths in the same migration that introduces the path.
- For external providers, keep adapters isolated from route handlers so mock data can remain available.

## Frontend Rules
- Mobile first: optimize for iPhone 13 Pro Max, one-handed use, safe areas, `100dvh`, and input font size 16px+.
- Score is the hero element on scoring screens.
- Keep layout flat and calm: no decorative gradients, heavy shadows, or unnecessary animation.
- Put primary actions in the reachable lower screen area.
- Do not invent API fields in UI code. Ask backend to update `contracts.ts` first.

## Before Work
- Search existing contracts/routes before adding new ones.
- Check `docs/api-contract.md` for current endpoint behavior.
- If changing a public contract, update `src/types/contracts.ts`, API route, mock data, and docs together.

## Verification
- Run `npm run typecheck` after TypeScript changes.
- Smoke test changed API routes with seed/mock data.
- For UI work, verify mobile layout at 428px width and check that text does not overlap.
