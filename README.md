# Sports Analyst AI Agent

An AI agent that analyzes sporting events listed on prediction markets — Kalshi, Polymarket, and Hyperliquid (HIP-4) — using deep, factor-based analysis of the sport, teams, players, injuries, cards, tactics, venue, weather, and more. It produces a model probability for each outcome and compares it against the live market price to surface edges.

**Modes**

| Mode | What it does |
|---|---|
| `analysis` (default) | Research + probabilities + edge report only |
| `semi_auto` | Prepares orders per your settings — every order needs your explicit approval |
| `auto` | Executes within hard guardrails (stake caps, loss limits, kill switch). Off by default |

## Monorepo layout

```
apps/web             Next.js dashboard + settings + API routes (deploys to Vercel)
packages/agent       Analysis engine + per-sport playbooks (Phase 1: soccer, NFL, NBA, MLB)
packages/markets     Market adapters: Kalshi, Polymarket, Hyperliquid HIP-4
packages/execution   Order layer with guardrails — DISABLED by default
docs/                Architecture, phase roadmap, setup guide
```

## Quick start

```bash
npm install
cp .env.example apps/web/.env   # Next.js loads env from apps/web; everything is optional for analysis mode
npm run dev                     # http://localhost:3000
```

## Deploy

Push to GitHub, then import the repo in Vercel (root directory: `apps/web`). See `docs/SETUP.md`.

## Phase roadmap

Phase 1 (now): Soccer (World Cup), NFL, NBA/FIBA, MLB/KBO. See `docs/PHASES.md` for Phases 2-4 covering racket, combat, strength, athletics, e-sports, water/snow, and motorsports.

## Disclaimers

This software produces analysis, not financial advice. Prediction markets carry real financial risk and are regulated differently by jurisdiction (Kalshi is CFTC-regulated; Polymarket has US access restrictions). You are responsible for legal compliance, your API keys, and your funds. Execution code never runs unless you explicitly enable it.
