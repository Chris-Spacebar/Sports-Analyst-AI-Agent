import { matchNarrative, type ReportMatch } from "@/lib/reports";
import ReportSections from "@/components/ReportSections";

/**
 * The analysis told in value order: hook and verdict first, the argument
 * (per-team pros/cons) second, evidence tables third, logistics collapsed.
 */
export default function NarrativeAnalysis({ match }: { match: ReportMatch }) {
  const n = matchNarrative(match);
  return (
    <>
      {n.oneLine && <p className="pull-quote">&ldquo;{n.oneLine}&rdquo;</p>}
      {n.decision && (
        <div className="verdict-box">
          <h2>The verdict</h2>
          <p>{n.decision}</p>
          {n.sources && <p className="muted">Sources: {n.sources}</p>}
        </div>
      )}
      {n.boosts && (
        <div className="pros-cons">
          {(
            [
              { team: match.teamA, v: n.boosts.teamA },
              { team: match.teamB, v: n.boosts.teamB }
            ] as const
          ).map(({ team, v }) => (
            <div key={team} className="pros-cons-col">
              <h2>{team}</h2>
              {v.plus && (
                <p>
                  <span className="plus">Working for them</span>
                  {v.plus}
                </p>
              )}
              {v.minus && (
                <p>
                  <span className="minus">What could go wrong</span>
                  {v.minus}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <ReportSections sections={n.rest} />
      {n.matchInfo && (
        <details className="match-details">
          <summary>Venue, kickoff and conditions</summary>
          <ReportSections sections={[n.matchInfo]} />
        </details>
      )}
    </>
  );
}
