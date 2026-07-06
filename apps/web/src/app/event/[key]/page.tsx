"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getEvent, pickProbability } from "@/lib/reports";
import ReportSections from "@/components/ReportSections";
import ThesisSection from "@/components/ThesisSection";
import { marketsForEvent, findTeam } from "@/lib/teamMatch";
import type { Listing } from "@/lib/marketGroups";

const pct = (p: number | null | undefined) => (p != null ? `${(p * 100).toFixed(1)}%` : "—");

export default function EventPage() {
  const params = useParams<{ key: string }>();
  const eventKey = decodeURIComponent(params.key);
  const event = getEvent(eventKey);

  const [listings, setListings] = useState<Listing[]>([]);
  const [scanNote, setScanNote] = useState("loading live prices…");

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((data: { listings: Listing[]; errors?: Record<string, string> }) => {
        setListings(data.listings ?? []);
        const failed = Object.keys(data.errors ?? {});
        // A venue error with zero listings must not read as "market settled".
        setScanNote(failed.length > 0 ? `some venues unavailable right now (${failed.join(", ")})` : "");
      })
      .catch(() => setScanNote("live prices unavailable right now"));
  }, []);

  const eventMarkets = useMemo(() => {
    if (!event) return [];
    return marketsForEvent(listings, event.match.teamA, event.match.teamB);
  }, [listings, event]);

  const championOdds = useMemo(() => {
    if (!event) return null;
    const champion = listings.filter(
      (l) => l.venue === "hyperliquid" && (l.group?.title ?? "").toLowerCase().includes("world cup champion")
    );
    if (champion.length === 0) return null;
    return {
      a: findTeam(champion, event.match.teamA),
      b: findTeam(champion, event.match.teamB)
    };
  }, [listings, event]);

  if (!event) {
    return (
      <div>
        <div className="banner error">Unknown event.</div>
        <Link href="/events">← All events</Link>
      </div>
    );
  }

  const { report, match } = event;
  const founderP = pickProbability(match);
  const hit = match.result.settled && match.result.winner
    ? match.result.winner.toLowerCase() === match.predictedWinner.toLowerCase()
    : null;

  const outcomeOptions = eventMarkets.map((l) => ({
    label: l.outcome ?? l.title,
    venue: l.venue,
    price: l.yesPrice
  }));

  return (
    <div>
      <p className="muted">
        <Link href="/events">← Events</Link>
      </p>
      <h1>{match.matchup}</h1>
      <div>
        <span className="tag sport">{report.sport}</span>
        <span className="tag">{report.competition} · {report.stage}</span>
        <span className="tag">{match.date}</span>
        {match.result.settled ? (
          <span className="tag settled">settled: {match.result.winner} advanced</span>
        ) : (
          <span className="tag">pending</span>
        )}
      </div>

      {match.result.settled && (
        <div className={hit ? "banner success" : "banner error"}>
          Founder pick: {match.predictedWinner} ({match.chanceToAdvance}) —{" "}
          {hit ? "CORRECT" : `missed (${match.result.winner} advanced)`}
        </div>
      )}

      <div className="detail-grid">
        <div className="card">
          <h2>Founder&apos;s call</h2>
          <div className="price">{match.predictedWinner}</div>
          <div className="muted">
            to advance · stated {founderP != null ? pct(founderP) : match.chanceToAdvance} · predicted{" "}
            {match.predictedScore}
          </div>
          <p>{match.rationale}</p>
          <p className="muted">
            {match.venue} · kickoff {match.kickoff} · {match.weather}
          </p>
          <p className="muted">
            From <Link href={`/research/${report.slug}`}>{report.stage} report</Link> · published{" "}
            {report.publishedAt}
          </p>
        </div>

        <div className="card">
          <h2>Live markets on this event</h2>
          {scanNote && <p className="muted">{scanNote}</p>}
          {!scanNote && eventMarkets.length === 0 && (
            <p className="muted">No open market on this exact match right now (it may have settled).</p>
          )}
          {eventMarkets.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Outcome</th>
                  <th>YES</th>
                  <th>Trade</th>
                </tr>
              </thead>
              <tbody>
                {eventMarkets.map((l) => (
                  <tr key={`${l.venue}:${l.id}`}>
                    <td>{l.venue}</td>
                    <td>{l.outcome ?? l.title}</td>
                    <td>{pct(l.yesPrice)}</td>
                    <td>
                      {l.url ? (
                        <a href={l.url} target="_blank" rel="noreferrer">
                          {l.venue} ↗
                        </a>
                      ) : (
                        <span className="muted">on venue</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {championOdds && (championOdds.a || championOdds.b) && (
            <p className="muted">
              Champion odds (HIP-4): {match.teamA} {pct(championOdds.a?.yesPrice ?? null)} ·{" "}
              {match.teamB} {pct(championOdds.b?.yesPrice ?? null)}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Founder&apos;s full analysis</h2>
        <ReportSections sections={match.sections} />
      </div>

      <ThesisSection eventKey={eventKey} outcomeOptions={outcomeOptions} />
    </div>
  );
}
