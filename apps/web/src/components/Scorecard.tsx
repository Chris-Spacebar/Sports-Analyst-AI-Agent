import type { Scorecard as ScorecardData } from "@/lib/reports";

/** The founder's verified track record — graded against settled markets. */
export default function Scorecard({ card, label }: { card: ScorecardData; label: string }) {
  return (
    <div className="scorecard">
      <div className="scorecard-item">
        <div className="scorecard-num">
          {card.correct}/{card.settled}
        </div>
        <div className="muted">settled picks correct</div>
      </div>
      <div className="scorecard-item">
        <div className="scorecard-num">{card.pending}</div>
        <div className="muted">picks pending</div>
      </div>
      <div className="scorecard-item">
        <div className="scorecard-num">{card.brierScore ?? "—"}</div>
        <div className="muted">Brier score (lower is better)</div>
      </div>
      <div className="scorecard-label muted">{label}</div>
    </div>
  );
}
