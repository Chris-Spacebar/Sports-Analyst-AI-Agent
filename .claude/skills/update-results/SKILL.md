---
name: update-results
description: Settle finished picks against verified results and refresh the freshness stamps for the Sports Analyst AI Agent site. Use when the user says update results, grade the picks, settle finished matches, run the daily update, or types /update-results.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebSearch
  - WebFetch
  - Bash
---

# /update-results

Grade every finished pick against verified results, snapshot market prices, and refresh the freshness stamps. Work from the repo root at /Users/kyunghojung/Sports-Analyst-AI-Agent.

Rules for everything you write in this session:
- Never type the em dash character (U+2014). Not in JSON, not in code, not in your summary. Use a comma, colon, period, or parentheses instead.
- Never guess a result. A pick settles only on verified facts.

## 1. Find unsettled picks

Read every report JSON in apps/web/src/content/reports/. List every match whose kickoffISO is in the past but whose result.settled is false. If a match has no kickoffISO, derive the kickoff time from its date, kickoff, and venue fields. If no matches qualify, say so and skip to step 4; the freshness stamps still need updating.

## 2. Verify each result on the web

For each listed match, research the final result. Requirements:

- At least two independent sources must agree on which team advanced. Independent means different outlets, not two pages of the same site.
- If the match went to extra time or penalties, the team that advanced is the winner, whatever the 90-minute score was.
- If sources conflict, or you cannot find two that agree, leave the pick pending (do not touch its result field) and say so explicitly in the final summary.
- Never guess. A pick left pending is fine; a wrongly settled pick is not.

## 3. Settle verified picks

For each verified match, set its result field to:

```json
{ "settled": true, "winner": "<team>" }
```

The winner string must exactly match the team name in that match's teamA or teamB field. Copy it, do not retype it. Grading compares result.winner to predictedWinner case-insensitively (see gradeReport in apps/web/src/lib/reports.ts), so any other spelling breaks the track record.

## 4. Snapshot market prices

GET http://localhost:3000/api/markets. If the dev server is not running, start it (npm run dev from the repo root) and wait until it responds. From the response, keep the listings relevant to events covered by the reports: match each listing title against the teams and competitions in the report matches. Save the kept listings, along with the scannedAt timestamp from the response, to apps/web/src/content/snapshots/YYYY-MM-DD.json using today's date. Create the snapshots directory if it does not exist. These snapshots let edge profitability be reconstructed later, so when unsure whether a listing is relevant, include it.

## 5. Refresh freshness stamps

In apps/web/src/content/meta.json:

- Set resultsUpdatedAt to today's date.
- Read nextReportNote. If it points at a report that has since been published, or a stage that has already finished, rewrite it to say what is actually next. Otherwise leave it alone.

## 6. Verify

From the repo root, run:

```bash
npm test
npm run typecheck
```

Both must pass. Then confirm the track record grades correctly: load http://localhost:3000/track-record and check that the settled and correct counts match what you graded in step 3.

## 7. Summarize

First search every file you touched for the em dash character and replace any you find. Then finish with a summary table of the picks graded this run: matchup, our call, result, correct or missed. Under the table, state the new overall record (correct out of settled, plus picks still pending) and list any picks left pending with the reason.
