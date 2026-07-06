/** Client-side shapes for /api/markets listings and their grouping into cards. */

export interface Listing {
  id: string;
  venue: string;
  title: string;
  sport?: string;
  yesPrice: number | null;
  group?: { id: string; title: string };
  outcome?: string;
  closeTime?: string;
  volume?: number;
  liquidity?: number;
  url?: string;
}

export interface MarketGroup {
  /** Stable key: `${venue}:${group id or listing id}` (also the detail-page URL id). */
  key: string;
  venue: string;
  title: string;
  sport?: string;
  outcomes: Listing[];
  /** Max volume/liquidity across outcomes, for sorting and display. */
  volume?: number;
  liquidity?: number;
  closeTime?: string;
  url?: string;
}

export const groupId = (l: Listing) => l.group?.id ?? l.id;

/** Collapse listings into one group per market/event, hyperliquid first, then by volume. */
export function groupListings(listings: Listing[]): MarketGroup[] {
  const byKey = new Map<string, MarketGroup>();
  for (const l of listings) {
    const key = `${l.venue}:${groupId(l)}`;
    let g = byKey.get(key);
    if (!g) {
      g = {
        key,
        venue: l.venue,
        title: l.group?.title ?? l.title,
        sport: l.sport,
        outcomes: [],
        closeTime: l.closeTime,
        url: l.url
      };
      byKey.set(key, g);
    }
    g.outcomes.push(l);
    g.sport = g.sport ?? l.sport;
    if (l.volume != null) g.volume = Math.max(g.volume ?? 0, l.volume);
    if (l.liquidity != null) g.liquidity = Math.max(g.liquidity ?? 0, l.liquidity);
  }
  const groups = [...byKey.values()];
  for (const g of groups) {
    g.outcomes.sort((a, b) => (b.yesPrice ?? -1) - (a.yesPrice ?? -1));
  }
  groups.sort((a, b) => {
    const av = a.venue === "hyperliquid" ? 0 : 1;
    const bv = b.venue === "hyperliquid" ? 0 : 1;
    return av - bv || (b.volume ?? 0) - (a.volume ?? 0);
  });
  return groups;
}
