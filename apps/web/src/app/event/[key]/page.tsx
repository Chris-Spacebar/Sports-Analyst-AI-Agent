"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getEvent, pickProbability } from "@/lib/reports";
import NarrativeAnalysis from "@/components/NarrativeAnalysis";
import ThesisSection from "@/components/ThesisSection";
import { marketsForEvent, findTeam } from "@/lib/teamMatch";
import { edgeFor } from "@/lib/edge";
import { matchState } from "@/lib/kickoff";
import { pct, cents } from "@/lib/format";
import { useLiveListings } from "@/lib/useLiveListings";

export default function EventPage() {
  const params = useParams<{ key: string }>();
  const eventKey = decodeURIComponent(params.key);
  const event = getEvent(eventKey);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const { listings, errors, failed, loaded } = useLiveListings();
  const failedVenues = Object.keys(errors);
  const scanDegraded = failed || failedVenues.length > 0;

  useEffect(() => {
    if (event) document.title = `${event.match.matchup} | Sports Analyst AI Agent`;
  }, [event]);

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

  const edge = useMemo(() => {
    if (!event || event.match.result.settled) return undefined;
    return edgeFor(event.match, listings);
  }, [listings, event]);

  if (!event) {
    return (
      <div>
        <div className="banner error">Unknown event.</div>
        <Link href="/picks">← Picks</Link>
      </div>
    );
  }

  const { report, match } = event;
  const state = matchState(match, now);
  const founderP = pickProbability(match);
  const hit = match.result.settled && match.result.winner
    ? match.result.winner.toLowerCase() === match.predictedWinner.toLowerCase()
    : null;

  // Single-team propositions ("Will Spain reach the Quarterfinals?") don't name
  // both teams, so marketsForEvent misses them; surface the one the edge strip
  // compares against at the top of the table.
  const tableMarkets =
    edge && !eventMarkets.some((l) => l.id === edge.listing.id && l.venue === edge.listing.venue)
      ? [edge.listing, ...eventMarkets]
      : eventMarkets;

  const outcomeOptions = tableMarkets.map((l) => ({
    label: l.outcome ?? l.title,
    venue: l.venue,
    price: l.yesPrice
  }));

  return (
    <div>
      <p className="muted">
        <Link href="/picks">← Picks</Link>
      </p>
      <h1>{match.matchup}</h1>
      <div>
        <span className="tag sport">{report.sport}</span>
        <span className="tag">{report.competition} · {report.stage}</span>
        <span className="tag">{match.date}</span>
        {state === "settled" ? (
          <span className={hit ? "tag settled" : "tag missed"}>
            settled: {match.result.winner} advanced
          </span>
        ) : state === "played" ? (
          <span className="tag">played, grading in progress</span>
        ) : now ? (
          <span className="tag">kicks off {match.date}</span>
        ) : (
          <span className="tag">pending</span>
        )}
      </div>

      {state === "settled" && (
        <div className={hit ? "banner success" : "banner error"}>
          {hit
            ? `Prediction: ${match.predictedWinner} (${match.chanceToAdvance}). Correct.`
            : `Prediction: ${match.predictedWinner} (${match.chanceToAdvance}). Missed: ${match.result.winner} advanced.`}
        </div>
      )}

      {state === "played" && (
        <p className="played-note">
          Match played. Our pre-kickoff probability no longer applies; the result will be graded shortly.
        </p>
      )}

      {state === "upcoming" && (
        <>
          <div className="edge-strip">
            <div className="edge-cell">
              <div className="edge-num">{founderP != null ? pct(founderP) : match.chanceToAdvance}</div>
              <div className="muted">our probability that {match.predictedWinner} advances</div>
            </div>
            {edge ? (
              <>
                <div className="edge-cell">
                  <div className="edge-num">{cents(edge.marketPrice)}</div>
                  <div className="muted">market price ({edge.venue})</div>
                </div>
                <div className="edge-cell">
                  <div className={`edge-num ${edge.edgePts >= 3 ? "edge-pos" : edge.edgePts <= -3 ? "edge-neg" : ""}`}>
                    {edge.edgePts > 0 ? "+" : ""}
                    {edge.edgePts.toFixed(1)} pts
                  </div>
                  <div className="muted">{edge.verdict}</div>
                </div>
              </>
            ) : (
              <div className="edge-cell">
                <div className="muted">
                  {/* Never claim the market doesn't exist when the scan failed. */}
                  {!loaded
                    ? "loading live market price…"
                    : scanDegraded
                      ? "live prices unavailable right now; can't compare against the market"
                      : "no live market on this exact proposition (advancing) right now"}
                </div>
              </div>
            )}
          </div>
          <p className="muted">
            Edge is our probability minus the market price, in percentage points. Our opinion, not
            financial advice.
          </p>
          {/* A filled trade button only when we actually claim an edge; a plain link otherwise. */}
          {edge?.listing.url && (
            <p>
              {edge.edgePts >= 3 ? (
                <a className="trade-cta" href={edge.listing.url} target="_blank" rel="noreferrer">
                  Trade {match.predictedWinner} on {edge.venue} ↗
                </a>
              ) : (
                <a className="muted" href={edge.listing.url} target="_blank" rel="noreferrer">
                  View the {edge.venue} market ↗
                </a>
              )}
            </p>
          )}
        </>
      )}

      <div className="detail-grid">
        <div className="card">
          <h2>Prediction</h2>
          <div className="price">{match.predictedWinner}</div>
          <div className="muted">
            to advance · our probability {founderP != null ? pct(founderP) : match.chanceToAdvance} ·
            predicted {match.predictedScore}
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
          {failed && <p className="muted">live prices unavailable right now</p>}
          {!failed && failedVenues.length > 0 && (
            <p className="muted">some venues unavailable right now ({failedVenues.join(", ")})</p>
          )}
          {loaded && tableMarkets.length === 0 && !scanDegraded && (
            <p className="muted">No open market on this exact match right now (it may have settled).</p>
          )}
          {tableMarkets.length > 0 && (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>Outcome</th>
                    <th>Market price</th>
                    <th>Trade</th>
                  </tr>
                </thead>
                <tbody>
                  {tableMarkets.map((l) => (
                    <tr key={`${l.venue}:${l.id}`}>
                      <td>
                        <span className={`tag venue-${l.venue}`}>{l.venue}</span>
                      </td>
                      <td>
                        {l.outcome ?? l.title}
                        {edge?.listing.id === l.id && <span className="tag settled"> matches our pick</span>}
                      </td>
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
              <p className="muted">
                {"Prices track the crowd's probability: 52¢ means 52%. Careful: 'Reg Time' markets pay only on a win in 90 minutes. That is a different bet from advancing."}
              </p>
            </>
          )}
          {championOdds && (championOdds.a || championOdds.b) && (
            <p className="muted">
              Tournament champion odds (Hyperliquid): {match.teamA} {pct(championOdds.a?.yesPrice ?? null)} ·{" "}
              {match.teamB} {pct(championOdds.b?.yesPrice ?? null)}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Full analysis</h2>
        <NarrativeAnalysis match={match} />
      </div>

      <ThesisSection eventKey={eventKey} outcomeOptions={outcomeOptions} />
    </div>
  );
}
