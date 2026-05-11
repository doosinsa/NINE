# NEXT_ACTION

Configure `NINE_PASSWORD_HASH` and `NINE_SESSION_SECRET` in local and Vercel environments, then deploy auth.

## Resume Command

`다음 작업 이어가자`

## Before Editing

- Read `AGENTS.md`.
- Read `docs/SESSION_STATE.md`.
- Run `git status --short --branch`.
- Generate `NINE_PASSWORD_HASH` with the command in `docs/ENVIRONMENT.md`.
- Generate `NINE_SESSION_SECRET` with `openssl rand -base64 32`.
- Do not commit secret values.
