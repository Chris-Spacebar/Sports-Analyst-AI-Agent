import Link from "next/link";
import { REPORTS, gradeReport, overallScorecard } from "@/lib/reports";
import Scorecard from "@/components/Scorecard";

export const metadata = { title: "Research — Sports Analyst AI Agent" };

export default function ResearchPage() {
  const overall = overallScorecard();
  return (
    <div>
      <h1>Research</h1>
      <p className="muted">
        The founder&apos;s deep research on major sporting events — every pick timestamped at publish and
        graded against how the markets settle.
      </p>

      <div className="card">
        <h2>Do the picks actually win? Judge for yourself</h2>
        <Scorecard card={overall} label="Every published pick is timestamped and graded when the market settles — no cherry-picking" />
      </div>

      {REPORTS.map((report) => {
        const card = gradeReport(report);
        return (
          <div key={report.id} className="card">
            <h2>
              <Link href={`/research/${report.slug}`}>{report.title}</Link>
            </h2>
            <p className="muted">
              {report.competition} · {report.stage} · published {report.publishedAt} · {report.matches.length}{" "}
              picks · {card.correct}/{card.settled} settled correct
            </p>
            <p>
              <Link className="button-link" href={`/research/${report.slug}`}>
                Read the report
              </Link>{" "}
              {report.xlsxPath && (
                <a className="button-link" href={report.xlsxPath} download>
                  ⬇ Download .xlsx
                </a>
              )}
            </p>
          </div>
        );
      })}

      <p className="muted">
        Community theses live on each <Link href="/events">event page</Link>. Trading features coming
        soon — use Hyperliquid Outcome, Polymarket, or Kalshi to trade the markets.
      </p>
    </div>
  );
}
