"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getReport, gradeReport } from "@/lib/reports";
import NarrativeAnalysis from "@/components/NarrativeAnalysis";
import Scorecard from "@/components/Scorecard";
import { groupListings, type Listing } from "@/lib/marketGroups";
import { findTeam } from "@/lib/teamMatch";
import { useLiveListings } from "@/lib/useLiveListings";

const pct = (p: number | null | undefined) => (p != null ? `${(p * 100).toFixed(1)}%` : "—");

export default function ReportPage() {
  const params = useParams<{ slug: string }>();
  const report = getReport(decodeURIComponent(params.slug));
  const { listings, failed, loaded } = useLiveListings();
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (report) document.title = `${report.title} — Sports Analyst AI Agent`;
  }, [report]);

  if (!report) {
    return (
      <div>
        <div className="banner error">Unknown report.</div>
        <Link href="/research">← Research</Link>
      </div>
    );
  }

  const champion: Listing[] | null = (() => {
    const g = groupListings(listings).find(
      (x) => x.venue === "hyperliquid" && x.title.toLowerCase().includes("world cup champion")
    );
    return g ? g.outcomes : null;
  })();

  const card = gradeReport(report);

  return (
    <div>
      <p className="muted">
        <Link href="/research">← Research</Link>
      </p>
      <h1>{report.title}</h1>
      <p className="subtitle">
        Published {report.publishedAt} · {report.preparedNote}
      </p>

      <div className="card">
        <h2>Report scorecard</h2>
        <Scorecard card={card} label={`${report.stage} picks, graded as markets settle`} />
      </div>

      <p>
        {report.xlsxPath && (
          <a href={report.xlsxPath} download className="button-link">
            ⬇ Download the full report (.xlsx)
          </a>
        )}{" "}
        <span className="muted">
          Trading features coming soon — trade these markets on Hyperliquid, Polymarket, or Kalshi.
        </span>
      </p>

      <div className="card">
        <h2>{report.stage} — the eight picks</h2>
        <p className="muted">
          {!loaded
            ? "loading live odds…"
            : champion
              ? `live Hyperliquid champion odds · ${champion.length} teams still listed`
              : failed
                ? "live odds unavailable right now"
                : "champion market not in the current scan"}
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Matchup</th>
                <th>Pick</th>
                <th>Our probability</th>
                <th>Predicted score</th>
                <th>Result</th>
                <th>Champion odds (live)</th>
              </tr>
            </thead>
            <tbody>
              {report.matches.map((m) => {
                const a = champion ? findTeam(champion, m.teamA) : undefined;
                const b = champion ? findTeam(champion, m.teamB) : undefined;
                const hit = m.result.settled && m.result.winner
                  ? m.result.winner.toLowerCase() === m.predictedWinner.toLowerCase()
                  : null;
                return (
                  <tr key={m.num}>
                    <td>{m.num}</td>
                    <td>
                      <Link href={`/event/${m.eventKey}`}>
                        <strong>{m.matchup}</strong>
                      </Link>
                      <div className="rationale">{m.rationale}</div>
                      <div className="muted">{m.date} · {m.kickoff}</div>
                    </td>
                    <td>
                      <strong>{m.predictedWinner}</strong>
                    </td>
                    <td>{m.chanceToAdvance}</td>
                    <td>{m.predictedScore}</td>
                    <td>
                      {m.result.settled ? (
                        <span className={hit ? "receipt-hit" : "receipt-miss"}>
                          {m.result.winner} {hit ? "✓" : "✗"}
                        </span>
                      ) : (
                        "pending"
                      )}
                    </td>
                    <td>
                      {champion
                        ? `${m.teamA}: ${a ? pct(a.yesPrice) : "out"} · ${m.teamB}: ${b ? pct(b.yesPrice) : "out"}`
                        : loaded
                          ? "—"
                          : "…"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Match-by-match analysis</h2>
        {report.matches.map((m, i) => (
          <details key={m.num} className="match-details" open={i === report.matches.findIndex((x) => !x.result.settled)}>
            <summary>
              <strong>
                {m.num}. {m.matchup}
              </strong>{" "}
              — pick: {m.predictedWinner} ({m.chanceToAdvance}), {m.predictedScore} ·{" "}
              <Link href={`/event/${m.eventKey}`}>event page →</Link>
            </summary>
            <NarrativeAnalysis match={m} />
          </details>
        ))}
      </div>

      <div className="card">
        <h2>Projected quarterfinals</h2>
        <ul>
          {report.projectedQuarterfinals.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        {report.howToRead && <p className="muted">{report.howToRead}</p>}
      </div>

      <div className="card">
        <h2>Ask the analyst</h2>
        <div className="ticket-wrap">
          <div className="coming-soon-overlay">
            <strong>Coming soon</strong>
            <p className="muted">
              Prompt-driven AI analysis is on the way. For now, dig into the report above.
            </p>
          </div>
          <div className="ticket-blur">
            <textarea
              className="prompt-box"
              rows={3}
              placeholder="Ask about a match, a team, or a market…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button disabled>Get analysis</button>
          </div>
        </div>
      </div>
    </div>
  );
}
