import type { SportPlaybook } from "../types.js";

export const mlb: SportPlaybook = {
  sport: "baseball",
  phase: 1,
  leagues: ["MLB", "KBO", "NPB", "World Baseball Classic"],
  keywords: ["mlb", "baseball", "kbo", "npb", "world series", "home run"],
  factors: [
    { key: "pitching", label: "Starting pitcher matchup", weight: 1.0, description: "Both starters' recent xFIP/SIERA, pitch mix vs opposing lineup, times-through-order, workload" },
    { key: "bullpen", label: "Bullpen state", weight: 0.8, description: "Bullpen usage last 3 days, high-leverage arm availability, bullpen xFIP rankings" },
    { key: "lineup", label: "Lineup form and platoon edges", weight: 0.8, description: "wRC+ last 30 days, L/R platoon splits vs the starter, confirmed lineup card" },
    { key: "availability", label: "Injuries and roster moves", weight: 0.7, description: "IL updates, day-to-day stars, catcher rest days, recent call-ups" },
    { key: "park", label: "Ballpark factors", weight: 0.5, description: "Park run environment, dimensions vs lineup profile (KBO parks vary widely)" },
    { key: "conditions", label: "Weather", weight: 0.5, description: "Wind direction/speed (huge for totals), temperature, humidity, rain delay risk, roof status" },
    { key: "defense", label: "Defense and catching", weight: 0.4, description: "OAA/DRS, framing behind the plate, error-prone infields" },
    { key: "schedule", label: "Schedule and travel", weight: 0.5, description: "Getaway days, doubleheaders, cross-country travel, day game after night game" },
    { key: "umpire", label: "Umpire and officiating", weight: 0.2, description: "Home plate umpire zone size (affects totals more than sides)" },
    { key: "h2h", label: "Season series and familiarity", weight: 0.3, description: "Hitter vs pitcher history (small samples — weigh lightly), divisional familiarity" }
  ],
  researchChecklist: [
    "Confirmed starting pitchers and lineup cards",
    "Bullpen usage over the past 3 days for both teams",
    "Last-30-day offensive form, not season stats",
    "Weather and wind at the ballpark, roof status",
    "For KBO: foreign-pitcher rotations and travel schedule"
  ]
};
