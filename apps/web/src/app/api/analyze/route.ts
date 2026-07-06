import { NextResponse } from "next/server";
import {
  analyzeWithClaude,
  buildAnalysisPrompt,
  computeProbability,
  computeEdges,
  type EventInput,
  type FactorScore,
  type MarketQuote
} from "@saa/agent";

/**
 * POST /api/analyze
 * Body: {
 *   event: EventInput,
 *   factorScores?: FactorScore[],   // manual mode: you score the factors
 *   extraContext?: string,          // AI mode: fresh research you paste in
 *   quotes?: MarketQuote[]          // optional market prices to compute edges
 * }
 * With ANTHROPIC_API_KEY set and no factorScores, Claude scores the playbook.
 * Without it, returns the research prompt so you can score manually.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    event: EventInput;
    factorScores?: FactorScore[];
    extraContext?: string;
    quotes?: MarketQuote[];
  };

  try {
    if (body.factorScores && body.factorScores.length > 0) {
      const analysis = computeProbability(body.event, body.factorScores);
      return NextResponse.json(body.quotes ? computeEdges(analysis, body.quotes) : { analysis });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const analysis = await analyzeWithClaude(body.event, body.extraContext);
      return NextResponse.json(body.quotes ? computeEdges(analysis, body.quotes) : { analysis });
    }

    return NextResponse.json({
      analysis: null,
      hint: "No ANTHROPIC_API_KEY set and no factorScores provided. Use this prompt to research and score manually, then POST factorScores.",
      prompt: buildAnalysisPrompt(body.event)
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
