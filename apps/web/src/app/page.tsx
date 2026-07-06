"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REPORTS, overallScorecard } from "@/lib/reports";
import Scorecard from "@/components/Scorecard";
import { ThesisCard } from "@/components/ThesisSection";
import { localThesisRepository, type Thesis } from "@/lib/thesisStore";

export default function Home() {
  const overall = overallScorecard();
  const featured = REPORTS[0];
  const [latestTheses, setLatestTheses] = useState<Thesis[]>([]);

  // localStorage is browser-only — read after mount.
  useEffect(() => {
    setLatestTheses(localThesisRepository.listTheses().slice(0, 3));
  }, []);

  const pending = featured.matches.filter((m) => !m.result.settled);

  return (
    <div>
      <h1>Win prediction markets with deeper research</h1>
      <div className="banner">
        Profound, critical analysis of sports matches — the founder&apos;s research, your theses, and a
        community that shares what it learns. Analysis first; trading on Hyperliquid Outcome, Polymarket,
        or Kalshi.
      </div>

      <div className="card">
        <h2>Founder track record — graded against settled markets</h2>
        <Scorecard card={overall} label="Every published pick is timestamped and scored when the market settles" />
        <p>
          <Link className="button-link" href={`/research/${featured.slug}`}>
            Read the latest report: {featured.stage}
          </Link>
        </p>
      </div>

      <div className="card">
        <h2>Live now — {featured.competition}</h2>
        <p className="muted">
          {pending.length} of {featured.matches.length} {featured.stage} picks still pending. Dig into an
          event for the research, live cross-venue prices, and community theses.
        </p>
        <div className="grid">
          {featured.matches.slice(0, 6).map((m) => (
            <Link key={m.eventKey} href={`/event/${m.eventKey}`} className="card market-card">
              <div>
                <span className="tag sport">{featured.sport}</span>
                {m.result.settled ? <span className="tag settled">settled</span> : <span className="tag">pending</span>}
              </div>
              <h2>{m.matchup}</h2>
              <div className="muted">
                pick: <strong>{m.predictedWinner}</strong> ({m.chanceToAdvance})
              </div>
            </Link>
          ))}
        </div>
        <p className="muted">
          <Link href="/events">All events →</Link> · <Link href="/markets">Live market scanner →</Link>
        </p>
      </div>

      <div className="card">
        <h2>Latest community theses</h2>
        {latestTheses.length === 0 ? (
          <p className="muted">
            None yet — open an <Link href="/events">event</Link> and be the first to publish yours.
          </p>
        ) : (
          latestTheses.map((t) => <ThesisCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  );
}
