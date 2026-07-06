import type { MarketListing, ScanOptions, VenueAdapter } from "./types.js";

/**
 * Kalshi adapter — public market data (no auth required for reads).
 * Docs: https://trading-api.readme.io / https://docs.kalshi.com
 * NOTE: verify the current base URL against Kalshi docs before production use.
 */
const BASE = "https://api.elections.kalshi.com/trade-api/v2";

interface KalshiMarket {
  ticker: string;
  title: string;
  yes_ask?: number;
  yes_bid?: number;
  last_price?: number;
  close_time?: string;
  volume?: number;
  liquidity?: number;
  status?: string;
}

export const kalshi: VenueAdapter = {
  venue: "kalshi",
  async fetchMarkets(opts: ScanOptions = {}): Promise<MarketListing[]> {
    const limit = Math.min(opts.limit ?? 200, 1000);
    const res = await fetch(`${BASE}/markets?status=open&limit=${limit}`, {
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`Kalshi API error ${res.status}`);
    const data = (await res.json()) as { markets?: KalshiMarket[] };
    const markets = data.markets ?? [];

    return markets
      .filter((m) => matches(m.title, opts.keywords))
      .map((m) => {
        const cents = m.last_price ?? m.yes_ask ?? m.yes_bid;
        return {
          id: m.ticker,
          venue: "kalshi" as const,
          title: m.title,
          yesPrice: typeof cents === "number" ? cents / 100 : null,
          closeTime: m.close_time,
          volume: m.volume,
          liquidity: m.liquidity,
          url: `https://kalshi.com/markets/${m.ticker}`,
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
