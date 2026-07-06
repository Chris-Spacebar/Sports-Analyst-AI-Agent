"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REPORTS, matchNarrative, overallScorecard, pickProbability } from "@/lib/reports";
import Scorecard from "@/components/Scorecard";
import EventCard from "@/components/EventCard";
import { ThesisCard } from "@/components/ThesisSection";
import { localThesisRepository, type Thesis } from "@/lib/thesisStore";
import { useLiveListings } from "@/lib/useLiveListings";
import { edgeFor } from "@/lib/edge";

const pct = (p: number | null | undefined) => (p != null ? `${(p * 100).toFixed(0)}%` : "—");
const cents = (p: number) => `${(p * 100).toFixed(0)}¢`;

export default function Home() {
  const overall = overallScorecard();
  const featured = REPORTS[0];
  const [latestTheses, setLatestTheses] = useState<Thesis[]>([]);
  const { listings } = useLiveListings();

  // localStorage is browser-only — read after mount.
  useEffect(() => {
    setLatestTheses(localThesisRepository.listTheses().slice(0, 3));
  }, []);

  const pending = featured.matches.filter((m) => !m.result.settled);
  const nextUp = pending[0];
  const nextEdge = nextUp && listings.length > 0 ? edgeFor(nextUp, listings) : undefined;
  const nextHook = nextUp ? matchNarrative(nextUp).oneLine : undefined;

  return (
    <div>
      <h1>Win prediction markets with deeper research</h1>
      <p className="subtitle">
        Every match researched in depth. Every pick published with a probability, then graded when the
        market settles. Trade on Hyperliquid, Polymarket, or Kalshi.
      </p>

      {nextUp && (
        <Link href={`/event/${nextUp.eventKey}`} className="card market-card featured-card">
          <div>
            <span className="tag sport">{featured.sport}</span>
            <span className="tag">awaiting result · {nextUp.date}</span>
          </div>
          <h2>{nextUp.matchup}</h2>
          {nextHook && <p className="pull-quote">&ldquo;{nextHook}&rdquo;</p>}
          <div className="call-line">
            Our call: <strong>{nextUp.predictedWinner}</strong>{" "}
            {pct(pickProbability(nextUp)) !== "—" ? pct(pickProbability(nextUp)) : nextUp.chanceToAdvance}
            {nextEdge ? ` · market ${cents(nextEdge.marketPrice)} — ${nextEdge.verdict}` : ""}
          </div>
          <div className="muted">
            {nextUp.rationale} · kickoff {nextUp.kickoff} — read the full case →
          </div>
        </Link>
      )}

      <div className="card">
        <h2>Track record — every pick graded when the market settles</h2>
        <p>
          {overall.totalPicks} picks published · {overall.correct} of {overall.settled} settled so far
          correct
          {/* Only boast when it's true — a Brier above 0.25 is worse than guessing. */}
          {overall.brierScore != null
            ? overall.brierScore < 0.25
              ? ` · calibration beats coin-flip guessing (Brier ${overall.brierScore} vs 0.25)`
              : ` · Brier ${overall.brierScore} (0.25 = coin-flip guessing)`
            : ""}
        </p>
        <Scorecard card={overall} label="Published picks are timestamped and scored against real results — no cherry-picking" />
        <p>
          <Link className="button-link" href={`/research/${featured.slug}`}>
            Read the latest report: {featured.stage}
          </Link>
        </p>
      </div>

      <div className="card">
        <h2>Live now — {featured.competition}</h2>
        <div className="grid">
          {featured.matches.slice(0, 6).map((m) => (
            <EventCard key={m.eventKey} sport={featured.sport} match={m} listings={listings} />
          ))}
        </div>
        <p className="muted">
          <Link href="/events">All events →</Link> · <Link href="/markets">Live market scanner →</Link>
        </p>
      </div>

      {latestTheses.length > 0 && (
        <div className="card">
          <h2>Latest community theses</h2>
          {latestTheses.map((t) => (
            <ThesisCard key={t.id} t={t} />
          ))}
        </div>
      )}
      {latestTheses.length === 0 && (
        <p className="muted">
          Have a read on one of these matches? Open an <Link href="/events">event</Link> and publish your
          thesis.
        </p>
      )}
    </div>
  );
}
