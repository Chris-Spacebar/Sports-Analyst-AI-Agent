import type { Sport, SportPlaybook } from "../types.js";
import { soccer } from "./soccer.js";
import { nfl } from "./nfl.js";
import { nba } from "./nba.js";
import { mlb } from "./mlb.js";

/**
 * Playbook registry. Phase 2-4 sports are added here as new modules:
 *  Phase 2: tennis, golf, boxing/MMA, weightlifting ...
 *  Phase 3: track and field, gymnastics, e-sports ...
 *  Phase 4: swimming, ice hockey, F1, extreme sports ...
 * The engine, market adapters, and UI need no changes — only new playbooks.
 */
export const PLAYBOOKS: SportPlaybook[] = [soccer, nfl, nba, mlb];

export function getPlaybook(sport: Sport): SportPlaybook | undefined {
  return PLAYBOOKS.find((p) => p.sport === sport);
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whole-word keyword match, so "kbo" does not match "kickboxing". */
export function keywordMatches(text: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword.trim())}\\b`).test(text.toLowerCase());
}

/** Match a market title to a sport using playbook keywords. */
export function detectSport(title: string): Sport | undefined {
  for (const p of PLAYBOOKS) {
    if (p.excludeKeywords?.some((k) => keywordMatches(title, k))) continue;
    if (p.keywords.some((k) => keywordMatches(title, k))) return p.sport;
  }
  return undefined;
}

export { soccer, nfl, nba, mlb };
