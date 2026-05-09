# NINE Runbook

## Local Checks

```bash
git status --short --branch
npm run typecheck
npm run build
```

## Local Dev

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

If port 3000 is stuck:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill <pid>
```

## Supabase

Load env before CLI commands:

```bash
set -a; . ./.env; set +a
```

Link project:

```bash
set -a; . ./.env; set +a; npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
```

Push migrations:

```bash
set -a; . ./.env; set +a; npx supabase db push
```

Seed linked database:

```bash
set -a; . ./.env; set +a; npx supabase db query --linked --file supabase/seed.sql
```

Check seeded data:

```bash
set -a; . ./.env; set +a; npx supabase db query --linked "select count(*) as stock_count from stocks;"
```

## Vercel

Deploy production:

```bash
vercel deploy --prod --yes
```

List env:

```bash
vercel env ls
```

Production smoke test:

```bash
curl -sS https://nine-red-three.vercel.app/api/candidates | head -c 500
```

## Git

After a completed checkpoint:

```bash
git status --short --branch
git add <files>
git commit -m "<message>"
git push
```
