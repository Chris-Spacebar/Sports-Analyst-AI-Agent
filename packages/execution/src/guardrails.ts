/** Every knob the semi-auto/auto system respects. Edited via the Settings UI. */
export type AgentMode = "analysis" | "semi_auto" | "auto";

export interface AgentSettings {
  mode: AgentMode;
  /** Sports currently enabled — mirrors your phase rollout. */
  sportsEnabled: string[];
  /** Venues you allow the agent to look at / act on. */
  venuesEnabled: Array<"kalshi" | "polymarket" | "hyperliquid">;
  /** Minimum |model - market| edge (0..1) before a market is even flagged. */
  minEdge: number;
  /** Minimum analysis confidence (factor coverage, 0..1). */
  minConfidence: number;
  /** Hard cap per market, in USD (or USDC). */
  maxStakePerMarket: number;
  /** Hard cap on total open exposure, USD. */
  maxTotalExposure: number;
  /** Stop all activity for the day after this much realized loss, USD. */
  dailyLossLimit: number;
  /** Minimum market liquidity/volume to consider (avoids thin markets). */
  minLiquidity: number;
  /** Master off switch — when true, nothing executes anywhere. */
  killSwitch: boolean;
}

export const DEFAULT_SETTINGS: AgentSettings = {
  mode: "analysis",
  sportsEnabled: ["soccer", "american_football", "basketball", "baseball"],
  venuesEnabled: ["kalshi", "polymarket", "hyperliquid"],
  minEdge: 0.07,
  minConfidence: 0.6,
  maxStakePerMarket: 25,
  maxTotalExposure: 200,
  dailyLossLimit: 50,
  minLiquidity: 1000,
  killSwitch: false
};

export interface OrderIntent {
  venue: "kalshi" | "polymarket" | "hyperliquid";
  marketId: string;
  side: "YES" | "NO";
  stakeUsd: number;
  limitPrice: number; // 0..1
  edge: number;
  confidence: number;
  /** Liquidity (or volume, whichever the venue reports) of the market, USD. */
  marketLiquidityUsd: number;
}

export interface GuardrailResult {
  allowed: boolean;
  reasons: string[];
}

/** Pure function — easy to unit test. Checks one intent against settings + current exposure. */
export function checkGuardrails(
  intent: OrderIntent,
  settings: AgentSettings,
  state: { openExposureUsd: number; realizedPnlTodayUsd: number }
): GuardrailResult {
  const reasons: string[] = [];
  if (settings.killSwitch) reasons.push("Kill switch is ON");
  if (settings.mode === "analysis") reasons.push("Mode is analysis-only");
  if (!settings.venuesEnabled.includes(intent.venue)) reasons.push(`Venue ${intent.venue} not enabled`);
  // NaN slips through every < / > comparison below, so reject non-finite numbers explicitly.
  if (!Number.isFinite(intent.edge)) reasons.push("Edge must be a finite number");
  else if (intent.edge < settings.minEdge) reasons.push(`Edge ${intent.edge} below minimum ${settings.minEdge}`);
  if (!Number.isFinite(intent.confidence)) reasons.push("Confidence must be a finite number");
  else if (intent.confidence < settings.minConfidence) reasons.push(`Confidence ${intent.confidence} below minimum ${settings.minConfidence}`);
  if (!Number.isFinite(intent.stakeUsd) || intent.stakeUsd <= 0) reasons.push("Stake must be a positive finite USD amount");
  else if (intent.stakeUsd > settings.maxStakePerMarket) reasons.push(`Stake exceeds per-market cap $${settings.maxStakePerMarket}`);
  if (!Number.isFinite(state.openExposureUsd)) reasons.push("Open exposure must be a finite number");
  else if (state.openExposureUsd + intent.stakeUsd > settings.maxTotalExposure) reasons.push(`Would exceed total exposure cap $${settings.maxTotalExposure}`);
  if (!Number.isFinite(state.realizedPnlTodayUsd)) reasons.push("Realized PnL must be a finite number");
  else if (state.realizedPnlTodayUsd <= -settings.dailyLossLimit) reasons.push(`Daily loss limit $${settings.dailyLossLimit} reached`);
  if (!Number.isFinite(intent.marketLiquidityUsd) || intent.marketLiquidityUsd < settings.minLiquidity) {
    reasons.push(`Market liquidity $${intent.marketLiquidityUsd} below minimum $${settings.minLiquidity}`);
  }
  if (!Number.isFinite(intent.limitPrice) || intent.limitPrice <= 0 || intent.limitPrice >= 1) reasons.push("Limit price must be between 0 and 1");
  return { allowed: reasons.length === 0, reasons };
}
