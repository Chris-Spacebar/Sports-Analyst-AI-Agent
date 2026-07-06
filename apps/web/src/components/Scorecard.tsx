import type { Scorecard as ScorecardData } from "@/lib/reports";

const BRIER_EXPLAINER =
  "How it's scored: for every settled pick we take (stated probability − outcome)², " +
  "where outcome is 1 if the pick was right and 0 if it missed, then average across picks. " +
  "0 = perfectly confident and correct · 0.25 = what coin-flip guessing scores · 1 = fully confident and wrong. " +
  "Lower means the predictions are both accurate and honestly calibrated.";

/** The analyst's verified track record — graded against settled markets. */
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
