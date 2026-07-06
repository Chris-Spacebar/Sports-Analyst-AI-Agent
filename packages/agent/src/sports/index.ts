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

/** Match a market title to a sport using playbook keywords. */
export function detectSport(title: string): Sport | undefined {
  const t = ` ${title.toLowerCase()} `;
  for (const p of PLAYBOOKS) {
    if (p.keywords.some((k) => t.includes(k))) return p.sport;
  }
  return undefined;
}

export { soccer, nfl, nba, mlb };
