import type { MarketListing, ScanOptions, VenueAdapter } from "./types.js";
import { matchesKeywords } from "./match.js";

/**
 * Polymarket adapter — public market data via the Gamma API (no auth for reads).
 * Docs: https://docs.polymarket.com
 * Trading goes through the CLOB API with wallet-derived credentials (see
 * packages/execution). Polymarket has US access restrictions — check your
 * jurisdiction before trading.
 */
const GAMMA = "https://gamma-api.polymarket.com";

/** The Gamma API silently caps every response at 100 rows; paginate with offset. */
const PAGE_SIZE = 100;

export interface GammaMarket {
  id: string;
  question?: string;
  slug?: string;
  endDate?: string;
  volume?: string;
  liquidity?: string;
  volumeNum?: number;
  liquidityNum?: number;
  outcomes?: string; // JSON-encoded array, e.g. '["Yes","No"]' or team names
  outcomePrices?: string; // JSON-encoded array, e.g. '["0.62","0.38"]'
  /** Outcome label within the parent event, e.g. "Mexico" for a World Cup winner market. */
  groupItemTitle?: string;
  events?: Array<{ id?: string; slug?: string; title?: string }>;
  closed?: boolean;
}

const parseJsonArray = (s?: string): string[] => {
  try {
    const v = JSON.parse(s ?? "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

/**
 * Map one Gamma market to a normalized listing. Exported for unit tests.
 * yesPrice is only populated when the market actually has a YES outcome —
 * moneyline markets (team-name outcomes) and Up/Down markets get null instead
 * of an arbitrary first-outcome price.
 */
export function toListing(m: GammaMarket): MarketListing {
  const outcomes = parseJsonArray(m.outcomes);
  const prices = parseJsonArray(m.outcomePrices);
  let yesPrice: number | null = null;
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  if (yesIndex >= 0 && prices[yesIndex] !== undefined) {
    const p = Number(prices[yesIndex]);
    if (Number.isFinite(p)) yesPrice = p;
  }

  // Markets belong to a parent event ("World Cup Winner" holds one market per
  // country); group them so the dashboard shows one card per event.
  const event = m.events?.[0];
  const group = event?.slug
    ? { id: event.slug, title: (event.title ?? event.slug).trim() }
    : undefined;

  return {
    id: m.id,
    venue: "polymarket",
    title: m.question ?? "",
    yesPrice,
    group,
    outcome: m.groupItemTitle?.trim() || m.question,
    closeTime: m.endDate,
    volume: m.volumeNum ?? (m.volume ? Number(m.volume) : undefined),
    liquidity: m.liquidityNum ?? (m.liquidity ? Number(m.liquidity) : undefined),
    url: m.slug ? `https://polymarket.com/market/${m.slug}` : undefined,
    raw: m
  };
}

export const polymarket: VenueAdapter = {
  venue: "polymarket",
  async fetchMarkets(opts: ScanOptions = {}): Promise<MarketListing[]> {
    const limit = Math.min(opts.limit ?? 200, 500);
    // Keyword matches are sparse among top-volume markets, so paginate until we
    // have `limit` MATCHING markets (bounded), not `limit` raw ones.
    const MAX_PAGES = 10;
    const matched: GammaMarket[] = [];

    for (let page = 0; page < MAX_PAGES && matched.length < limit; page++) {
      // order=volumeNum is the working numeric sort; order=volume returns junk.
      const res = await fetch(
        `${GAMMA}/markets?closed=false&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}&order=volumeNum&ascending=false`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`Polymarket Gamma API error ${res.status}`);
      const batch = (await res.json()) as GammaMarket[];
      matched.push(...batch.filter((m) => m.question && matchesKeywords(m.question ?? "", opts.keywords, opts.excludeKeywords)));
      if (batch.length < PAGE_SIZE) break;
    }

    return matched.slice(0, limit).map(toListing);
  }
};
