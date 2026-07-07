import type { Listing } from "@/lib/marketGroups";
import { REPORTS } from "@/lib/reports";

/** Team name → live listing lookup, tolerant of "USA"/"United States" style aliases. */
export function findTeam(outcomes: Listing[], team: string): Listing | undefined {
  const t = team.toLowerCase();
  return outcomes.find((o) => {
    const name = (o.outcome ?? o.title).toLowerCase();
    return name === t || name.includes(t) || t.includes(name);
  });
}

/** Listings whose title or outcome mentions both teams (a market on this event). */
export function marketsForEvent(listings: Listing[], teamA: string, teamB: string): Listing[] {
  const a = teamA.toLowerCase();
  const b = teamB.toLowerCase();
  return listings.filter((l) => {
    const text = `${l.group?.title ?? ""} ${l.title} ${l.outcome ?? ""}`.toLowerCase();
    return text.includes(a) && text.includes(b);
  });
}

/** First report match whose two teams both appear in the text (we have research on it). */
export function researchEventFor(text: string): { eventKey: string; matchup: string } | undefined {
  const t = text.toLowerCase();
  for (const report of REPORTS) {
    for (const m of report.matches) {
      if (t.includes(m.teamA.toLowerCase()) && t.includes(m.teamB.toLowerCase())) {
        return { eventKey: m.eventKey, matchup: m.matchup };
      }
    }
  }
  return undefined;
}
