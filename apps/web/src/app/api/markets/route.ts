import { NextResponse } from "next/server";
import { scanAll, type Venue } from "@saa/markets";
import { PLAYBOOKS, detectSport } from "@saa/agent";
import { getSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getSettings();
  const enabled = PLAYBOOKS.filter((p) => settings.sportsEnabled.includes(p.sport));
  const keywords = enabled.flatMap((p) => p.keywords);
  const excludeKeywords = enabled.flatMap((p) => p.excludeKeywords ?? []);

  // No sports enabled means nothing to scan — an empty keyword list would tell
  // the adapters "no filter" and return every market on every venue.
  if (keywords.length === 0) {
    return NextResponse.json({ listings: [], errors: {}, scannedAt: new Date().toISOString() });
  }

  const { listings, errors } = await scanAll(settings.venuesEnabled as Venue[], {
    keywords,
    excludeKeywords,
    limit: 200
  });

  const enriched = listings
    .map((l) => ({ ...l, sport: detectSport(l.title) }))
    .filter((l) => !l.sport || settings.sportsEnabled.includes(l.sport))
    // Thin-market filter; listings with no depth data at all (e.g. Hyperliquid) are kept.
    .filter((l) => (l.liquidity == null && l.volume == null) || Math.max(l.liquidity ?? 0, l.volume ?? 0) >= settings.minLiquidity)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

  return NextResponse.json({ listings: enriched, errors, scannedAt: new Date().toISOString() });
}
