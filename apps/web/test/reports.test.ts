import { describe, expect, it } from "vitest";
import { REPORTS, getEvent, getReport, gradeReport, overallScorecard, pickProbability } from "../src/lib/reports";

const r16 = REPORTS[0];

describe("report content collection", () => {
  it("loads the Round of 16 report with 8 matches and unique event keys", () => {
    expect(getReport("wc2026-round-of-16")).toBeDefined();
    expect(r16.matches).toHaveLength(8);
    const keys = r16.matches.map((m) => m.eventKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("resolves events by key", () => {
    const e = getEvent("wc2026-r16-spain-portugal");
    expect(e?.match.matchup).toBe("Spain vs Portugal");
    expect(getEvent("nope")).toBeUndefined();
  });
});

describe("pickProbability", () => {
  it("parses bare percentages", () => {
    const m = r16.matches.find((x) => x.num === 1)!; // "62%"
    expect(pickProbability(m)).toBeCloseTo(0.62);
  });

  it("parses named-team percentages like 'Spain 64% / Portugal 36%'", () => {
    const m = { ...r16.matches[0], predictedWinner: "Spain", chanceToAdvance: "Spain 64% / Portugal 36%" };
    expect(pickProbability(m)).toBeCloseTo(0.64);
  });

  it("returns null when no percentage exists", () => {
    const m = { ...r16.matches[0], chanceToAdvance: "likely" };
    expect(pickProbability(m)).toBeNull();
  });
});

// Synthetic fixtures, so grading assertions test the logic and do not break
// each time real results are settled by the update-results routine.
const mkMatch = (
  num: number,
  predictedWinner: string,
  chanceToAdvance: string,
  result: { settled: boolean; winner?: string }
) => ({
  ...r16.matches[0],
  num,
  matchup: `A${num} vs B${num}`,
  teamA: predictedWinner,
  teamB: `B${num}`,
  eventKey: `fixture-${num}`,
  predictedWinner,
  chanceToAdvance,
  result
});

const mkReport = (id: string, matches: ReturnType<typeof mkMatch>[]) => ({
  ...r16,
  id,
  slug: id,
  matches
});

describe("gradeReport", () => {
  it("grades settled picks and counts pending ones", () => {
    const report = mkReport("fixture", [
      mkMatch(1, "A", "62%", { settled: true, winner: "A" }),
      mkMatch(2, "B", "85%", { settled: true, winner: "B" }),
      mkMatch(3, "C", "70%", { settled: false })
    ]);
    const card = gradeReport(report);
    expect(card.totalPicks).toBe(3);
    expect(card.settled).toBe(2);
    expect(card.correct).toBe(2);
    expect(card.pending).toBe(1);
    // Brier for correct picks at 62% and 85%: mean((1-.62)^2, (1-.85)^2)
    expect(card.brierScore).toBeCloseTo(((1 - 0.62) ** 2 + (1 - 0.85) ** 2) / 2, 3);
  });

  it("counts a wrong pick as settled but not correct", () => {
    const report = mkReport("fixture", [
      mkMatch(1, "A", "62%", { settled: true, winner: "B1" }), // B1 advanced, pick missed
      mkMatch(2, "B", "85%", { settled: true, winner: "B" }) // correct
    ]);
    const card = gradeReport(report);
    expect(card.settled).toBe(2);
    expect(card.correct).toBe(1);
  });

  it("keeps totals internally consistent on the live report", () => {
    const card = gradeReport(r16);
    expect(card.totalPicks).toBe(8);
    expect(card.settled + card.pending).toBe(card.totalPicks);
    expect(card.correct).toBeLessThanOrEqual(card.settled);
  });
});

describe("overallScorecard", () => {
  it("aggregates at the pick level, not as a mean of per-report means", () => {
    // Report A: two settled picks at 62% and 85%, both correct.
    const a = mkReport("a", [
      mkMatch(1, "A", "62%", { settled: true, winner: "A" }),
      mkMatch(2, "B", "85%", { settled: true, winner: "B" })
    ]);
    // Report B: one settled pick at 90%, missed.
    const b = mkReport("b", [mkMatch(1, "Foo", "90%", { settled: true, winner: "Bar" })]);
    const card = overallScorecard([a, b]);
    expect(card.settled).toBe(3);
    expect(card.correct).toBe(2);
    // True per-pick MSE: ((1-.62)^2 + (1-.85)^2 + (0-.9)^2) / 3, NOT (0.083 + 0.81) / 2.
    expect(card.brierScore).toBeCloseTo(((1 - 0.62) ** 2 + (1 - 0.85) ** 2 + 0.9 ** 2) / 3, 3);
  });

  it("matches gradeReport when only one report exists", () => {
    expect(overallScorecard([r16])).toEqual(gradeReport(r16));
  });
});
