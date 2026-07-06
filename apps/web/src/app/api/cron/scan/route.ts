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
  const keywords = PLAYBOOKS.filter((p) => settings.sportsEnabled.includes(p.sport))
    .flatMap((p) => p.keywords);
  const { listings, errors } = await scanAll(settings.venuesEnabled as Venue[], { keywords, limit: 200 });

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
