import type { Scorecard as ScorecardData } from "@/lib/reports";

const BRIER_EXPLAINER =
  "Average of (stated probability minus outcome) squared across settled picks. " +
  "0 is perfect, 0.25 matches coin-flip guessing, 1 is confidently wrong. Lower is better.";

/** The analyst's verified track record, graded against settled markets. */
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
        <div className="scorecard-num">{card.brierScore ?? "n/a"}</div>
        <div className="muted">
          Brier score (lower is better){" "}
          <span className="tooltip" tabIndex={0} aria-label={BRIER_EXPLAINER}>
            ⓘ<span className="tooltip-text">{BRIER_EXPLAINER}</span>
          </span>
        </div>
      </div>
      <div className="scorecard-label muted">{label}</div>
    </div>
  );
}
