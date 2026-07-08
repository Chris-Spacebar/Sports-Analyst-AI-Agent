import { describe, expect, it } from "vitest";
import {
  computeForecasters,
  gradePick,
  gradeThesis,
  housePick,
  housePickFor,
  rollUpForecasters
} from "@/lib/community/grade";
import { overallScorecard } from "@/lib/reports";
import type { CommunityThesis, CommunityPick, GradedResult } from "@/lib/community/types";

const P = (outcome: string, side: "YES" | "NO", probability: number): CommunityPick => ({
  eventKey: "e",
  outcome,
  side,
  probability
});

const mkMatch = (teamA: string, teamB: string, result: { settled: boolean; winner?: string }) => ({
  teamA,
  teamB,
  result
});

// gradePick is the pure core: fixtures only, so settling real results never
// breaks it. gradeThesis just wires it to live report data (tested below).
describe("gradePick", () => {
  const match = mkMatch("Spain", "Portugal", { settled: true, winner: "Spain" });

  it("is not gradeable without a pick", () => {
    expect(gradePick(undefined, match)).toEqual({ settled: false, gradeable: false });
  });

  it("is not gradeable without a match", () => {
    expect(gradePick(P("Spain", "YES", 0.7), undefined)).toEqual({ settled: false, gradeable: false });
  });

  it("is not gradeable when the outcome names no team in the match", () => {
    expect(gradePick(P("France", "YES", 0.6), match)).toEqual({ settled: false, gradeable: false });
  });

  it("is gradeable but unsettled when the match has no result yet", () => {
    const open = mkMatch("Egypt", "Argentina", { settled: false });
    expect(gradePick(P("Argentina", "YES", 0.78), open)).toEqual({ settled: false, gradeable: true });
  });

  it("grades a settled YES pick that hits", () => {
    const g = gradePick(P("Spain", "YES", 0.7), match);
    expect(g).toMatchObject({ settled: true, gradeable: true, hit: true });
    expect(g.brier).toBeCloseTo(0.09, 10);
  });

  it("grades a settled YES pick that misses", () => {
    const g = gradePick(P("Portugal", "YES", 0.7), match);
    expect(g.hit).toBe(false);
    expect(g.brier).toBeCloseTo(0.49, 10);
  });

  it("grades a settled NO pick that hits (backing a team to not advance)", () => {
    const g = gradePick(P("Portugal", "NO", 0.58), match);
    expect(g.hit).toBe(true);
    expect(g.brier).toBeCloseTo(0.1764, 10);
  });

  it("grades a settled NO pick that misses", () => {
    const g = gradePick(P("Spain", "NO", 0.3), match);
    expect(g.hit).toBe(false);
    expect(g.brier).toBeCloseTo(0.09, 10);
  });

  it("matches the outcome team case-insensitively", () => {
    const g = gradePick(P("spain", "YES", 0.7), match);
    expect(g.gradeable).toBe(true);
    expect(g.hit).toBe(true);
  });
});

// Integration: gradeThesis delegates to gradePick over live report data. These
// lean only on permanently-settled Round of 16 facts (Spain advanced, Brazil
// did not), which do not change once graded.
describe("gradeThesis", () => {
  const thesis = (eventKey: string, pick?: CommunityPick): CommunityThesis => ({
    id: "t",
    eventKey,
    authorId: "a",
    handle: "@a",
    title: "t",
    body: "b",
    createdAt: "2026-07-06T00:00:00.000Z",
    pick,
    tail: 0,
    fade: 0,
    commentCount: 0
  });

  it("is not gradeable for an unknown event key", () => {
    expect(gradeThesis(thesis("nope", { eventKey: "nope", outcome: "Spain", side: "YES", probability: 0.6 }))).toEqual({
      settled: false,
      gradeable: false
    });
  });

  it("grades a hit against a settled event", () => {
    const g = gradeThesis(
      thesis("wc2026-r16-spain-portugal", { eventKey: "wc2026-r16-spain-portugal", outcome: "Spain", side: "YES", probability: 0.7 })
    );
    expect(g).toMatchObject({ settled: true, gradeable: true, hit: true });
  });

  it("grades a miss against a settled event", () => {
    const g = gradeThesis(
      thesis("wc2026-r16-brazil-norway", { eventKey: "wc2026-r16-brazil-norway", outcome: "Brazil", side: "YES", probability: 0.7 })
    );
    expect(g).toMatchObject({ settled: true, gradeable: true, hit: false });
  });
});

