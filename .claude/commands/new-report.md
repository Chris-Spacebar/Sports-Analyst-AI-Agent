---
description: Research and publish a new report for a stage or event
---

Research and publish a new founder report for: $ARGUMENTS

Work from the repo root at /Users/kyunghojung/Sports-Analyst-AI-Agent. The product promise is honest research and public grading, not winning. Write plainly. Short sentences. No hype.

Rules for everything you write in this session:
- Never type the em dash character (U+2014). Not in JSON strings, not in code, not in your summary. Use a comma, colon, period, or parentheses instead.
- Do not invent facts. Every claim in the report needs a source you actually read today.

## 1. Learn the schema

Read apps/web/src/lib/reports.ts for the exact Report and ReportMatch interfaces. Read apps/web/src/content/reports/wc2026-round-of-16.json in full as the structural example and match its shape:

- Each match has sections named Prediction, Match Info, evidence tables such as Team Comparison, Head-To-Head, Boosts and Hindrances (Pros / Cons), Market and Expert View, and Final Verdict.
- The Prediction section must contain rows labeled "Predicted winner (advances)", "Chance to advance", "Predicted score", and "In one line".
- The Final Verdict section must contain rows labeled "Decision" and "Key sources".

The row labels matter: matchNarrative() in reports.ts finds them by prefix. Fill every required field of the Report interface, including projectedQuarterfinals (the projected next-round ties; the schema keeps that field name for every stage).

## 2. Research every match

Deep-research each match in the stage. Cover: current form, injuries, suspensions and card risk, tactics and likely formations, venue, weather at kickoff, head-to-head history, and market odds. Cite the sources in each match's Key sources row. Do not rely on memory for anything that can change: squads, injuries, brackets, schedules, odds.

## 3. State probabilities

Write every "Chance to advance" value as "Team X% / Other Y%" with X + Y = 100. The predicted winner's name must sit next to its percentage; pickProbability() in reports.ts parses it that way. Chance to advance includes extra time and penalties.

## 4. Fill the required match fields

Every match needs:

- eventKey following the pattern wc2026-qf-teama-teamb (competition, stage code, lowercase team names, hyphenated).
- date, kickoff (local time with zone abbreviation), and kickoffISO. kickoffISO must carry the correct July 2026 offset for the venue: US Eastern -04:00, US Central -05:00, US Mountain -06:00, Arizona -07:00, US Pacific -07:00. Canadian venues follow the same daylight rules (Toronto -04:00, Vancouver -07:00). Mexican venues do not observe daylight saving (Mexico City, Guadalajara, Monterrey are all -06:00). Check the venue's zone before writing it.
- venue and weather.
- result set to { "settled": false }. Never invent a result; grading happens later via /update-results.

## 5. Publish

- Write the report JSON to apps/web/src/content/reports/<slug>.json with a slug like wc2026-quarterfinals.
- Set publishedAt to today's date and author to { "handle": "founder", "name": "Founder" }.
- In apps/web/src/lib/reports.ts, import the new JSON and prepend it to the REPORTS array. Newest first: the homepage features REPORTS[0].
- Update nextReportNote in apps/web/src/content/meta.json to say what comes after this report.

## 6. Verify

- Search everything you wrote for the em dash character. There must be none.
- Run npm test and npm run typecheck from the repo root. Both must pass.
- Start the dev server if needed (npm run dev) and load http://localhost:3000. Confirm the new report renders as the featured report.

## 7. Summarize

Finish with a summary of what was published: each matchup, the pick, the stated probabilities, and the predicted score.
