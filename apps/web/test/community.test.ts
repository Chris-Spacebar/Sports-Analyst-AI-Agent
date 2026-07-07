import { describe, expect, it } from "vitest";
import { computeForecasters, gradeThesis, housePickFor } from "@/lib/community/grade";
import type { CommunityThesis, CommunityPick } from "@/lib/community/types";

// Settled report facts these fixtures lean on (wc2026 Round of 16):
//   canada-morocco   winner Morocco   house 62%
//   france-paraguay  winner France    house 85%
//   brazil-norway    winner Norway    house 58%
//   mexico-england   winner England   house 52%
//   spain-portugal   winner Spain     house 64%
//   belgium-usa      winner Belgium   house 54%
//   egypt-argentina  UNSETTLED        house 80% (Argentina)
//   switzerland-colombia UNSETTLED    house 55% (Colombia)

function thesis(eventKey: string, pick?: CommunityPick, over: Partial<CommunityThesis> = {}): CommunityThesis {
  return {
    id: over.id ?? `t_${eventKey}_${pick?.outcome ?? "note"}`,
    eventKey,
    authorId: over.authorId ?? "dev_x",
    handle: over.handle ?? "@x",
    title: "t",
    body: "b",
    createdAt: over.createdAt ?? "2026-07-06T00:00:00.000Z",
    pick,
    tail: 0,
    fade: 0,
    commentCount: 0
  };
}

const pick = (eventKey: string, outcome: string, side: "YES" | "NO", probability: number): CommunityPick => ({
  eventKey,
  outcome,
  side,
  probability
});

describe("gradeThesis", () => {
  it("is not gradeable without a pick", () => {
    expect(gradeThesis({ eventKey: "wc2026-r16-spain-portugal" })).toEqual({
      settled: false,
      gradeable: false
    });
  });

  it("is not gradeable when the outcome names no team in the event", () => {
    const t = thesis("wc2026-r16-canada-morocco", pick("wc2026-r16-canada-morocco", "Spain", "YES", 0.6));
    expect(gradeThesis(t)).toEqual({ settled: false, gradeable: false });
  });

  it("is not gradeable for an unknown event key", () => {
    const t = thesis("nope", pick("nope", "Spain", "YES", 0.6));
    expect(gradeThesis(t)).toEqual({ settled: false, gradeable: false });
  });

  it("is gradeable but unsettled for an upcoming event", () => {
    const t = thesis(
      "wc2026-r16-egypt-argentina",
      pick("wc2026-r16-egypt-argentina", "Argentina", "YES", 0.78)
    );
    expect(gradeThesis(t)).toEqual({ settled: false, gradeable: true });
  });

  it("grades a settled YES pick that hits", () => {
    const t = thesis("wc2026-r16-spain-portugal", pick("wc2026-r16-spain-portugal", "Spain", "YES", 0.7));
    const g = gradeThesis(t);
    expect(g.settled).toBe(true);
    expect(g.gradeable).toBe(true);
    expect(g.hit).toBe(true);
    expect(g.brier).toBeCloseTo(0.09, 10);
  });

  it("grades a settled YES pick that misses", () => {
    const t = thesis("wc2026-r16-brazil-norway", pick("wc2026-r16-brazil-norway", "Brazil", "YES", 0.7));
    const g = gradeThesis(t);
    expect(g.settled).toBe(true);
    expect(g.hit).toBe(false);
    expect(g.brier).toBeCloseTo(0.49, 10);
  });

  it("grades a settled NO pick that hits (backing a team to NOT advance)", () => {
    // Canada did not advance (Morocco won), so NO on Canada is correct.
    const t = thesis("wc2026-r16-canada-morocco", pick("wc2026-r16-canada-morocco", "Canada", "NO", 0.58));
    const g = gradeThesis(t);
    expect(g.hit).toBe(true);
    expect(g.brier).toBeCloseTo(0.1764, 10);
  });

  it("grades a settled NO pick that misses", () => {
    // Spain advanced, so NO on Spain is wrong.
    const t = thesis("wc2026-r16-spain-portugal", pick("wc2026-r16-spain-portugal", "Spain", "NO", 0.3));
    const g = gradeThesis(t);
    expect(g.hit).toBe(false);
    expect(g.brier).toBeCloseTo(0.09, 10);
  });

  it("matches the outcome team case-insensitively", () => {
    const t = thesis("wc2026-r16-spain-portugal", pick("wc2026-r16-spain-portugal", "spain", "YES", 0.7));
    const g = gradeThesis(t);
    expect(g.gradeable).toBe(true);
    expect(g.hit).toBe(true);
  });
});

