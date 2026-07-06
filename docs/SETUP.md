# Setup guide

## 1. Push this code to your GitHub repo

From the folder containing this repo:

```bash
git remote add origin https://github.com/Chris-Spacebar/Sports-Analyst-AI-Agent.git
git branch -M main
git push -u origin main
```

(If the repo already has a README/initial commit, run `git pull origin main --rebase --allow-unrelated-histories` first, or force-push if you want this scaffold to be the starting point: `git push -u origin main --force`.)

## 2. Run locally

```bash
npm install
cp .env.example apps/web/.env   # Next.js only loads env files from the app directory
npm run dev                     # http://localhost:3000
```

Everything works with zero keys in analysis mode. Add `ANTHROPIC_API_KEY` to enable AI-scored analyses via `/api/analyze`.

## 3. Deploy to Vercel

1. vercel.com → Add New Project → Import `Chris-Spacebar/Sports-Analyst-AI-Agent`
2. **Root Directory: `apps/web`** (important — it's a monorepo)
3. Framework preset: Next.js (auto-detected)
4. Add environment variables from `.env.example` (at minimum `CRON_SECRET`; add `ANTHROPIC_API_KEY` for AI analyses)
5. Deploy. The daily scan cron (`/api/cron/scan`, 12:00 UTC) is configured in `apps/web/vercel.json`

## 4. Accounts and wallets (Step 3 of the roadmap)

| Venue | What you need | Notes |
|---|---|---|
| Kalshi | Account + KYC, then API key pair | US-regulated (CFTC). Market data needs no auth |
| Polymarket | Wallet with USDC on Polygon + CLOB API creds | US access restrictions apply — check your jurisdiction |
| Hyperliquid | Main wallet + a delegated API wallet | Use the API wallet only; never expose your main private key |

Key rules: keys live ONLY in `apps/web/.env` locally and Vercel env vars in production. Never commit them. Fund trading wallets with only what you can afford to lose.

## 5. Persistence (Step 2 of the roadmap)

The scaffold stores settings in memory. To persist settings, analyses, and a track record:

- Easiest: Vercel KV (Redis) for settings + Vercel Postgres for history
- Or: Supabase (Postgres + auth if you later want login)

Replace `apps/web/src/lib/settingsStore.ts` with a KV-backed version — the interface is two functions.

## 6. Semi-auto → auto (Steps 3-4)

1. Implement venue signing in `packages/execution/src/index.ts` (`submitOrder`)
2. Keep `AGENT_MODE=semi_auto` — the env var sets the boot-time default mode (the Settings UI can change it at runtime); every order requires your click in the UI
3. Only after a verified track record, set `AGENT_MODE=auto` AND `EXECUTION_ENABLED=true`
4. The kill switch in Settings overrides everything at any time
