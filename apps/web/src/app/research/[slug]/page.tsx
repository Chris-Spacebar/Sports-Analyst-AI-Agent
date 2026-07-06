"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getReport, gradeReport } from "@/lib/reports";
import ReportSections from "@/components/ReportSections";
import Scorecard from "@/components/Scorecard";
import { groupListings, type Listing } from "@/lib/marketGroups";
import { findTeam } from "@/lib/teamMatch";

const pct = (p: number | null | undefined) => (p != null ? `${(p * 100).toFixed(1)}%` : "—");

export default function ReportPage() {
  const params = useParams<{ slug: string }>();
  const report = getReport(decodeURIComponent(params.slug));

  const [champion, setChampion] = useState<Listing[] | null>(null);
  const [scanNote, setScanNote] = useState("loading live odds…");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((data: { listings: Listing[] }) => {
        const g = groupListings(data.listings).find(
          (x) => x.venue === "hyperliquid" && x.title.toLowerCase().includes("world cup champion")
        );
        if (g) {
          setChampion(g.outcomes);
          setScanNote(`live HIP-4 champion odds · ${g.outcomes.length} teams still listed`);
        } else {
          setScanNote("HIP-4 champion market not in the current scan");
        }
      })
      .catch(() => setScanNote("live odds unavailable"));
  }, []);

  if (!report) {
    return (
      <div>
        <div className="banner error">Unknown report.</div>
        <Link href="/research">← Research</Link>
      </div>
    );
  }

  const card = gradeReport(report);

  return (
    <div>
      <p className="muted">
        <Link href="/research">← Research</Link>
      </p>
      <h1>{report.title}</h1>
      {report.preparedNote && <div className="banner">{report.preparedNote}</div>}
      <div className="banner">
        Trading features coming soon. Use Hyperliquid Outcome, Polymarket, or Kalshi to trade the markets.
      </div>

      <div className="card">
        <h2>Report scorecard</h2>
        <Scorecard card={card} label={`${report.stage} picks, graded as markets settle`} />
      </div>

      <div className="card">
        <h2>Ask the analyst</h2>
        <div className="ticket-wrap">
          <div className="coming-soon-overlay">
            <strong>Coming soon</strong>
            <p className="muted">
              Prompt-driven AI analysis is on the way. For now, dig into the report below.
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

      {report.xlsxPath && (
        <p>
          <a href={report.xlsxPath} download className="button-link">
            ⬇ Download the full report (.xlsx)
          </a>
        </p>
      )}

      <div className="card">
        <h2>{report.stage} — overview</h2>
        <p className="muted">{scanNote}</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Matchup</th>
                <th>Venue</th>
                <th>Kickoff</th>
                <th>Weather</th>
                <th>Pick</th>
                <th>Advance</th>
                <th>Score</th>
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
                    <td>{m.date}</td>
                    <td>
                      <Link href={`/event/${m.eventKey}`}>
                        <strong>{m.matchup}</strong>
                      </Link>
                      <div className="muted">{m.rationale}</div>
                    </td>
                    <td>{m.venue}</td>
                    <td>{m.kickoff}</td>
                    <td>{m.weather}</td>
                    <td>
                      <strong>{m.predictedWinner}</strong>
                    </td>
                    <td>{m.chanceToAdvance}</td>
                    <td>{m.predictedScore}</td>
                    <td>
                      {m.result.settled
                        ? `${m.result.winner} ${hit ? "✓" : "✗"}`
                        : "pending"}
                    </td>
                    <td>
                      {champion
                        ? `${m.teamA}: ${a ? pct(a.yesPrice) : "out"} · ${m.teamB}: ${b ? pct(b.yesPrice) : "out"}`
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
        {report.matches.map((m) => (
          <details key={m.num} className="match-details">
            <summary>
              <strong>
                {m.num}. {m.matchup}
              </strong>{" "}
              — pick: {m.predictedWinner} ({m.chanceToAdvance}), {m.predictedScore} ·{" "}
              <Link href={`/event/${m.eventKey}`}>event page →</Link>
            </summary>
            <ReportSections sections={m.sections} />
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
    </div>
  );
}
