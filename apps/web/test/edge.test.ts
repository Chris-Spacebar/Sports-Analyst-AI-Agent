import { describe, expect, it } from "vitest";
import { advanceListingFor, edgeFor } from "../src/lib/edge";
import { REPORTS, matchNarrative } from "../src/lib/reports";
import type { Listing } from "../src/lib/marketGroups";

const spain = REPORTS[0].matches.find((m) => m.matchup === "Spain vs Portugal")!;

const listings: Listing[] = [
  // Different bet: regulation-time winner (a draw pays neither team).
  { id: "k1", venue: "kalshi", title: "World Cup Game: Spain vs Portugal Winner?", outcome: "Reg Time: Spain", yesPrice: 0.51 },
  // The comparable proposition: advancing to the quarterfinals.
  { id: "p1", venue: "polymarket", title: "Will Spain reach the Quarterfinals?", outcome: "Spain (reach Quarterfinals)", yesPrice: 0.66 },
  // Champion market — also a different bet.
  { id: "h1", venue: "hyperliquid", title: "2026 World Cup Champion: Spain", group: { id: "q32", title: "2026 World Cup Champion" }, outcome: "Spain", yesPrice: 0.13 }
];

describe("advanceListingFor", () => {
  it("matches only the advancing proposition, never reg-time or champion markets", () => {
    const l = advanceListingFor(spain, listings);
    expect(l?.id).toBe("p1");
  });

  it("returns undefined when no advancing market exists", () => {
    expect(advanceListingFor(spain, [listings[0], listings[2]])).toBeUndefined();
  });
});

describe("edgeFor", () => {
  it("computes our probability minus the comparable market price", () => {
    const e = edgeFor(spain, listings)!;
    expect(e.ourProbability).toBeCloseTo(0.64);
    expect(e.marketPrice).toBeCloseTo(0.66);
    expect(e.edgePts).toBeCloseTo(-2, 0);
    expect(e.verdict).toMatch(/market agrees/i);
  });

  it("calls out an underpriced pick", () => {
    const cheap = [{ ...listings[1], yesPrice: 0.5 }];
    const e = edgeFor(spain, cheap)!;
    expect(e.edgePts).toBeCloseTo(14);
    expect(e.verdict).toMatch(/underprices Spain/i);
  });

  it("is honest when the market is more confident than us", () => {
    const rich = [{ ...listings[1], yesPrice: 0.8 }];
    const e = edgeFor(spain, rich)!;
    expect(e.verdict).toMatch(/no value/i);
  });
});

describe("matchNarrative", () => {
  it("extracts the hook, verdict, and per-team pros/cons from the workbook sections", () => {
    const n = matchNarrative(spain);
    expect(n.oneLine).toMatch(/Iberian derby/i);
    expect(n.decision).toMatch(/^SPAIN 2-1/);
    expect(n.boosts?.teamA.plus).toMatch(/defense/i);
    expect(n.boosts?.teamB.minus).toMatch(/Dias/);
    // Evidence sections remain; logistics are separated out.
    expect(n.rest.map((s) => s.name)).not.toContain("Match Info");
    expect(n.matchInfo?.name).toBe("Match Info");
  });
});
