export type Sport = "soccer" | "american_football" | "basketball" | "baseball";
export type Phase = 1 | 2 | 3 | 4;

/** A factor the agent researches and scores for a given matchup. */
export interface FactorSpec {
  key: string;
  label: string;
  /** Relative importance, 0..1. Tune these in the settings UI over time. */
  weight: number;
  /** What to research to score this factor. */
  description: string;
}

/** Score for one factor: -1 strongly favors side B, +1 strongly favors side A. */
export interface FactorScore {
  key: string;
  score: number;
  note?: string;
}

export interface SportPlaybook {
  sport: Sport;
  phase: Phase;
  leagues: string[];
  /** Lowercase keywords used to match prediction-market titles to this sport (whole-word match). */
  keywords: string[];
  /** Titles matching any of these are never classified as this sport (e.g. "poker" for baseball's "world series"). */
  excludeKeywords?: string[];
  factors: FactorSpec[];
  researchChecklist: string[];
}

export interface EventInput {
  /** e.g. "Mexico vs England — World Cup Round of 16" */
  title: string;
  sport: Sport;
  league?: string;
  startTime?: string;
  /** The outcome the model probability refers to (the YES side). */
  sideA: string;
  sideB: string;
}

export interface Analysis {
  event: EventInput;
  /** P(sideA wins / YES resolves), 0..1 */
  modelProbability: number;
  /** 0..1 — how much of the playbook's factor weight was actually scored. */
  confidence: number;
  factorScores: FactorScore[];
  narrative?: string;
  generatedAt: string;
}

export interface MarketQuote {
  venue: "kalshi" | "polymarket" | "hyperliquid";
  /** Price of YES, normalized 0..1 */
  yesPrice: number;
  url?: string;
}

export interface EdgeReport {
  analysis: Analysis;
  quotes: MarketQuote[];
  bestEdge?: { venue: string; edge: number; side: "YES" | "NO" };
}
