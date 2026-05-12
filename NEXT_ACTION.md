# NEXT_ACTION

Add the Anthropic LLM provider adapter shell.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Read `prd.md`.
- Run `git status --short --branch`.
- Read `docs/provider-adapters.md`.
- Keep `NINE_PROVIDER_MODE=mock` as the default and do not run live calls without keys.
- Add a server-only Anthropic adapter shell for Core briefs and Discover clustering.
- Preserve the current mock LLM behavior and API response envelopes.
- Update provider docs with the Anthropic adapter's required env and activation path.
- Run `npm run typecheck` and `npm run build`.
