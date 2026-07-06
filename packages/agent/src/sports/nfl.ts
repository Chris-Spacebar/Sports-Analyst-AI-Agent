import type { SportPlaybook } from "../types.js";

export const nfl: SportPlaybook = {
  sport: "american_football",
  phase: 1,
  leagues: ["NFL", "NCAA Football"],
  // "pro football" is Kalshi's NFL naming (e.g. "Dallas vs Seattle Pro Football game").
  keywords: ["nfl", "super bowl", "touchdown", "quarterback", "ncaaf", "college football", "pro football"],
  // "super bowl" alone also matches halftime-show music markets.
  excludeKeywords: ["halftime", "headline", "headliner"],
  factors: [
    { key: "qb", label: "Quarterback play", weight: 1.0, description: "Starting QB status, EPA/play, pressure-to-sack rate, backup risk" },
    { key: "form", label: "Team form and efficiency", weight: 0.9, description: "DVOA/EPA rankings, last 5 games, point differential, strength of schedule" },
    { key: "availability", label: "Injury report", weight: 0.9, description: "Official Wed-Fri injury designations (O/D/Q), OL injuries especially, IR returns" },
    { key: "matchup", label: "Scheme matchup", weight: 0.7, description: "Pass rush vs OL, coverage scheme vs receiving corps, run fits, coordinator tendencies" },
    { key: "coaching", label: "Coaching and situational edge", weight: 0.5, description: "4th-down aggressiveness, play-calling, timeout usage, prep advantage off bye" },
    { key: "venue", label: "Home field", weight: 0.5, description: "Home/away, dome vs outdoor, crowd noise (false starts), surface" },
    { key: "conditions", label: "Weather", weight: 0.5, description: "Wind (passing/kicking), rain/snow, extreme cold or heat for outdoor games" },
    { key: "restTravel", label: "Rest and travel", weight: 0.6, description: "Short week (TNF), off bye, cross-country travel, timezone" },
    { key: "trenches", label: "Line play", weight: 0.7, description: "OL/DL health and grades on both sides — games are won in the trenches" },
    { key: "turnovers", label: "Turnover and special teams variance", weight: 0.4, description: "Turnover margin sustainability, FG kicker reliability, return game" }
  ],
  researchChecklist: [
    "Confirm kickoff time, stadium (dome/outdoor), and weather forecast",
    "Final injury report and inactives when available",
    "QB situation on both sides, including backup quality",
    "Efficiency metrics (EPA/DVOA) for offense and defense",
    "Rest differential: bye weeks, Thursday/Monday games, travel",
    "Betting line movement and totals for market comparison"
  ]
};
