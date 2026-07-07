import type { SportPlaybook } from "../types.js";

export const nba: SportPlaybook = {
  sport: "basketball",
  phase: 1,
  leagues: ["NBA", "FIBA World Cup", "EuroLeague", "NCAA Basketball"],
  keywords: ["nba", "basketball", "fiba", "euroleague", "ncaab", "march madness"],
  factors: [
    { key: "availability", label: "Star availability", weight: 1.0, description: "Injury report, rest days (load management), minutes restrictions; the single biggest NBA factor" },
    { key: "form", label: "Team form and ratings", weight: 0.9, description: "Net rating last 10-15 games, offensive/defensive rating, quality of recent opponents" },
    { key: "matchup", label: "Stylistic matchup", weight: 0.7, description: "Pace, 3PT volume vs perimeter defense, rim protection vs paint scoring, rebounding edge" },
    { key: "keyplayers", label: "Star form", weight: 0.8, description: "Best player's recent usage/efficiency, matchup vs primary defender, playoff riser/faller history" },
    { key: "schedule", label: "Schedule spot", weight: 0.8, description: "Back-to-backs, 3-in-4s, road trip leg, travel miles, altitude (Denver/Utah)" },
    { key: "venue", label: "Home court", weight: 0.5, description: "Home/away splits, crowd, referee tendencies at home" },
    { key: "coaching", label: "Coaching and rotations", weight: 0.5, description: "ATO plays, rotation depth, adjustments in playoff series context" },
    { key: "motivation", label: "Motivation and context", weight: 0.4, description: "Seeding stakes, tanking, revenge spots, elimination games" },
    { key: "depth", label: "Bench and depth", weight: 0.5, description: "Bench net rating, drop-off when stars sit, foul-trouble resilience" },
    { key: "h2h", label: "Season series and history", weight: 0.3, description: "H2H this season, playoff history between cores" }
  ],
  researchChecklist: [
    "Injury/availability report as close to tip-off as possible",
    "Rest situation for both teams (B2B, 3-in-4)",
    "Last 10-15 game net ratings, not season-long records",
    "Starting lineups and any minutes restrictions",
    "For FIBA: naturalized players, roster continuity, travel/timezone"
  ]
};
