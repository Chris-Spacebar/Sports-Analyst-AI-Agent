import { NextResponse } from "next/server";
import { REPORTS } from "@/lib/reports";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

interface AnalystRequest {
  prompt?: string;
  /** Optional live odds the client already has, e.g. [{ team, price }]. */
  liveOdds?: Array<{ team?: string; price?: number | null }>;
}

/** Overview lines for every published report; full sections only for matches the prompt mentions. */
function buildContext(prompt: string, liveOdds: AnalystRequest["liveOdds"]): string {
  const p = prompt.toLowerCase();
  const lines: string[] = [];

  for (const report of REPORTS) {
    lines.push(`REPORT: ${report.title}`, report.preparedNote ?? "");
    lines.push(`\n${report.stage.toUpperCase()} OVERVIEW:`);
    for (const m of report.matches) {
      lines.push(
        `${m.num}. ${m.date}: ${m.matchup} @ ${m.venue}, ${m.kickoff}. Weather: ${m.weather}. ` +
          `Pick: ${m.predictedWinner} (${m.chanceToAdvance}), predicted ${m.predictedScore}. ` +
          `${m.result.settled ? `RESULT: ${m.result.winner} advanced. ` : ""}${m.rationale}`
      );
    }
    lines.push(`\nPROJECTED QUARTERFINALS: ${report.projectedQuarterfinals.join(" | ")}`);

    const mentioned = report.matches.filter(
      (m) => p.includes(m.teamA.toLowerCase()) || p.includes(m.teamB.toLowerCase())
    );
    for (const m of mentioned) {
      lines.push(`\nFULL ANALYSIS (${m.matchup}):`);
      for (const s of m.sections ?? []) {
        lines.push(`[${s.name}]`);
        for (const row of s.rows) {
          lines.push(row.filter((c) => c != null).join(": "));
        }
      }
    }
  }

  if (liveOdds && liveOdds.length > 0) {
    const odds = liveOdds
      .filter((o) => o.team && o.price != null)
      .map((o) => `${o.team}: ${((o.price as number) * 100).toFixed(1)}%`)
      .join(", ");
    if (odds) lines.push(`\nLIVE HIP-4 CHAMPION ODDS RIGHT NOW: ${odds}`);
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  let body: AnalystRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be valid JSON" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (prompt.length === 0 || prompt.length > 2000) {
    return NextResponse.json({ error: "prompt must be 1-2000 characters" }, { status: 400 });
  }
  if (body.liveOdds !== undefined && !Array.isArray(body.liveOdds)) {
    return NextResponse.json({ error: "liveOdds must be an array" }, { status: 400 });
  }
  // Client-supplied strings reach the system prompt: keep them small and typed.
  const liveOdds = (body.liveOdds ?? [])
    .filter((o) => o && typeof o === "object" && typeof o.team === "string" && typeof o.price === "number")
    .slice(0, 64)
    .map((o) => ({ team: (o.team as string).slice(0, 60), price: o.price }));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      analysis: null,
      configured: false,
      hint: "Set ANTHROPIC_API_KEY in apps/web/.env to enable AI-written analysis. The Round of 16 report on this page is available without a key."
    });
  }

  const system = [
    "You are the sports analyst behind this prediction-market dashboard (Kalshi, Polymarket, Hyperliquid HIP-4).",
    "Today is during the 2026 FIFA World Cup Round of 16 window (July 4-7, 2026).",
    "Ground your answer in the research report provided below; be direct, give probabilities where sensible,",
    "explain the key factors (form, availability, tactics, venue, weather, rest), and note uncertainty honestly.",
    "You cover soccer, NFL, NBA, and MLB. This is analysis for information, not financial advice.",
    "",
    buildContext(prompt, liveOdds)
  ].join("\n");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      // Adaptive thinking is on by default and shares this budget with the answer.
      max_tokens: 16000,
      system,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Anthropic API error ${res.status}: ${await res.text()}` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
    stop_reason?: string;
  };
  if (data.stop_reason === "max_tokens") {
    return NextResponse.json({ error: "analysis truncated; try a narrower question" }, { status: 502 });
  }
  const analysis = data.content
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n");

  return NextResponse.json({ analysis, configured: true });
}
