import type { SportPlaybook } from "../types.js";

export const soccer: SportPlaybook = {
  sport: "soccer",
  phase: 1,
  leagues: ["FIFA World Cup", "Premier League", "Champions League", "La Liga", "MLS"],
  keywords: ["soccer", "football club", "world cup", "premier league", "champions league", "la liga", "fifa", "mls", " fc ", "uefa"],
  factors: [
    { key: "form", label: "Recent form and results", weight: 0.9, description: "Last 5-10 competitive results, goals for/against, xG trend, quality of opposition faced" },
    { key: "squad", label: "Squad quality gap", weight: 1.0, description: "FIFA/Elo ranking gap, market value of XI, depth on the bench" },
    { key: "availability", label: "Injuries, suspensions, cards", weight: 0.9, description: "Players suspended for THIS match, players one yellow from a ban, injury/fitness doubts, who they replace" },
    { key: "tactics", label: "Tactical matchup", weight: 0.7, description: "Formations, pressing vs low block, set-piece strength vs weakness, style clash" },
    { key: "keyplayers", label: "Key player form", weight: 0.8, description: "Best player / player to watch on each side, current goal/assist form, fitness of the talisman" },
    { key: "venue", label: "Venue and crowd", weight: 0.6, description: "Home/neutral, effective home crowd, altitude, pitch, stadium record" },
    { key: "conditions", label: "Weather and conditions", weight: 0.4, description: "Heat, humidity, rain/storm risk, roof/climate control, kickoff time" },
    { key: "restTravel", label: "Rest and travel", weight: 0.6, description: "Days since last match, extra-time/shootout legs, travel distance and timezone" },
    { key: "h2h", label: "Head-to-head and history", weight: 0.3, description: "H2H record, psychological hexes, past tournament meetings" },
    { key: "stakes", label: "Motivation and stakes", weight: 0.4, description: "Momentum, pressure, must-win context, penalty shootout pedigree if knockout" }
  ],
  researchChecklist: [
    "Confirm the exact fixture, venue, kickoff time, and competition round",
    "Both teams' full tournament/season results with scores",
    "Suspensions for this match + players on yellow-card accumulation risk",
    "Injury list and probable lineups from at least two sources",
    "Coach, formation, tactical identity from recent matches",
    "Venue: capacity, roof, surface, altitude; weather forecast for match day",
    "Current odds from at least two books/models to compare against",
    "Golden Boot / top-scorer form for the player to watch"
  ]
};
