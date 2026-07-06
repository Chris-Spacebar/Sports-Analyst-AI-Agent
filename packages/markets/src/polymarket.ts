import type { MarketListing, ScanOptions, VenueAdapter } from "./types.js";

/**
 * Polymarket adapter — public market data via the Gamma API (no auth for reads).
 * Docs: https://docs.polymarket.com
 * Trading goes through the CLOB API with wallet-derived credentials (see
 * packages/execution). Polymarket has US access restrictions — check your
 * jurisdiction before trading.
 */
const GAMMA = "https://gamma-api.polymarket.com";

interface GammaMarket {
  id: string;
  question?: string;
  slug?: string;
  endDate?: string;
  volume?: string;
  liquidity?: string;
  outcomePrices?: string; // JSON-encoded array, e.g. '["0.62","0.38"]'
  closed?: boolean;
}

export const polymarket: VenueAdapter = {
  venue: "polymarket",
  async fetchMarkets(opts: ScanOptions = {}): Promise<MarketListing[]> {
    const limit = Math.min(opts.limit ?? 200, 500);
    const res = await fetch(`${GAMMA}/markets?closed=false&limit=${limit}&order=volume&ascending=false`, {
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`Polymarket Gamma API error ${res.status}`);
    const markets = (await res.json()) as GammaMarket[];

    return markets
      .filter((m) => m.question && matches(m.question, opts.keywords))
      .map((m) => {
        let yesPrice: number | null = null;
        try {
          const prices = JSON.parse(m.outcomePrices ?? "[]") as string[];
          if (prices.length > 0) yesPrice = Number(prices[0]);
        } catch {
          yesPrice = null;
        }
        return {
          id: m.id,
          venue: "polymarket" as const,
          title: m.question ?? "",
          yesPrice: Number.isFinite(yesPrice) ? yesPrice : null,
          closeTime: m.endDate,
          volume: m.volume ? Number(m.volume) : undefined,
          liquidity: m.liquidity ? Number(m.liquidity) : undefined,
          url: m.slug ? `https://polymarket.com/market/${m.slug}` : undefined,
          raw: m
        };
      });
  }
};

function matches(title: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return true;
  const t = title.toLowerCase();
  return keywords.some((k) => t.includes(k));
}
