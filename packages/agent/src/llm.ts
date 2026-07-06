import type { Analysis, EventInput, FactorScore } from "./types.js";
import { getPlaybook } from "./sports/index.js";
import { computeProbability } from "./engine.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Build the research prompt for a matchup from its sport playbook. */
export function buildAnalysisPrompt(event: EventInput): string {
  const p = getPlaybook(event.sport);
  if (!p) throw new Error(`No playbook for sport: ${event.sport}`);
  const factors = p.factors
    .map((f) => `- ${f.key} (weight ${f.weight}): ${f.label} — ${f.description}`)
    .join("\n");
  return [
    `You are a rigorous sports analyst. Analyze this event for a prediction market.`,
    `Event: ${event.title}`,
    `Side A (YES): ${event.sideA} | Side B (NO): ${event.sideB}`,
    event.startTime ? `Start: ${event.startTime}` : "",
    ``,
    `Score each factor from -1 (strongly favors ${event.sideB}) to +1 (strongly favors ${event.sideA}).`,
    `Only score factors you have real information for; omit the rest.`,
    `Factors:\n${factors}`,
    ``,
    `Research checklist:\n${p.researchChecklist.map((c) => `- ${c}`).join("\n")}`,
    ``,
    `Respond with ONLY valid JSON:`,
    `{"factorScores":[{"key":"...","score":0.0,"note":"..."}],"narrative":"3-6 sentence verdict with the key reasons"}`
  ].join("\n");
}

/**
 * Score an event with Claude. Requires ANTHROPIC_API_KEY.
 * Note: the model scores from its knowledge + any context you pass in
 * `extraContext` (e.g. pasted injury reports, news). For live data, feed
 * fresh research in — garbage in, garbage out.
 */
export async function analyzeWithClaude(
  event: EventInput,
  extraContext?: string,
  apiKey = process.env.ANTHROPIC_API_KEY
): Promise<Analysis> {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — use manual factor scoring instead");

  const prompt = buildAnalysisPrompt(event) + (extraContext ? `\n\nFresh research context:\n${extraContext}` : "");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
  const text = data.content.find((b) => b.type === "text")?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Model did not return JSON");

  const parsed = JSON.parse(jsonMatch[0]) as { factorScores: FactorScore[]; narrative?: string };
  const analysis = computeProbability(event, parsed.factorScores);
  analysis.narrative = parsed.narrative;
  return analysis;
}
