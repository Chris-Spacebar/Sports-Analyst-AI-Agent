import { NextResponse } from "next/server";
import {
  analyzeWithClaude,
  buildAnalysisPrompt,
  computeProbability,
  computeEdges,
  getPlaybook,
  PLAYBOOKS,
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
  let body: {
    event?: EventInput;
    factorScores?: FactorScore[];
    extraContext?: string;
    quotes?: MarketQuote[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be valid JSON" }, { status: 400 });
  }

  const event = body.event;
  if (
    !event ||
    typeof event.title !== "string" ||
    typeof event.sideA !== "string" ||
    typeof event.sideB !== "string" ||
    !getPlaybook(event.sport)
  ) {
    return NextResponse.json(
      { error: `event must include title, sideA, sideB, and a sport with a playbook (${PLAYBOOKS.map((p) => p.sport).join(", ")})` },
      { status: 400 }
    );
  }

  if (body.quotes !== undefined && !Array.isArray(body.quotes)) {
    return NextResponse.json({ error: "quotes must be an array of market quotes" }, { status: 400 });
  }
  const quotes = (body.quotes ?? []).filter(
    (q) => q && typeof q === "object" && typeof q.yesPrice === "number" && q.yesPrice >= 0 && q.yesPrice <= 1
  );

  try {
    if (body.factorScores && body.factorScores.length > 0) {
      const analysis = computeProbability(event, body.factorScores);
      return NextResponse.json(quotes.length > 0 ? computeEdges(analysis, quotes) : { analysis });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const analysis = await analyzeWithClaude(event, body.extraContext);
      return NextResponse.json(quotes.length > 0 ? computeEdges(analysis, quotes) : { analysis });
    }

    return NextResponse.json({
      analysis: null,
      hint: "No ANTHROPIC_API_KEY set and no factorScores provided. Use this prompt to research and score manually, then POST factorScores.",
      prompt: buildAnalysisPrompt(event)
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Upstream (Anthropic) failures are not the client's fault.
    const status = message.startsWith("Anthropic API error") ? 502 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