describe("housePickFor", () => {
  it("returns the desk winner and parsed probability", () => {
    expect(housePickFor("wc2026-r16-canada-morocco")).toEqual({ winner: "Morocco", probability: 0.62 });
  });

  it("returns null for an unknown event", () => {
    expect(housePickFor("nope")).toBeNull();
  });
});

// rollUpForecasters is pure: an injected grader and a pre-built house row, so
// the aggregation and sort are tested without any live report dependency.
describe("rollUpForecasters", () => {
  const th = (id: string, authorId: string, handle: string): CommunityThesis => ({
    id,
    eventKey: "e",
    authorId,
    handle,
    title: "t",
    body: "b",
    createdAt: "2026-07-06T00:00:00.000Z",
    tail: 0,
    fade: 0,
    commentCount: 0
  });

  const graded: Record<string, GradedResult> = {
    s1: { settled: true, gradeable: true, hit: true, brier: 0.09 },
    s2: { settled: true, gradeable: true, hit: true, brier: 0.0225 },
    w1: { settled: true, gradeable: true, hit: false, brier: 0.49 },
    p1: { settled: false, gradeable: true },
    i1: { settled: false, gradeable: false }
  };
  const grade = (t: CommunityThesis): GradedResult => graded[t.id] ?? { settled: false, gradeable: false };

  const house = {
    handle: "the desk",
    authorId: "house",
    settled: 5,
    correct: 3,
    pending: 1,
    brier: 0.2,
    isHouse: true
  };

  const theses = [
    th("s1", "dev_sharp", "@sharp"),
    th("s2", "dev_sharp", "@sharp"),
    th("w1", "dev_weak", "@weak"),
    th("p1", "dev_pend", "@pend"),
    th("i1", "dev_idle", "@idle")
  ];
  const rows = rollUpForecasters(theses, grade, house);

  it("aggregates settled, correct, pending and mean Brier per author", () => {
    expect(rows.find((r) => r.authorId === "dev_sharp")).toMatchObject({
      settled: 2,
      correct: 2,
      pending: 0,
      brier: 0.056
    });
    expect(rows.find((r) => r.authorId === "dev_weak")).toMatchObject({ settled: 1, correct: 0, brier: 0.49 });
    expect(rows.find((r) => r.authorId === "dev_pend")).toMatchObject({ settled: 0, pending: 1, brier: null });
    expect(rows.find((r) => r.authorId === "dev_idle")).toMatchObject({ settled: 0, pending: 0, brier: null });
  });

  it("includes the injected house row", () => {
    expect(rows.find((r) => r.authorId === "house")).toEqual(house);
  });

  it("sorts by Brier ascending, then pending-only, then idle rows last", () => {
    expect(rows.map((r) => r.authorId)).toEqual(["dev_sharp", "house", "dev_weak", "dev_pend", "dev_idle"]);
  });
});

describe("computeForecasters", () => {
  it("appends the house row scored on the live track record", () => {
    const house = computeForecasters([]).find((r) => r.isHouse);
    const desk = overallScorecard();
    expect(house).toMatchObject({
      handle: "the desk",
      settled: desk.settled,
      correct: desk.correct,
      pending: desk.pending,
      brier: desk.brierScore
    });
  });

  it("keeps the house row consistent with housePick", () => {
    expect(computeForecasters([]).find((r) => r.isHouse)).toEqual(housePick());
  });
});