describe("housePickFor", () => {
  it("returns the desk winner and parsed probability", () => {
    expect(housePickFor("wc2026-r16-canada-morocco")).toEqual({ winner: "Morocco", probability: 0.62 });
  });

  it("returns the desk pick for an upcoming event", () => {
    expect(housePickFor("wc2026-r16-egypt-argentina")).toEqual({ winner: "Argentina", probability: 0.8 });
  });

  it("returns null for an unknown event", () => {
    expect(housePickFor("nope")).toBeNull();
  });
});

describe("computeForecasters", () => {
  const sharp = [
    thesis("wc2026-r16-spain-portugal", pick("wc2026-r16-spain-portugal", "Spain", "YES", 0.7), {
      authorId: "dev_sharp",
      handle: "@sharp"
    }),
    thesis("wc2026-r16-canada-morocco", pick("wc2026-r16-canada-morocco", "Morocco", "YES", 0.65), {
      authorId: "dev_sharp",
      handle: "@sharp"
    }),
    thesis("wc2026-r16-france-paraguay", pick("wc2026-r16-france-paraguay", "France", "YES", 0.8), {
      authorId: "dev_sharp",
      handle: "@sharp"
    })
  ];
  const weak = [
    thesis("wc2026-r16-brazil-norway", pick("wc2026-r16-brazil-norway", "Brazil", "YES", 0.7), {
      authorId: "dev_weak",
      handle: "@weak"
    }),
    thesis("wc2026-r16-mexico-england", pick("wc2026-r16-mexico-england", "Mexico", "YES", 0.6), {
      authorId: "dev_weak",
      handle: "@weak"
    })
  ];
  const pend = [
    thesis("wc2026-r16-egypt-argentina", pick("wc2026-r16-egypt-argentina", "Argentina", "YES", 0.78), {
      authorId: "dev_pend",
      handle: "@pend"
    })
  ];
  const idle = [
    thesis("wc2026-r16-spain-portugal", undefined, { authorId: "dev_idle", handle: "@idle", id: "idle_note" }),
    thesis("wc2026-r16-canada-morocco", pick("wc2026-r16-canada-morocco", "Nowhere", "YES", 0.5), {
      authorId: "dev_idle",
      handle: "@idle",
      id: "idle_bad"
    })
  ];

  const rows = computeForecasters([...sharp, ...weak, ...pend, ...idle]);

  it("aggregates settled, correct, pending and mean Brier per author", () => {
    const bySharp = rows.find((r) => r.authorId === "dev_sharp")!;
    expect(bySharp).toMatchObject({ handle: "@sharp", settled: 3, correct: 3, pending: 0 });
    expect(bySharp.brier).toBe(0.084);

    const byWeak = rows.find((r) => r.authorId === "dev_weak")!;
    expect(byWeak).toMatchObject({ settled: 2, correct: 0, pending: 0 });
    expect(byWeak.brier).toBe(0.425);

    const byPend = rows.find((r) => r.authorId === "dev_pend")!;
    expect(byPend).toMatchObject({ settled: 0, correct: 0, pending: 1, brier: null });

    const byIdle = rows.find((r) => r.authorId === "dev_idle")!;
    expect(byIdle).toMatchObject({ settled: 0, correct: 0, pending: 0, brier: null });
  });

  it("includes the house as a ranked row", () => {
    const house = rows.find((r) => r.authorId === "house")!;
    expect(house).toMatchObject({ handle: "the desk", isHouse: true, settled: 6, correct: 3, pending: 2 });
    expect(house.brier).toBe(0.199);
  });

  it("sorts by Brier ascending, then pending-only, then idle rows last", () => {
    const order = rows.map((r) => r.authorId);
    expect(order).toEqual(["dev_sharp", "house", "dev_weak", "dev_pend", "dev_idle"]);
  });
});
