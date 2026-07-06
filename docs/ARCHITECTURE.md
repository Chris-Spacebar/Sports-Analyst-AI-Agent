# Architecture

```
                        ┌─────────────────────────────┐
                        │        apps/web (Vercel)     │
                        │  Dashboard · Settings · API  │
                        │  /api/markets  /api/analyze  │
                        │  /api/settings /api/cron/scan│
                        └──────┬───────────────┬──────┘
                               │               │
                 ┌─────────────▼──┐      ┌─────▼────────────┐
                 │ packages/agent │      │ packages/markets │
                 │ playbooks per  │      │ Kalshi adapter   │
                 │ sport + engine │      │ Polymarket       │
                 │ + Claude LLM   │      │ Hyperliquid HIP-4│
                 └─────────────┬──┘      └─────┬────────────┘
                               │               │
                        ┌──────▼───────────────▼──────┐
                        │     packages/execution       │
                        │ guardrails · prepare/submit  │
                        │  DISABLED BY DEFAULT         │
                        └─────────────────────────────┘
```

## Data flow

1. **Scan** — `scanAll()` pulls open markets from enabled venues (public APIs, no auth), filters by sport keywords from the enabled playbooks
2. **Analyze** — for a chosen event, the engine loads the sport's playbook (factors + weights + research checklist). Factors get scored either manually or by Claude (`analyzeWithClaude`, fed with fresh research context). Weighted scores map to a model probability with a confidence measure
3. **Edge** — `computeEdges()` compares model probability vs each venue's YES price; the best edge and side are flagged
4. **Act** — in `semi_auto`, `prepareOrder()` runs the guardrails and returns an order awaiting your approval; in `auto` (env-gated), `submitOrder()` executes — not implemented in the scaffold on purpose

## Design decisions

- **Playbooks are data, not code paths** — adding Phase 2-4 sports means adding one file per sport in `packages/agent/src/sports/` and registering it. Nothing else changes
- **Transparent probability model** — a weighted linear map you can audit and tune, not a black box. The LLM's job is scoring factors from research, not conjuring probabilities
- **Execution isolated in its own package** — the web app and agent physically cannot place orders; only `packages/execution` can, and it is triple-gated (mode, env flag, kill switch)
- **Every guardrail is a pure function** — `checkGuardrails()` is unit-testable with no I/O

## Known scaffold limitations (intentional)

- Settings are in-memory (reset on redeploy) — wire to Vercel KV/Supabase in Step 2
- Hyperliquid HIP-4 adapter is a stub pending spec verification
- No database yet for analysis history / track record
- `submitOrder()` throws — implement per-venue signing only when you reach Step 3-4
