import type { MarketListing, ScanOptions, VenueAdapter } from "./types.js";
import { matchesKeywords } from "./match.js";

/**
 * Hyperliquid HIP-4 adapter: outcome (event/prediction) markets, live on
 * mainnet since 2026-05-02. Public read API, no auth:
 *   - POST /info {"type":"outcomeMeta"} lists questions and their outcomes
 *   - POST /info {"type":"allMids"} carries outcome mids under "#"-prefixed
 *     symbols encoded as "#" + (10 * outcomeId + side), side 0 = Yes
 * Mids are already probabilities in 0..1 (Yes + No mids sum to ~1), so the
 * YES price needs no normalization beyond Number().
 * Docs: https://hyperliquid.gitbook.io/hyperliquid-docs
 */
const INFO_URL = "https://api.hyperliquid.xyz/info";

export interface HipOutcome {
  outcome: number;
  name: string;
  description?: string;
  quoteToken?: string;
}

export interface HipQuestion {
  question: number;
  name: string;
  description?: string;
  fallbackOutcome?: number;
  namedOutcomes?: number[];
  settledNamedOutcomes?: number[];
}

export interface OutcomeMeta {
  outcomes?: HipOutcome[];
  questions?: HipQuestion[];
}

export type AllMids = Record<string, string>;

async function info<T>(body: object): Promise<T> {
  const res = await fetch(INFO_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Hyperliquid info API error ${res.status}`);
  return (await res.json()) as T;
}

/** Join outcomeMeta + allMids into listings. Exported for unit tests. */
export function toListings(meta: OutcomeMeta, mids: AllMids, opts: ScanOptions = {}): MarketListing[] {
  const outcomeById = new Map((meta.outcomes ?? []).map((o) => [o.outcome, o]));
  const listings: MarketListing[] = [];

  for (const q of meta.questions ?? []) {
    const settled = new Set(q.settledNamedOutcomes ?? []);
    for (const id of q.namedOutcomes ?? []) {
      if (settled.has(id)) continue;
      const outcome = outcomeById.get(id);
      if (!outcome) continue;

      const title = `${q.name}: ${outcome.name}`;
      // Match keywords against the description too; outcome descriptions carry
      // context the short title lacks (e.g. "...2026 FIFA World Cup champion").
      if (!matchesKeywords(`${title} ${outcome.description ?? ""}`, opts.keywords, opts.excludeKeywords)) continue;

      const yesSymbol = `#${id * 10}`;
      const mid = Number(mids[yesSymbol]);
      listings.push({
        id: yesSymbol,
        venue: "hyperliquid",
        title,
        yesPrice: Number.isFinite(mid) ? mid : null,
        group: { id: `q${q.question}`, title: q.name },
        outcome: outcome.name,
        // Volume/liquidity would need one l2Book call per outcome; left undefined.
        raw: outcome
      });
    }
  }

  return listings;
}

export const hyperliquid: VenueAdapter = {
  venue: "hyperliquid",
  async fetchMarkets(opts: ScanOptions = {}): Promise<MarketListing[]> {
    const [meta, mids] = await Promise.all([
      info<OutcomeMeta>({ type: "outcomeMeta" }),
      info<AllMids>({ type: "allMids" })
    ]);
    const limit = opts.limit ?? 200;
    return toListings(meta, mids, opts).slice(0, limit);
  }
};
