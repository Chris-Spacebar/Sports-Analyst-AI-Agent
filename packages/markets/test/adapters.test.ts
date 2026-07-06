import { describe, expect, it } from "vitest";
import { matchesKeywords } from "../src/match.js";
import { prioritizeSeries, seriesMatches, toListing as kalshiToListing } from "../src/kalshi.js";
import { toListing as gammaToListing } from "../src/polymarket.js";
import { toListings as hipToListings } from "../src/hyperliquid.js";

// Fixtures mirror real API responses captured 2026-07-06.

describe("matchesKeywords", () => {
  it("is a whole-word, case-insensitive match", () => {
    expect(matchesKeywords("KBO: LG Twins vs Doosan Bears", ["kbo"])).toBe(true);
    expect(matchesKeywords("Kickboxing title fight", ["kbo"])).toBe(false);
    expect(matchesKeywords("nba finals", ["NBA"])).toBe(true); // keyword case-insensitive too
    expect(matchesKeywords("anything", [])).toBe(true);
    expect(matchesKeywords("anything", undefined)).toBe(true);
  });

  it("vetoes texts matching an exclude keyword", () => {
    expect(matchesKeywords("Premier League Darts final", ["premier league"], ["darts"])).toBe(false);
    expect(matchesKeywords("Premier League top scorer", ["premier league"], ["darts"])).toBe(true);
  });
});

describe("kalshi toListing", () => {
  it("parses the dollar-string fields the current API returns", () => {
    const listing = kalshiToListing({
      ticker: "KXNFLGAME-26SEP07-DET",
      event_ticker: "KXNFLGAME-26SEP07",
      title: "Lions to win?",
      last_price: null,
      yes_bid: null,
      last_price_dollars: "0.3260",
      yes_bid_dollars: "0.3190",
      yes_ask_dollars: "0.3360",
      volume_fp: "861.15",
      liquidity_dollars: "1250.50",
      close_time: "2026-09-08T04:59:00Z"
    } as never);
    expect(listing.yesPrice).toBe(0.326);
    expect(listing.volume).toBeCloseTo(861.15);
    expect(listing.liquidity).toBeCloseTo(1250.5);
    expect(listing.url).toBe("https://kalshi.com/markets/kxnflgame");
  });

  it("falls back to the bid/ask mid for untraded markets", () => {
    const listing = kalshiToListing({
      ticker: "KXTEST-26-A",
      title: "Untraded",
      last_price_dollars: "0.0000",
      yes_bid_dollars: "0.4000",
      yes_ask_dollars: "0.5000"
    });
    expect(listing.yesPrice).toBeCloseTo(0.45);
  });

  it("returns null when there is no price signal at all", () => {
    const listing = kalshiToListing({ ticker: "KXTEST-26-B", title: "Empty book" });
    expect(listing.yesPrice).toBeNull();
  });

  it("prefixes the series title so sport detection has league context", () => {
    const listing = kalshiToListing(
      { ticker: "KXMLBGAME-26JUL06-LAD", title: "Colorado vs Los Angeles D Winner?" },
      "Pro Baseball Game"
    );
    expect(listing.title).toBe("Pro Baseball Game: Colorado vs Los Angeles D Winner?");
  });
});

