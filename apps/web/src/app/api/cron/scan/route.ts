import { NextResponse } from "next/server";
import { scanAll, type Venue } from "@saa/markets";
import { PLAYBOOKS, detectSport } from "@saa/agent";
import { getSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

/**
 * Daily scheduled scan (see apps/web/vercel.json).
 * Scaffold: scans and returns a summary.
 * Step 2+: persist results, run analyses on new listings, notify you
 * (email/Telegram) when an edge above your threshold appears.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const settings = getSettings();
  const enabled = PLAYBOOKS.filter((p) => settings.sportsEnabled.includes(p.sport));
  const keywords = enabled.flatMap((p) => p.keywords);
  const excludeKeywords = enabled.flatMap((p) => p.excludeKeywords ?? []);

  // Empty keyword list = "no filter" to the adapters — with no sports enabled, scan nothing.
  if (keywords.length === 0) {
    return NextResponse.json({ ok: true, scannedAt: new Date().toISOString(), totalListings: 0, bySport: {}, errors: {} });
  }

  const { listings: rawListings, errors } = await scanAll(settings.venuesEnabled as Venue[], { keywords, excludeKeywords, limit: 200 });
  const listings = rawListings.filter(
    (l) => (l.liquidity == null && l.volume == null) || Math.max(l.liquidity ?? 0, l.volume ?? 0) >= settings.minLiquidity
  );

  const bySport: Record<string, number> = {};
  for (const l of listings) {
    const s = detectSport(l.title) ?? "unmatched";
    bySport[s] = (bySport[s] ?? 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    scannedAt: new Date().toISOString(),
    totalListings: listings.length,
    bySport,
    errors
  });
}
