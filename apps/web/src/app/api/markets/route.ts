import { NextResponse } from "next/server";
import { scanAll, type Venue } from "@saa/markets";
import { PLAYBOOKS, detectSport } from "@saa/agent";
import { getSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getSettings();
  const keywords = PLAYBOOKS.filter((p) => settings.sportsEnabled.includes(p.sport))
    .flatMap((p) => p.keywords);

  const { listings, errors } = await scanAll(settings.venuesEnabled as Venue[], {
    keywords,
    limit: 200
  });

  const enriched = listings
    .map((l) => ({ ...l, sport: detectSport(l.title) }))
    .filter((l) => !l.sport || settings.sportsEnabled.includes(l.sport))
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

  return NextResponse.json({ listings: enriched, errors, scannedAt: new Date().toISOString() });
}
