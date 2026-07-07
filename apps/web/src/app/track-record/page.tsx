import Link from "next/link";
import {
  MIN_CALIBRATION_SAMPLE,
  REPORTS,
  SITE_META,
  gradeReport,
  overallScorecard,
  pickProbability,
  type ReportMatch
} from "@/lib/reports";
import Scorecard from "@/components/Scorecard";
import { pct } from "@/lib/format";

export const metadata = { title: "Track record | Sports Analyst AI Agent" };

const prob = (m: ReportMatch): string => {
  const p = pickProbability(m);
  return p != null ? pct(p) : m.chanceToAdvance;
};

export default function TrackRecordPage() {
  const overall = overallScorecard();
  return (
    <div>
      <h1>Track record</h1>
      <p className="subtitle">
        Every pick is timestamped at publish and graded when its market settles. Results are updated
        daily; last update {SITE_META.resultsUpdatedAt}.
      </p>

      <div className="card">
        <Scorecard
          card={overall}
          label="Every pick is timestamped at publish and graded when its market settles."
        />
        {overall.settled < MIN_CALIBRATION_SAMPLE && (
          <p className="muted">
            Too few settled picks to judge calibration yet; the Brier score becomes meaningful around
            20 picks.
          </p>
        )}
      </div>

      {REPORTS.map((report) => {
        const card = gradeReport(report);
        const settled = report.matches.filter((m) => m.result.settled && m.result.winner);
        return (
          <div key={report.id} className="card">
            <h2>
              <Link href={`/research/${report.slug}`}>{report.title}</Link>
            </h2>
            <p className="muted">
              {card.totalPicks} picks published {report.publishedAt} · {card.correct}/{card.settled}{" "}
              settled picks correct · Brier {card.brierScore ?? "n/a"}
            </p>
            {settled.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Our call</th>
                      <th>Result</th>
                      <th>Graded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settled.map((m) => {
                      const hit = m.result.winner!.toLowerCase() === m.predictedWinner.toLowerCase();
                      return (
                        <tr key={m.eventKey}>
                          <td>
                            <Link href={`/event/${m.eventKey}`}>{m.matchup}</Link>
                          </td>
                          <td>
                            {m.predictedWinner} {prob(m)}
                          </td>
                          <td>{m.result.winner} advanced</td>
                          <td>
                            <span className={hit ? "receipt-hit" : "receipt-miss"}>
                              {hit ? "Correct" : "Missed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted">
              {card.pending} {card.pending === 1 ? "pick" : "picks"} pending grading.
            </p>
          </div>
        );
      })}
    </div>
  );
}
