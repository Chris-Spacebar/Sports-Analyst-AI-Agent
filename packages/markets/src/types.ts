export type Venue = "kalshi" | "polymarket" | "hyperliquid";

/** A prediction-market listing normalized across venues. */
export interface MarketListing {
  id: string;
  venue: Venue;
  title: string;
  /** Price of YES normalized to 0..1 (Kalshi cents/100, Polymarket outcome price). */
  yesPrice: number | null;
  closeTime?: string;
  volume?: number;
  liquidity?: number;
  url?: string;
  raw?: unknown;
}

export interface ScanOptions {
  /** Lowercase keywords; a listing matches if its title contains any. */
  keywords?: string[];
  limit?: number;
}

export interface VenueAdapter {
  venue: Venue;
  /** Fetch open markets (public data, no auth needed). */
  fetchMarkets(opts?: ScanOptions): Promise<MarketListing[]>;
}
