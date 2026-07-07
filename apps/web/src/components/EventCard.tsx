import Link from "next/link";
import type { Listing } from "@/lib/marketGroups";
import { edgeFor } from "@/lib/edge";
import { matchState } from "@/lib/kickoff";
import { pct } from "@/lib/format";
import type { ReportMatch } from "@/lib/reports";

/**
 * One event as a story arc: pick + conviction + market price while pending,
 * a graded receipt (✓/✗) once settled.
 */
export default function EventCard({
  sport,
  match,
  listings,
  now
}: {
  sport: string;
  match: ReportMatch;
  listings?: Listing[];
  now?: Date | null;
}) {
  const state = matchState(match, now);
  const hit =
    state === "settled" && match.result.winner
      ? match.result.winner.toLowerCase() === match.predictedWinner.toLowerCase()
      : null;
  const edge = state === "upcoming" && listings && listings.length > 0 ? edgeFor(match, listings) : undefined;

  return (
    <Link href={`/event/${match.eventKey}`} className="card market-card">
      <div>
        <span className="tag sport">{sport}</span>
        {state === "settled" ? (
          hit ? (
            <span className="tag settled">✓ Correct</span>
          ) : (
            <span className="tag missed">✗ Missed</span>
          )
        ) : state === "played" ? (
          <span className="tag">played, grading in progress</span>
        ) : now ? (
          <span className="tag">kicks off {match.date}</span>
        ) : (
          <span className="tag">pending</span>
        )}
      </div>
      <h2>{match.matchup}</h2>
      {state === "settled" ? (
        <div className={hit ? "receipt-hit" : "receipt-miss"}>
          {hit
            ? `✓ ${match.result.winner} advanced. Called it at ${match.chanceToAdvance}.`
            : `✗ ${match.result.winner} advanced. We had ${match.predictedWinner} at ${match.chanceToAdvance}.`}
        </div>
      ) : state === "played" ? (
        <div className="played-note">
          Our pre-kickoff call: {match.predictedWinner} {match.chanceToAdvance}.
        </div>
      ) : (
        <div className="call-line">
          Our call: <strong>{match.predictedWinner}</strong> {match.chanceToAdvance}
          {edge ? ` vs market ${pct(edge.marketPrice)}` : ""}
        </div>
      )}
      <div className="muted">
        {match.date} · {match.rationale}
      </div>
    </Link>
  );
}
