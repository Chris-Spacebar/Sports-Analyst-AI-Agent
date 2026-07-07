import { getEvent, overallScorecard, pickProbability } from "@/lib/reports";
import type { CommunityPick, CommunityThesis, ForecasterStat, GradedResult } from "./types";

/**
 * Grade one thesis against the settled report result. A pick is only
 * auto-gradeable when its outcome names one of the event's two teams: any
 * other outcome (a free-form note, a prop the report does not settle) stays
 * ungraded.
 */
export function gradeThesis(t: { eventKey: string; pick?: CommunityPick }): GradedResult {
  const pick = t.pick;
  if (!pick) return { settled: false, gradeable: false };

  const event = getEvent(t.eventKey);
  if (!event) return { settled: false, gradeable: false };

  const { match } = event;
  const outcome = pick.outcome.toLowerCase();
  const namesTeam = outcome === match.teamA.toLowerCase() || outcome === match.teamB.toLowerCase();
  if (!namesTeam) return { settled: false, gradeable: false };

  if (!match.result.settled || !match.result.winner) {
    return { settled: false, gradeable: true };
  }

  const yesHappened = match.result.winner.toLowerCase() === outcome;
  const hit = pick.side === "YES" ? yesHappened : !yesHappened;
  const brier = (pick.probability - (hit ? 1 : 0)) ** 2;
  return { settled: true, gradeable: true, hit, brier };
}

/**
 * The desk's own call for an event, used to show the crowd's picks against the
 * house line. Skips events whose stated advance probability cannot be parsed.
 */
export function housePickFor(eventKey: string): { winner: string; probability: number } | null {
  const event = getEvent(eventKey);
  if (!event) return null;
  const probability = pickProbability(event.match);
  if (probability == null) return null;
  return { winner: event.match.predictedWinner, probability };
}

/**
 * Roll every forecaster's theses into a leaderboard row, then append the house
 * as one more competitor scored on its published track record. Rows with a
 * settled Brier rank first (lower is better); rows carrying only pending picks
 * trail behind, and rows with nothing gradeable sit last.
 */
export function computeForecasters(theses: CommunityThesis[]): ForecasterStat[] {
  const byAuthor = new Map<string, CommunityThesis[]>();
  for (const t of theses) {
    const list = byAuthor.get(t.authorId);
    if (list) list.push(t);
    else byAuthor.set(t.authorId, [t]);
  }

  const rows: ForecasterStat[] = [];
  for (const [authorId, list] of byAuthor) {
    let settled = 0;
    let correct = 0;
    let pending = 0;
    let brierSum = 0;
    let brierN = 0;
    for (const t of list) {
      const g = gradeThesis(t);
      if (!g.gradeable) continue;
      if (!g.settled) {
        pending += 1;
        continue;
      }
      settled += 1;
      if (g.hit) correct += 1;
      if (typeof g.brier === "number") {
        brierSum += g.brier;
        brierN += 1;
      }
    }
    rows.push({
      handle: list[0].handle,
      authorId,
      settled,
      correct,
      pending,
      brier: brierN > 0 ? Number((brierSum / brierN).toFixed(3)) : null
    });
  }

  const desk = overallScorecard();
  rows.push({
    handle: "the desk",
    authorId: "house",
    settled: desk.settled,
    correct: desk.correct,
    pending: desk.pending,
    brier: desk.brierScore,
    isHouse: true
  });

  rows.sort((a, b) => {
    if (a.brier != null && b.brier != null) return a.brier - b.brier;
    if (a.brier != null) return -1;
    if (b.brier != null) return 1;
    // Neither has a Brier: whoever has picks in flight ranks ahead of the idle.
    if (a.pending !== b.pending) return b.pending - a.pending;
    return a.handle.localeCompare(b.handle);
  });

  return rows;
}
