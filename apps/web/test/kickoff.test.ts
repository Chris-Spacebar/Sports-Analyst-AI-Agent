import { describe, expect, it } from "vitest";
import { matchState, nextUpcoming, sortForDisplay } from "../src/lib/kickoff";
import type { ReportMatch } from "../src/lib/reports";

const mk = (over: Partial<ReportMatch>): ReportMatch => ({
  num: 1,
  date: "Tue Jul 7",
  matchup: "A vs B",
  teamA: "A",
  teamB: "B",
  venue: "Stadium",
  kickoff: "12:00 PM ET",
  weather: "clear",
  predictedWinner: "A",
  chanceToAdvance: "60%",
  predictedScore: "2-1 A",
  rationale: "test",
  eventKey: "a-b",
  kickoffISO: "2026-07-07T16:00:00Z",
  result: { settled: false },
  ...over
});

// The type requires kickoffISO, but legacy JSON may lack it; runtime guards must hold.
const noKickoff = { kickoffISO: undefined as unknown as string };

const NOW = new Date("2026-07-07T12:00:00Z");

describe("matchState", () => {
  it("is settled whenever the result is settled, regardless of now", () => {
    const m = mk({ result: { settled: true, winner: "A" }, kickoffISO: "2026-07-08T12:00:00Z" });
    expect(matchState(m, NOW)).toBe("settled");
    expect(matchState(m, null)).toBe("settled");
  });

  it("flips from upcoming to played exactly at kickoff", () => {
    const m = mk({ kickoffISO: "2026-07-07T12:00:00Z" });
    expect(matchState(m, new Date("2026-07-07T11:59:59Z"))).toBe("upcoming");
    expect(matchState(m, NOW)).toBe("played");
    expect(matchState(m, new Date("2026-07-07T12:00:01Z"))).toBe("played");
  });

  it("stays upcoming when now is null or kickoffISO is missing", () => {
    expect(matchState(mk({ kickoffISO: "2026-07-01T12:00:00Z" }), null)).toBe("upcoming");
    expect(matchState(mk({ kickoffISO: "2026-07-01T12:00:00Z" }))).toBe("upcoming");
    expect(matchState(mk(noKickoff), NOW)).toBe("upcoming");
  });
});

describe("nextUpcoming", () => {
  const past = mk({ eventKey: "past", kickoffISO: "2026-07-06T12:00:00Z" });
  const soon = mk({ eventKey: "soon", kickoffISO: "2026-07-07T16:00:00Z" });
  const later = mk({ eventKey: "later", kickoffISO: "2026-07-07T20:00:00Z" });
  const settled = mk({
    eventKey: "settled",
    kickoffISO: "2026-07-07T14:00:00Z",
    result: { settled: true, winner: "A" }
  });

  it("returns the earliest future unsettled kickoff", () => {
    expect(nextUpcoming([later, past, settled, soon], NOW)?.eventKey).toBe("soon");
  });

  it("skips settled and already-kicked-off matches", () => {
    expect(nextUpcoming([past, settled], NOW)).toBeUndefined();
  });

  it("ignores matches without kickoffISO", () => {
    expect(nextUpcoming([mk(noKickoff)], NOW)).toBeUndefined();
  });

  it("returns the earliest unsettled match when now is unknown", () => {
    expect(nextUpcoming([later, soon], null)?.eventKey).toBe("soon");
  });
});

describe("sortForDisplay", () => {
  it("orders upcoming by kickoff, then played by kickoff, then settled in original order", () => {
    const settledA = mk({ eventKey: "settled-a", result: { settled: true, winner: "A" } });
    const settledB = mk({ eventKey: "settled-b", result: { settled: true, winner: "B" } });
    const playedLate = mk({ eventKey: "played-late", kickoffISO: "2026-07-07T10:00:00Z" });
    const playedEarly = mk({ eventKey: "played-early", kickoffISO: "2026-07-06T10:00:00Z" });
    const upLate = mk({ eventKey: "up-late", kickoffISO: "2026-07-07T20:00:00Z" });
    const upSoon = mk({ eventKey: "up-soon", kickoffISO: "2026-07-07T16:00:00Z" });

    const sorted = sortForDisplay([settledA, upLate, playedLate, settledB, upSoon, playedEarly], NOW);
    expect(sorted.map((m) => m.eventKey)).toEqual([
      "up-soon",
      "up-late",
      "played-early",
      "played-late",
      "settled-a",
      "settled-b"
    ]);
  });

  it("treats every unsettled match as upcoming when now is null", () => {
    const played = mk({ eventKey: "played", kickoffISO: "2026-07-06T10:00:00Z" });
    const settled = mk({ eventKey: "settled", result: { settled: true, winner: "A" } });
    expect(sortForDisplay([settled, played], null).map((m) => m.eventKey)).toEqual([
      "played",
      "settled"
    ]);
  });
});
