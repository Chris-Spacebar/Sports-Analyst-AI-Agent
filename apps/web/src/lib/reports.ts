import wc2026RoundOf16 from "@/content/reports/wc2026-round-of-16.json";

/**
 * Founder research reports — the content collection. Publishing a new report
 * means dropping a JSON file in src/content/reports (converted from the
 * founder's workbook) and importing it here; nothing else changes.
 */

export interface ReportSection {
  name: string;
  rows: (string | null)[][];
}

export interface ReportMatch {
  num: number;
  date: string;
  matchup: string;
  teamA: string;
  teamB: string;
  venue: string;
  kickoff: string;
  weather: string;
  predictedWinner: string;
  chanceToAdvance: string;
  predictedScore: string;
  rationale: string;
  eventKey: string;
  result: { settled: boolean; winner?: string };
  sheetTitle?: string;
  sections?: ReportSection[];
}

export interface Report {
  id: string;
  slug: string;
  sport: string;
  competition: string;
  stage: string;
  title: string;
  preparedNote?: string;
  howToRead?: string;
  publishedAt: string;
  author: { handle: string; name: string };
  xlsxPath?: string;
  projectedQuarterfinals: string[];
  matches: ReportMatch[];
}

export const REPORTS: Report[] = [wc2026RoundOf16 as Report];

export const getReport = (slug: string): Report | undefined =>
  REPORTS.find((r) => r.slug === slug);

export const getEvent = (
  eventKey: string
): { report: Report; match: ReportMatch } | undefined => {
  for (const report of REPORTS) {
    const match = report.matches.find((m) => m.eventKey === eventKey);
    if (match) return { report, match };
  }
  return undefined;
};

export interface Scorecard {
  totalPicks: number;
  settled: number;
  correct: number;
  pending: number;
  /** Mean squared error of the stated advance probability vs the outcome (settled picks only). */
  brierScore: number | null;
}

/** Parse "62%" or "Spain 64% / Portugal 36%" into the predicted winner's probability, 0..1. */
export function pickProbability(m: ReportMatch): number | null {
  const text = m.chanceToAdvance ?? "";
  const named = new RegExp(`${m.predictedWinner}\\s*(\\d+(?:\\.\\d+)?)%`, "i").exec(text);
  const bare = /(\d+(?:\.\d+)?)%/.exec(text);
  const pct = named ? Number(named[1]) : bare ? Number(bare[1]) : NaN;
  return Number.isFinite(pct) ? pct / 100 : null;
}

/** Pick-level grading over any set of matches; Brier is rounded once, at the end. */
function gradeMatches(matches: ReportMatch[]): Scorecard {
  let settled = 0;
  let correct = 0;
  let brierSum = 0;
  let brierN = 0;
  for (const m of matches) {
    if (!m.result.settled || !m.result.winner) continue;
    settled += 1;
    const hit = m.result.winner.toLowerCase() === m.predictedWinner.toLowerCase();
    if (hit) correct += 1;
    const p = pickProbability(m);
    if (p != null) {
      const outcome = hit ? 1 : 0;
      brierSum += (p - outcome) ** 2;
      brierN += 1;
    }
  }
  return {
    totalPicks: matches.length,
    settled,
    correct,
    pending: matches.length - settled,
    brierScore: brierN > 0 ? Number((brierSum / brierN).toFixed(3)) : null
  };
}

/** Grade a report's picks against settled results — the founder's public track record. */
export const gradeReport = (report: Report): Scorecard => gradeMatches(report.matches);

/**
 * Combined scorecard across every published report, aggregated at the pick
 * level (a mean of per-report means would weight small reports too heavily).
 */
export const overallScorecard = (reports: Report[] = REPORTS): Scorecard =>
  gradeMatches(reports.flatMap((r) => r.matches));
