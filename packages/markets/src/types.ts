export type Venue = "kalshi" | "polymarket" | "hyperliquid";

/** A prediction-market listing normalized across venues. */
export interface MarketListing {
  id: string;
  venue: Venue;
  title: string;
  /** Price of YES normalized to 0..1 (Kalshi cents/100, Polymarket outcome price). */
  yesPrice: number | null;
  /**
   * The parent market/event this listing is one outcome of (Hyperliquid
   * question, Kalshi event, Polymarket event). Listings sharing a group id
   * belong on one card: "2026 World Cup Champion", not 14 country cards.
   */
  group?: { id: string; title: string };
  /** Label of this outcome within its group (e.g. "Argentina", "Seattle"). */
  outcome?: string;
  closeTime?: string;
  volume?: number;
  liquidity?: number;
  url?: string;
  raw?: unknown;
}

export interface ScanOptions {
  /** Lowercase keywords; a listing matches if its title contains any (whole word). */
  keywords?: string[];
  /** Listings matching any of these are always dropped (e.g. "poker", "darts"). */
  excludeKeywords?: string[];
  limit?: number;
}

export interface VenueAdapter {
  venue: Venue;
  /** Fetch open markets (public data, no auth needed). */
  fetchMarkets(opts?: ScanOptions): Promise<MarketListing[]>;
}
