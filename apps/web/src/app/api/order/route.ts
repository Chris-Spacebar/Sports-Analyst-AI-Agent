import { NextResponse } from "next/server";
import { prepareOrder, type OrderIntent } from "@saa/execution";
import { getSettings } from "@/lib/settingsStore";

/**
 * POST /api/order — run an order intent through the guardrails.
 * Returns the PreparedOrder verdict: blocked (with reasons), awaiting_approval
 * (semi_auto), or would_submit (auto). Nothing is ever sent to a venue from
 * the scaffold: submitOrder is intentionally unimplemented (Step 3-4), and
 * execution stays off without EXECUTION_ENABLED=true.
 */
export async function POST(req: Request) {
  let body: {
    venue?: OrderIntent["venue"];
    marketId?: string;
    side?: "YES" | "NO";
    stakeUsd?: number;
    limitPrice?: number;
    modelProbability?: number;
    confidence?: number;
    marketLiquidityUsd?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be valid JSON" }, { status: 400 });
  }
  // JSON.parse("null") succeeds — guard before property access.
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "body must be a JSON object" }, { status: 400 });
  }

  const venues = ["kalshi", "polymarket", "hyperliquid"] as const;
  if (!body.venue || !venues.includes(body.venue)) {
    return NextResponse.json({ error: `venue must be one of: ${venues.join(", ")}` }, { status: 400 });
  }
  if (typeof body.marketId !== "string" || body.marketId.length === 0) {
    return NextResponse.json({ error: "marketId is required" }, { status: 400 });
  }
  if (body.side !== "YES" && body.side !== "NO") {
    return NextResponse.json({ error: "side must be YES or NO" }, { status: 400 });
  }
  const stakeUsd = Number(body.stakeUsd);
  const limitPrice = Number(body.limitPrice);
  if (!Number.isFinite(stakeUsd) || !Number.isFinite(limitPrice)) {
    return NextResponse.json({ error: "stakeUsd and limitPrice must be numbers" }, { status: 400 });
  }

  // Edge of the chosen side given the model's P(YES): YES pays off with
  // probability p at cost limitPrice; NO pays off with probability 1-p at
  // cost 1-limitPrice, so its edge is (1-p)-(1-limit) = limit - p.
  const p = Number(body.modelProbability);
  const hasModel = Number.isFinite(p) && p >= 0 && p <= 1;
  const edge = hasModel ? (body.side === "YES" ? p - limitPrice : limitPrice - p) : 0;
  const confidence = Number.isFinite(Number(body.confidence)) ? Number(body.confidence) : 0;

  const settings = getSettings();
  // Unknown market depth (e.g. Hyperliquid reports none) waives the liquidity
  // check — same policy as the scan routes — instead of asserting "$0 liquidity".
  const depth = Number(body.marketLiquidityUsd);
  const depthKnown = body.marketLiquidityUsd != null && Number.isFinite(depth);

  const intent: OrderIntent = {
    venue: body.venue,
    marketId: body.marketId,
    side: body.side,
    stakeUsd,
    limitPrice,
    edge: Number(edge.toFixed(4)),
    confidence,
    marketLiquidityUsd: depthKnown ? depth : settings.minLiquidity
  };

  // Exposure/PnL tracking needs persistence (roadmap Step 2) — a fresh scaffold
  // deployment has no open positions, so state starts at zero.
  const prepared = prepareOrder(intent, settings, { openExposureUsd: 0, realizedPnlTodayUsd: 0 });
  return NextResponse.json({
    ...prepared,
    modelEdgeUsed: hasModel,
    notes: depthKnown ? [] : ["Market depth unknown for this venue — liquidity check waived"]
  });
}
