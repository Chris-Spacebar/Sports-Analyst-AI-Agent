import type { Analysis, EdgeReport, EventInput, FactorScore, MarketQuote } from "./types.js";
import { getPlaybook } from "./sports/index.js";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * Convert weighted factor scores into P(sideA).
 * Transparent linear map: weighted average score s in [-1, 1] -> 0.5 + 0.45s,
 * clamped to [0.03, 0.97] because no sports outcome is ever certain.
 */
export function computeProbability(event: EventInput, scores: FactorScore[]): Analysis {
  const playbook = getPlaybook(event.sport);
  if (!playbook) throw new Error(`No playbook for sport: ${event.sport}`);

  let weighted = 0;
  let usedWeight = 0;
  const totalWeight = playbook.factors.reduce((s, f) => s + f.weight, 0);

  for (const fs of scores) {
    const spec = playbook.factors.find((f) => f.key === fs.key);
    if (!spec) continue;
    weighted += spec.weight * clamp(fs.score, -1, 1);
    usedWeight += spec.weight;
  }

  const avg = usedWeight > 0 ? weighted / usedWeight : 0;
  const modelProbability = clamp(0.5 + 0.45 * avg, 0.03, 0.97);
  const confidence = totalWeight > 0 ? usedWeight / totalWeight : 0;

  return {
    event,
    modelProbability: Number(modelProbability.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    factorScores: scores,
    generatedAt: new Date().toISOString()
  };
}

/** Compare model probability against market quotes and find the best edge. */
export function computeEdges(analysis: Analysis, quotes: MarketQuote[]): EdgeReport {
  let best: EdgeReport["bestEdge"];
  for (const q of quotes) {
    const yesEdge = analysis.modelProbability - q.yesPrice;
    const noEdge = -yesEdge;
    const side: "YES" | "NO" = yesEdge >= noEdge ? "YES" : "NO";
    const edge = Math.max(yesEdge, noEdge);
    if (!best || edge > best.edge) {
      best = { venue: q.venue, edge: Number(edge.toFixed(3)), side };
    }
  }
  return { analysis, quotes, bestEdge: best };
}
