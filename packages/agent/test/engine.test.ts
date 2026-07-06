import { describe, expect, it } from "vitest";
import { computeEdges, computeProbability } from "../src/engine.js";
import type { EventInput, MarketQuote } from "../src/types.js";

const event: EventInput = {
  title: "Mexico vs England — World Cup Round of 16",
  sport: "soccer",
  sideA: "Mexico",
  sideB: "England"
};

describe("computeProbability", () => {
  it("returns 0.5 with zero confidence when no factors are scored", () => {
    const a = computeProbability(event, []);
    expect(a.modelProbability).toBe(0.5);
    expect(a.confidence).toBe(0);
  });

  it("maps a uniformly maximal score to the 0.95 linear ceiling", () => {
    const a = computeProbability(event, [
      { key: "form", score: 1 },
      { key: "squad", score: 1 }
    ]);
    expect(a.modelProbability).toBe(0.95);
  });

  it("clamps out-of-range factor scores to [-1, 1]", () => {
    const a = computeProbability(event, [{ key: "form", score: 5 }]);
    expect(a.modelProbability).toBe(0.95);
  });

  it("counts duplicate factor keys once (first occurrence wins)", () => {
    const once = computeProbability(event, [{ key: "form", score: 1 }]);
    const duped = computeProbability(event, [
      { key: "form", score: 1 },
      { key: "form", score: 1 },
      { key: "form", score: -1 }
    ]);
    expect(duped.modelProbability).toBe(once.modelProbability);
    expect(duped.confidence).toBe(once.confidence);
    expect(duped.confidence).toBeLessThanOrEqual(1);
  });

  it("skips non-finite scores instead of propagating NaN", () => {
    const a = computeProbability(event, [
      { key: "form", score: Number.NaN },
      { key: "squad", score: 1 }
    ]);
    expect(a.modelProbability).toBe(0.95);
    expect(Number.isFinite(a.confidence)).toBe(true);
  });

  it("ignores unknown factor keys and reflects that in confidence", () => {
    const a = computeProbability(event, [{ key: "not_a_factor", score: 1 }]);
    expect(a.modelProbability).toBe(0.5);
    expect(a.confidence).toBe(0);
  });

  it("computes confidence as the scored share of total factor weight", () => {
    const a = computeProbability(event, [
      { key: "form", score: 0 }, // weight 0.9
      { key: "squad", score: 0 } // weight 1.0
    ]);
    // soccer playbook total weight = 6.6
    expect(a.confidence).toBeCloseTo(1.9 / 6.6, 2);
  });

  it("throws for a sport without a playbook", () => {
    expect(() => computeProbability({ ...event, sport: "curling" as EventInput["sport"] }, [])).toThrow(
      /No playbook/
    );
  });
});

describe("computeEdges", () => {
  const analysis = computeProbability(event, [
    { key: "form", score: 1 },
    { key: "squad", score: 1 }
  ]); // modelProbability 0.95

  it("returns no bestEdge when there are no quotes", () => {
    expect(computeEdges(analysis, []).bestEdge).toBeUndefined();
  });

  it("flags YES when the model is above the market price", () => {
    const quotes: MarketQuote[] = [{ venue: "kalshi", yesPrice: 0.8 }];
    const report = computeEdges(analysis, quotes);
    expect(report.bestEdge).toEqual({ venue: "kalshi", edge: 0.15, side: "YES" });
  });

  it("flags NO when the model is below the market price", () => {
    const low = computeProbability(event, [
      { key: "form", score: -1 },
      { key: "squad", score: -1 }
    ]); // 0.05
    const report = computeEdges(low, [{ venue: "polymarket", yesPrice: 0.3 }]);
    expect(report.bestEdge).toEqual({ venue: "polymarket", edge: 0.25, side: "NO" });
  });

  it("picks the venue with the largest edge", () => {
    const quotes: MarketQuote[] = [
      { venue: "kalshi", yesPrice: 0.9 },
      { venue: "polymarket", yesPrice: 0.7 }
    ];
    expect(computeEdges(analysis, quotes).bestEdge?.venue).toBe("polymarket");
  });
});
