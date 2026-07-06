import type { MarketListing, ScanOptions, Venue, VenueAdapter } from "./types.js";
import { kalshi } from "./kalshi.js";
import { polymarket } from "./polymarket.js";
import { hyperliquid } from "./hyperliquid.js";

export * from "./types.js";
export * from "./match.js";
export { kalshi, polymarket, hyperliquid };

const ADAPTERS: Record<Venue, VenueAdapter> = { kalshi, polymarket, hyperliquid };

/** Scan selected venues in parallel; a failing venue never breaks the scan. */
export async function scanAll(
  venues: Venue[] = ["kalshi", "polymarket", "hyperliquid"],
  opts: ScanOptions = {}
): Promise<{ listings: MarketListing[]; errors: Partial<Record<Venue, string>> }> {
  const errors: Partial<Record<Venue, string>> = {};
  const results = await Promise.all(
    venues.map(async (v) => {
      try {
        return await ADAPTERS[v].fetchMarkets(opts);
      } catch (e) {
        errors[v] = e instanceof Error ? e.message : String(e);
        return [] as MarketListing[];
      }
    })
  );
  return { listings: results.flat(), errors };
}
