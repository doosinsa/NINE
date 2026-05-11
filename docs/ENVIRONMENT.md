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

Future provider keys:

```env
ANTHROPIC_API_KEY=
KIS_APP_KEY=
KIS_APP_SECRET=
DART_API_KEY=
FINNHUB_API_KEY=
NEWS_API_KEY=
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SEC_USER_AGENT_EMAIL=
```

## Vercel Production Env

Already configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`

Needed before auth deployment:

- `NINE_PASSWORD_HASH`
- `NINE_SESSION_SECRET`

## URL Format

`NEXT_PUBLIC_SUPABASE_URL` must be:

```txt
https://<project-ref>.supabase.co
```

It must not include `/rest/v1`.
