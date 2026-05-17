# NINE launchd Worker Setup

These LaunchAgent files keep local worker processes alive for the Mac/n8n runtime. They do not contain provider secrets. Each worker loads `.env` through `scripts/start-worker.mjs`, then applies only the profile selectors needed for that worker.

The n8n LaunchAgent keeps the local scheduler itself alive. It uses the n8n binary installed in the local npm cache from the first `npx n8n` setup.

## Profiles

| File | Port | Purpose |
|---|---:|---|
| `com.doo.nine.n8n.plist` | 5678 | n8n scheduler/API |
| `com.doo.nine.worker.mock.plist` | 3006 | Mock/status worker |
| `com.doo.nine.worker.eps.plist` | 3001 | Alpha Vantage EPS worker |
| `com.doo.nine.worker.earnings.plist` | 3002 | DART + Alpha Vantage earnings worker |
| `com.doo.nine.worker.briefs.plist` | 3004 | Anthropic brief worker |
| `com.doo.nine.worker.discover.plist` | 3005 | NewsAPI + Anthropic Discover worker |
| `disabled/com.doo.nine.worker.prices.plist` | 3003 | KIS + Yahoo Finance price worker |

Keep the price worker disabled until KIS live collection is verified from the Mac worker runtime. Move it out of `disabled/` only after that smoke passes.

If Node or n8n is upgraded, update the hardcoded Node, npm, and n8n paths in these plist files. The current templates use `/Users/doo/.nvm/versions/node/v22.22.0/bin/node`, `/Users/doo/.nvm/versions/node/v22.22.0/bin/npm`, and `/Users/doo/.npm/_npx/a8a7eec953f1f314/node_modules/n8n/bin/n8n`.

## Install

Run once after `npm run build` succeeds:

```bash
mkdir -p "$HOME/Library/LaunchAgents"
cp ops/launchd/com.doo.nine.worker.*.plist "$HOME/Library/LaunchAgents/"
cp ops/launchd/com.doo.nine.n8n.plist "$HOME/Library/LaunchAgents/"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.n8n.plist"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.mock.plist"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.eps.plist"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.earnings.plist"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.briefs.plist"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.discover.plist"
```

## Check

```bash
launchctl print "gui/$(id -u)/com.doo.nine.worker.mock"
curl -sS http://localhost:5678/api/v1/workflows -H "X-N8N-API-KEY: $N8N_API_KEY" | head -c 500
npm run provider:smoke -- --base-url http://127.0.0.1:3006 --suite status
npm run provider:smoke -- --base-url http://127.0.0.1:3001 --suite status
npm run provider:smoke -- --base-url http://127.0.0.1:3002 --suite status
npm run n8n:monitor
npm run n8n:monitor -- --strict
```

## Stop

```bash
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.mock.plist"
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.n8n.plist"
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.eps.plist"
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.earnings.plist"
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.briefs.plist"
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.doo.nine.worker.discover.plist"
```

Logs are written under `logs/` in the repo. Do not commit log files.
