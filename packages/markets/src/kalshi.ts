import type { MarketListing, ScanOptions, VenueAdapter } from "./types.js";
import { matchesKeywords } from "./match.js";

/**
 * Kalshi adapter — public market data (no auth required for reads).
 * Docs: https://docs.kalshi.com
 *
 * Sports markets are discovered via GET /series?category=Sports (a flat
 * GET /markets scan never surfaces them: the default ordering is dominated by
 * non-sports and auto-generated parlay markets). Matching series are then
 * queried per series_ticker for their open markets.
 *
 * The API returns prices/volume/liquidity as decimal STRINGS in dollar units
 * (last_price_dollars, volume_fp, liquidity_dollars); the legacy integer-cent
 * fields (last_price, yes_bid, ...) are null on current responses.
 */
const BASE = "https://api.elections.kalshi.com/trade-api/v2";

/** How many matching series to query per scan (one request each). */
const MAX_SERIES = 12;
const MARKETS_PER_SERIES = 100;

export interface KalshiSeries {
  ticker: string;
  title?: string;
  tags?: string[];
  category?: string;
}

export interface KalshiMarket {
  ticker: string;
  event_ticker?: string;
  title: string;
  yes_sub_title?: string;
  last_price_dollars?: string | null;
  yes_bid_dollars?: string | null;
  yes_ask_dollars?: string | null;
  volume_fp?: string | null;
  liquidity_dollars?: string | null;
  close_time?: string;
  status?: string;
}

const num = (s: string | null | undefined): number | null => {
  if (s == null || s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * A series matches when a keyword appears in its title/tags (whole word,
 * e.g. keyword "baseball" vs tag "Baseball") or inside its ticker with spaces
 * stripped (e.g. keyword "fifa" vs ticker "KXFIFAWGAME"). Ticker substring
 * matching is only applied to keywords of 4+ characters — short ones collide
 * wildly ("fc" is inside KXUFCMOF, KXGOLFCAT, KXIIHFCHAMP; "mlb" inside the
 * esports series KXEWCMLBB). Exclude keywords (e.g. "cricket", "darts") veto
 * a series regardless of positive matches.
 */
export function seriesMatches(s: KalshiSeries, keywords?: string[], excludeKeywords?: string[]): boolean {
  const text = `${s.title ?? ""} ${(s.tags ?? []).join(" ")}`;
  if ((excludeKeywords?.length ?? 0) > 0 && !matchesKeywords(text, undefined, excludeKeywords)) return false;
  if (!keywords || keywords.length === 0) return true;
  if (matchesKeywords(text, keywords)) return true;
  const ticker = s.ticker.toLowerCase();
  return keywords.some((k) => {
    const stripped = k.replace(/\s+/g, "").toLowerCase();
    return stripped.length >= 4 && ticker.includes(stripped);
  });
}

/**
 * Pick which matched series to query: round-robin across sport tags so every
 * enabled sport gets coverage, preferring live game-winner series and flagship
 * (shorter) tickers. Tag groups are visited largest-first — real sports have
 * hundreds of series (Soccer 471, Basketball 442, ...) while false-positive
 * tags have a handful, so junk cannot displace an enabled sport from the
 * budget. Deterministic. Exported for unit tests.
 */
export function prioritizeSeries(series: KalshiSeries[], max = MAX_SERIES): KalshiSeries[] {
  const byTag = new Map<string, KalshiSeries[]>();
  for (const s of series) {
    const tag = s.tags?.[0] ?? "other";
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag)!.push(s);
  }
  const rank = (s: KalshiSeries) => [s.ticker.includes("GAME") ? 0 : 1, s.ticker.length] as const;
  for (const group of byTag.values()) {
    group.sort((a, b) => {
      const [ag, al] = rank(a);
      const [bg, bl] = rank(b);
      return ag - bg || al - bl || a.ticker.localeCompare(b.ticker);
    });
  }
  const tags = [...byTag.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
  const picked: KalshiSeries[] = [];
  for (let round = 0; picked.length < max; round++) {
    let added = false;
    for (const tag of tags) {
      const group = byTag.get(tag)!;
      if (round < group.length && picked.length < max) {
        picked.push(group[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return picked;
}

/** Map one Kalshi market to a normalized listing. Exported for unit tests. */
export function toListing(m: KalshiMarket, seriesTitle?: string): MarketListing {
  const last = num(m.last_price_dollars);
  const bid = num(m.yes_bid_dollars);
  const ask = num(m.yes_ask_dollars);
  // Untraded markets report last_price_dollars "0.0000" — fall back to the book mid.
  let yesPrice: number | null = last != null && last > 0 ? last : null;
  if (yesPrice == null && bid != null && ask != null && ask > 0) yesPrice = (bid + ask) / 2;

  // kalshi.com resolves /markets/<series-ticker> (lowercase); full market-ticker
  // paths 404, and the API exposes no event slug for deeper links.
  const seriesTicker = (m.event_ticker ?? m.ticker).split("-")[0].toLowerCase();

  // Market titles rarely name the league ("Colorado vs LA Winner?") — prefix
  // the series title so sport detection and humans get the context.
  const title = seriesTitle && !m.title.toLowerCase().includes(seriesTitle.toLowerCase())
    ? `${seriesTitle}: ${m.title}`
    : m.title;

  return {
    id: m.ticker,
    venue: "kalshi",
    title,
    yesPrice,
    closeTime: m.close_time,
    volume: num(m.volume_fp) ?? undefined,
    liquidity: num(m.liquidity_dollars) ?? undefined,
    url: `https://kalshi.com/markets/${seriesTicker}`,
    raw: m
  };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Kalshi API error ${res.status}`);
  return (await res.json()) as T;
}

export const kalshi: VenueAdapter = {
  venue: "kalshi",
  async fetchMarkets(opts: ScanOptions = {}): Promise<MarketListing[]> {
    const limit = Math.min(opts.limit ?? 200, 1000);

    const { series = [] } = await getJson<{ series?: KalshiSeries[] }>("/series?category=Sports");
    const picked = prioritizeSeries(series.filter((s) => seriesMatches(s, opts.keywords, opts.excludeKeywords)));

    // Kalshi's public rate limit is ~10 req/s — fetch in small, spaced batches.
    const results: MarketListing[][] = [];
    const BATCH = 4;
    for (let i = 0; i < picked.length; i += BATCH) {
      if (i > 0) await new Promise((r) => setTimeout(r, 500));
      const batch = await Promise.all(
        picked.slice(i, i + BATCH).map(async (s) => {
          const { markets = [] } = await getJson<{ markets?: KalshiMarket[] }>(
            `/markets?status=open&limit=${MARKETS_PER_SERIES}&series_ticker=${encodeURIComponent(s.ticker)}`
          );
          return markets.map((m) => toListing(m, s.title));
        })
      );
      results.push(...batch);
    }

    // Interleave across series before capping, so a tight limit keeps
    // per-series coverage instead of dropping later series wholesale.
    const interleaved: MarketListing[] = [];
    for (let i = 0; interleaved.length < limit; i++) {
      let added = false;
      for (const arr of results) {
        if (i < arr.length && interleaved.length < limit) {
          interleaved.push(arr[i]);
          added = true;
        }
      }
      if (!added) break;
    }
    return interleaved;
  }
};
