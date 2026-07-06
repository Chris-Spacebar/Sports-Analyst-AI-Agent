import Link from "next/link";
import type { Listing } from "@/lib/marketGroups";
import { edgeFor } from "@/lib/edge";
import type { ReportMatch } from "@/lib/reports";

const cents = (p: number) => `${(p * 100).toFixed(0)}¢`;

/**
 * One event as a story arc: pick + conviction + market price while pending,
 * a graded receipt (✓/✗) once settled.
 */
export default function EventCard({
  sport,
  match,
  listings
}: {
  sport: string;
  match: ReportMatch;
  listings?: Listing[];
}) {
  const settled = match.result.settled && match.result.winner;
  const hit = settled ? match.result.winner!.toLowerCase() === match.predictedWinner.toLowerCase() : null;
  const edge = !settled && listings && listings.length > 0 ? edgeFor(match, listings) : undefined;

  return (
    <Link href={`/event/${match.eventKey}`} className="card market-card">
      <div>
        <span className="tag sport">{sport}</span>
        {settled ? (
          hit ? (
            <span className="tag settled">✓ pick correct</span>
          ) : (
            <span className="tag missed">✗ missed</span>
          )
        ) : (
          <span className="tag">pending</span>
        )}
      </div>
      <h2>{match.matchup}</h2>
      {settled ? (
        <div className={hit ? "receipt-hit" : "receipt-miss"}>
          {hit
            ? `✓ ${match.result.winner} advanced — called it at ${match.chanceToAdvance}`
            : `✗ ${match.result.winner} advanced — we had ${match.predictedWinner} at ${match.chanceToAdvance}`}
        </div>
      ) : (
        <div className="call-line">
          Our call: <strong>{match.predictedWinner}</strong> {match.chanceToAdvance}
          {edge ? ` · market ${cents(edge.marketPrice)}` : ""}
        </div>
      )}
      <div className="muted">
        {match.date} · {match.rationale}
      </div>
    </Link>
  );
}
