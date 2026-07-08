import wc2026RoundOf16 from "@/content/reports/wc2026-round-of-16.json";
import meta from "@/content/meta.json";

/**
 * Founder research reports: the content collection. Publishing a new report
 * means dropping a JSON file in src/content/reports (converted from the
 * founder's workbook) and importing it here; nothing else changes.
 */

export const SITE_META = meta as { resultsUpdatedAt: string; nextReportNote: string };

/** Below this many settled picks, calibration stats are noise, not signal. */
export const MIN_CALIBRATION_SAMPLE = 20;

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
  /** Required so state (upcoming/played) can always be derived; runtime guards still tolerate legacy data. */
  kickoffISO: string;
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

export interface CompetitionGroup {
  competition: string;
  matches: ReportMatch[];
}
export interface SportGroup {
  /** Internal sport key (e.g. "soccer"); display with sportLabel(). */
  sport: string;
  competitions: CompetitionGroup[];
}

/**
 * Reports grouped sport, then competition, then match, for cascading pickers
 * (choose a sport, then an event/competition, then the match). Extends for free
 * as new reports arrive: basketball with NBA and FIBA World Cup would appear as
 * one sport with two competitions the moment those reports exist.
 */
export function sportTree(reports: Report[] = REPORTS): SportGroup[] {
  const bySport = new Map<string, Map<string, ReportMatch[]>>();
  for (const r of reports) {
    let comps = bySport.get(r.sport);
    if (!comps) {
      comps = new Map();
      bySport.set(r.sport, comps);
    }
    const existing = comps.get(r.competition);
    if (existing) existing.push(...r.matches);
    else comps.set(r.competition, [...r.matches]);
  }
  return [...bySport.entries()].map(([sport, comps]) => ({
    sport,
    competitions: [...comps.entries()].map(([competition, matches]) => ({ competition, matches }))
  }));
}

export interface Scorecard {
  totalPicks: number;
  settled: number;
  correct: number;
  pending: number;
  /** Mean squared error of the stated advance probability vs the outcome (settled picks only). */
  brierScore: number | null;
}

export interface MatchNarrative {
  /** The hook, e.g. "The Iberian derby: the most complete team against Ronaldo's last stand". */
  oneLine?: string;
  /** The Final Verdict decision paragraph, the argument's conclusion. */
  decision?: string;
  sources?: string;
  /** Per-team pros/cons pulled from the Boosts and Hindrances section. */
  boosts?: {
    teamA: { plus?: string; minus?: string };
    teamB: { plus?: string; minus?: string };
  };
  /** Supporting-evidence sections (Team Comparison, Market view, H2H). */
  rest: ReportSection[];
  /** Venue/kickoff/conditions: appendix material, collapsed by default. */
  matchInfo?: ReportSection;
}

/**
 * Decompose a match's workbook sections into narrative order: verdict first,
 * argument second, evidence tables third, logistics last.
 */
export function matchNarrative(m: ReportMatch): MatchNarrative {
  const sections = m.sections ?? [];
  const find = (prefix: string) => sections.find((s) => s.name.toLowerCase().startsWith(prefix));
  const prediction = find("prediction");
  const verdict = find("final verdict");
  const boostsSec = find("boosts");
  const matchInfo = find("match info");
  const row = (sec: ReportSection | undefined, label: string) =>
    sec?.rows.find((r) => (r[0] ?? "").toLowerCase().startsWith(label))?.[1] ?? undefined;

  let boosts: MatchNarrative["boosts"];
  if (boostsSec) {
    const plus = boostsSec.rows.find((r) => (r[0] ?? "").toLowerCase().startsWith("boosts"));
    const minus = boostsSec.rows.find((r) => (r[0] ?? "").toLowerCase().startsWith("hindrances"));
    boosts = {
      teamA: { plus: plus?.[1] ?? undefined, minus: minus?.[1] ?? undefined },
      teamB: { plus: plus?.[2] ?? undefined, minus: minus?.[2] ?? undefined }
    };
  }

  const skip = new Set(
    [prediction?.name, verdict?.name, boostsSec?.name, matchInfo?.name].filter(Boolean) as string[]
  );
  return {
    oneLine: row(prediction, "in one line") ?? undefined,
    decision: row(verdict, "decision") ?? undefined,
    sources: row(verdict, "key sources") ?? undefined,
    boosts,
    rest: sections.filter((s) => !skip.has(s.name)),
    matchInfo
  };
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

/** Grade a report's picks against settled results: the founder's public track record. */
export const gradeReport = (report: Report): Scorecard => gradeMatches(report.matches);

/**
 * Combined scorecard across every published report, aggregated at the pick
 * level (a mean of per-report means would weight small reports too heavily).
 */
export const overallScorecard = (reports: Report[] = REPORTS): Scorecard =>
  gradeMatches(reports.flatMap((r) => r.matches));
