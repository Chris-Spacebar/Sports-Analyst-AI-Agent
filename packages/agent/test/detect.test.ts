import { describe, expect, it } from "vitest";
import { PLAYBOOKS, detectSport, keywordMatches } from "../src/sports/index.js";

describe("detectSport", () => {
  it("matches soccer titles", () => {
    expect(detectSport("Will Manchester City win the Premier League?")).toBe("soccer");
    expect(detectSport("Mexico vs England — FIFA World Cup Round of 16")).toBe("soccer");
    expect(detectSport("Chelsea FC: top-4 finish?")).toBe("soccer");
    expect(detectSport("World Cup Game: USA vs Belgium Winner?")).toBe("soccer");
    expect(detectSport("Rugby World Cup Game: NZ vs France Winner?")).toBeUndefined();
  });

  it("matches NFL titles", () => {
    expect(detectSport("Chiefs vs Bills: NFL AFC Championship winner")).toBe("american_football");
    expect(detectSport("Who wins the Super Bowl?")).toBe("american_football");
  });

  it("matches NBA titles", () => {
    expect(detectSport("Lakers to win the NBA Finals")).toBe("basketball");
  });

  it("routes FIBA World Cup to basketball, not soccer", () => {
    expect(detectSport("FIBA World Cup: USA vs Serbia")).toBe("basketball");
  });

  it("matches MLB titles", () => {
    expect(detectSport("Yankees to win the World Series")).toBe("baseball");
    expect(detectSport("KBO: LG Twins vs Doosan Bears")).toBe("baseball");
  });

  it("does not claim other sports' World Cups or lookalike words", () => {
    expect(detectSport("Rugby World Cup 2027: Will New Zealand win?")).toBeUndefined();
    expect(detectSport("Cricket World Cup: India vs Australia")).toBeUndefined();
    expect(detectSport("Kickboxing title fight winner")).toBeUndefined();
    expect(detectSport("World Series of Poker 2026 Main Event winner")).toBeUndefined();
  });

  it("excludes lookalike leagues and entertainment markets", () => {
    expect(detectSport("Premier League Darts: final winner")).toBeUndefined();
    expect(detectSport("Indian Premier League: MI vs CSK winner")).toBeUndefined();
    expect(detectSport("Super Bowl Halftime Show performer 2027")).toBeUndefined();
    expect(detectSport("Who will headline the Super Bowl?")).toBeUndefined();
  });

  it("returns undefined for non-sports titles", () => {
    expect(detectSport("Will the Fed cut rates in September?")).toBeUndefined();
    expect(detectSport("2028 presidential election winner")).toBeUndefined();
  });
});

describe("keywordMatches", () => {
  it("matches whole words only, case-insensitively", () => {
    expect(keywordMatches("KBO: LG Twins", "kbo")).toBe(true);
    expect(keywordMatches("kickboxing bout", "kbo")).toBe(false);
    expect(keywordMatches("FC Barcelona win La Liga?", "fc")).toBe(true);
  });
});

describe("playbook data integrity", () => {
  it("has lowercase keywords (matchers lowercase titles, not keywords)", () => {
    for (const p of PLAYBOOKS) {
      for (const k of [...p.keywords, ...(p.excludeKeywords ?? [])]) {
        expect(k).toBe(k.toLowerCase());
      }
    }
  });

  it("has unique factor keys with weights in 0..1", () => {
    for (const p of PLAYBOOKS) {
      const keys = p.factors.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const f of p.factors) {
        expect(f.weight).toBeGreaterThan(0);
        expect(f.weight).toBeLessThanOrEqual(1);
      }
    }
  });

  it("has one playbook per sport", () => {
    const sports = PLAYBOOKS.map((p) => p.sport);
    expect(new Set(sports).size).toBe(sports.length);
  });
});
