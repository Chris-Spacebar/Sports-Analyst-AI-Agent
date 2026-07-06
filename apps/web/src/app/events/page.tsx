import Link from "next/link";
import { REPORTS, gradeReport } from "@/lib/reports";

export const metadata = { title: "Events — Sports Analyst AI Agent" };

export default function EventsPage() {
  return (
    <div>
      <h1>Events</h1>
      <p className="muted">
        Every event the analyst covers, with the research, live markets, and community theses in one place.
      </p>
      {REPORTS.map((report) => {
        const card = gradeReport(report);
        return (
          <div key={report.id} className="card">
            <h2>
              {report.competition} — {report.stage}
            </h2>
            <p className="muted">
              {card.correct}/{card.settled} settled picks correct · {card.pending} pending ·{" "}
              <Link href={`/research/${report.slug}`}>full report</Link>
            </p>
            <div className="grid">
              {report.matches.map((m) => (
                <Link key={m.eventKey} href={`/event/${m.eventKey}`} className="card market-card">
                  <div>
                    <span className="tag sport">{report.sport}</span>
                    {m.result.settled ? (
                      <span className="tag settled">settled</span>
                    ) : (
                      <span className="tag">pending</span>
                    )}
                  </div>
                  <h2>{m.matchup}</h2>
                  <div className="muted">
                    {m.date} · pick: <strong>{m.predictedWinner}</strong> ({m.chanceToAdvance})
                    {m.result.settled && m.result.winner ? ` · winner: ${m.result.winner}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
