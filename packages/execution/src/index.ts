import { checkGuardrails, type AgentSettings, type OrderIntent } from "./guardrails.js";

export * from "./guardrails.js";
export * from "./settings.js";

/**
 * Order execution layer — INTENTIONALLY NOT IMPLEMENTED in the scaffold.
 *
 * Design (fill in per venue when you reach Step 3/4 of the roadmap):
 *   Kalshi      — REST order endpoint, signed with KALSHI_API_KEY_ID + private key
 *   Polymarket  — CLOB API order, signed with wallet-derived API creds (POLY_* env)
 *   Hyperliquid — exchange endpoint, signed by a delegated API wallet (never main key)
 *
 * Rules baked in:
 *   1. Nothing runs unless EXECUTION_ENABLED=true AND mode is semi_auto/auto
 *   2. semi_auto returns a prepared order for human approval; only auto submits
 *   3. Every intent passes checkGuardrails() first — no exceptions
 *   4. Keys live in env vars only; this package must never log them
 */
export interface PreparedOrder {
  intent: OrderIntent;
  status: "blocked" | "awaiting_approval" | "would_submit";
  reasons: string[];
}

export function prepareOrder(
  intent: OrderIntent,
  settings: AgentSettings,
  state: { openExposureUsd: number; realizedPnlTodayUsd: number }
): PreparedOrder {
  const executionEnabled = process.env.EXECUTION_ENABLED === "true";
  const check = checkGuardrails(intent, settings, state);

  if (!check.allowed) return { intent, status: "blocked", reasons: check.reasons };
  if (!executionEnabled) return { intent, status: "blocked", reasons: ["EXECUTION_ENABLED is not true"] };
  if (settings.mode === "semi_auto") return { intent, status: "awaiting_approval", reasons: [] };
  return { intent, status: "would_submit", reasons: [] };
}

/** Placeholder — implement per-venue signing/submission in Step 3-4. */
export async function submitOrder(_prepared: PreparedOrder): Promise<never> {
  throw new Error(
    "submitOrder is not implemented in the scaffold. Implement per-venue signing " +
      "(Kalshi REST / Polymarket CLOB / Hyperliquid exchange) before enabling auto mode."
  );
}
