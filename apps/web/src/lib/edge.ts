import type { Listing } from "@/lib/marketGroups";
import { pickProbability, type ReportMatch } from "@/lib/reports";

/**
 * The product's core claim: our probability vs the market's price on the SAME
 * proposition. A Round-of-16 pick means "advances to the quarterfinals";
 * regulation-time winner markets (a draw pays neither team) and champion
 * markets are different bets and must never be compared against the pick.
 */

export interface EdgeInfo {
  team: string;
  /** Our stated probability of the pick, 0..1. */
  ourProbability: number;
  /** The comparable market's YES price, 0..1. */
  marketPrice: number;
  venue: string;
  /** (our − market) in percentage points; positive = market underprices our pick. */
  edgePts: number;
  verdict: string;
  listing: Listing;
}

const ADVANCE_HINTS = ["advance", "quarterfinal", "quarter-final"];

/** Find a live market on the pick's actual proposition (advancing), if any. */
export function advanceListingFor(match: ReportMatch, listings: Listing[]): Listing | undefined {
  const team = match.predictedWinner.toLowerCase();
  return listings.find((l) => {
    if (l.yesPrice == null) return false;
    const text = `${l.group?.title ?? ""} ${l.title} ${l.outcome ?? ""}`.toLowerCase();
    return ADVANCE_HINTS.some((h) => text.includes(h)) && text.includes(team);
  });
}

export function edgeFor(match: ReportMatch, listings: Listing[]): EdgeInfo | undefined {
  const p = pickProbability(match);
  if (p == null) return undefined;
  const listing = advanceListingFor(match, listings);
  if (!listing || listing.yesPrice == null) return undefined;

  const edgePts = Number(((p - listing.yesPrice) * 100).toFixed(1));
  let verdict: string;
  if (Math.abs(edgePts) < 3) {
    verdict = "the market matches our probability; little edge";
  } else if (edgePts > 0) {
    verdict = `we think the market underprices ${match.predictedWinner} by ${edgePts.toFixed(0)} points`;
  } else {
    verdict = "the market price is above our probability; no value at this price";
  }
  return {
    team: match.predictedWinner,
    ourProbability: p,
    marketPrice: listing.yesPrice,
    venue: listing.venue,
    edgePts,
    verdict,
    listing
  };
}