describe("kalshi series discovery", () => {
  const series = [
    { ticker: "KXNFLGAME", title: "Pro Football Game", tags: ["Football"] },
    { ticker: "KXMLBGAME", title: "Pro Baseball Game", tags: ["Baseball"] },
    { ticker: "KXMLBWINS-HOU", title: "Pro baseball wins Houston", tags: ["Baseball"] },
    { ticker: "KXWTAROE", title: "WTA Round of Elimination", tags: ["Tennis"] },
    { ticker: "KXECULPGAME", title: "Ecuador Liga Pro Game", tags: ["Soccer"] }
  ];
  const keywords = ["pro football", "baseball", "soccer", "fifa"];

  it("matches series via tags, titles, and ticker substrings", () => {
    expect(seriesMatches(series[0], keywords)).toBe(true); // "pro football" in title
    expect(seriesMatches(series[1], keywords)).toBe(true); // tag Baseball
    expect(seriesMatches(series[3], keywords)).toBe(false); // tennis
    expect(seriesMatches(series[3], undefined)).toBe(true); // no filter
    expect(seriesMatches({ ticker: "KXFIFAWGAME", title: "FIFA Women's Game", tags: ["Soccer"] }, keywords)).toBe(true);
  });

  it("does not let short keywords substring-match unrelated tickers", () => {
    // Real collisions from the live series list: "fc" is inside all of these.
    const junk = [
      { ticker: "KXUFCMOF", title: "UFC Main Event", tags: ["MMA"] },
      { ticker: "KXGOLFCAT", title: "Golf Category", tags: ["Golf"] },
      { ticker: "KXIIHFCHAMP", title: "Ice Hockey Champion", tags: ["Hockey"] },
      { ticker: "KXEWCMLBB", title: "Esports World Cup MLBB", tags: ["Esports"] }
    ];
    const soccerish = ["fc", "mls", "soccer", "mlb"];
    for (const s of junk) expect(seriesMatches(s, soccerish)).toBe(false);
  });

  it("vetoes series matching exclude keywords", () => {
    const ipl = { ticker: "KXIPLGAME", title: "Indian Premier League Game", tags: ["Cricket"] };
    expect(seriesMatches(ipl, ["premier league"])).toBe(true);
    expect(seriesMatches(ipl, ["premier league"], ["cricket", "indian premier league"])).toBe(false);
  });

  it("prioritizes game series round-robin across sports", () => {
    const picked = prioritizeSeries(series.filter((s) => seriesMatches(s, keywords)), 3);
    expect(picked.map((s) => s.ticker)).toEqual(["KXMLBGAME", "KXNFLGAME", "KXECULPGAME"]);
  });

  it("visits larger tag groups first so one-off junk tags cannot displace real sports", () => {
    const mixed = [
      { ticker: "KXSBHEADLINE", title: "Super Bowl Headliner", tags: ["Live Music"] },
      { ticker: "KXEPLGAME", title: "EPL Game", tags: ["Soccer"] },
      { ticker: "KXUCLGAME", title: "UEFA Champions League Game", tags: ["Soccer"] },
      { ticker: "KXLALIGAGAME", title: "La Liga Game", tags: ["Soccer"] }
    ];
    const picked = prioritizeSeries(mixed, 3);
    expect(picked.filter((s) => s.tags?.[0] === "Soccer").length).toBe(2);
    expect(picked[0].tags?.[0]).toBe("Soccer");
  });
});

describe("polymarket toListing", () => {
  it("uses the YES outcome price for binary markets", () => {
    const listing = gammaToListing({
      id: "123",
      question: "Will Mexico win the 2026 FIFA World Cup?",
      slug: "mexico-world-cup",
      outcomes: '["Yes","No"]',
      outcomePrices: '["0.62","0.38"]',
      volumeNum: 137789512,
      liquidityNum: 500000
    });
    expect(listing.yesPrice).toBe(0.62);
    expect(listing.volume).toBe(137789512);
    expect(listing.url).toBe("https://polymarket.com/market/mexico-world-cup");
  });

  it("returns null yesPrice for moneyline (team-name) outcomes", () => {
    const listing = gammaToListing({
      id: "456",
      question: "BPL: Chattogram Challengers vs Durbar Rajshahi",
      outcomes: '["Chattogram Challengers","Durbar Rajshahi"]',
      outcomePrices: '["0.505","0.495"]'
    });
    expect(listing.yesPrice).toBeNull();
  });

  it("survives malformed outcome JSON", () => {
    const listing = gammaToListing({ id: "789", question: "Broken", outcomePrices: "not json" });
    expect(listing.yesPrice).toBeNull();
  });
});

describe("hyperliquid toListings", () => {
  const meta = {
    outcomes: [
      { outcome: 173, name: "Argentina", description: "Resolves Yes if Argentina is declared the 2026 FIFA World Cup champion.", quoteToken: "USDC" },
      { outcome: 178, name: "Brazil", description: "Resolves Yes if Brazil is declared the 2026 FIFA World Cup champion.", quoteToken: "USDC" },
      { outcome: 172, name: "Settled Team", description: "Already resolved." }
    ],
    questions: [
      {
        question: 32,
        name: "2026 World Cup Champion",
        fallbackOutcome: 171,
        namedOutcomes: [173, 178, 172],
        settledNamedOutcomes: [172]
      }
    ]
  };
  const mids = { "#1730": "0.17142", "#1731": "0.82858", "#1780": "0.21000" };

  it("joins outcomeMeta with allMids YES symbols and skips settled outcomes", () => {
    const listings = hipToListings(meta, mids);
    expect(listings).toHaveLength(2);
    const argentina = listings.find((l) => l.title.includes("Argentina"));
    expect(argentina?.id).toBe("#1730");
    expect(argentina?.yesPrice).toBeCloseTo(0.17142);
    expect(listings.some((l) => l.title.includes("Settled Team"))).toBe(false);
  });

  it("matches keywords against title and description", () => {
    const listings = hipToListings(meta, mids, { keywords: ["fifa world cup"] });
    expect(listings).toHaveLength(2);
    expect(hipToListings(meta, mids, { keywords: ["nba"] })).toHaveLength(0);
  });

  it("returns null price when the mid symbol is missing", () => {
    const listings = hipToListings(meta, { "#1730": "0.17142" });
    const brazil = listings.find((l) => l.title.includes("Brazil"));
    expect(brazil?.yesPrice).toBeNull();
  });
});
