"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MIN_CALIBRATION_SAMPLE,
  REPORTS,
  matchNarrative,
  overallScorecard,
  pickProbability,
  type ReportMatch
} from "@/lib/reports";
import Scorecard from "@/components/Scorecard";
import EventCard from "@/components/EventCard";
import { ThesisCard } from "@/components/ThesisSection";
import { localThesisRepository, type Thesis } from "@/lib/thesisStore";
import { useLiveListings } from "@/lib/useLiveListings";
import { edgeFor } from "@/lib/edge";
import { cents, pct } from "@/lib/format";
import { matchState, nextUpcoming, sortForDisplay } from "@/lib/kickoff";

const prob = (m: ReportMatch): string => {
  const p = pickProbability(m);
  return p != null ? pct(p) : m.chanceToAdvance;
};

export default function Home() {
  const overall = overallScorecard();
  const report = REPORTS[0];
  const [latestTheses, setLatestTheses] = useState<Thesis[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const { listings } = useLiveListings();

  useEffect(() => setNow(new Date()), []);

  // localStorage is browser-only; read after mount.
  useEffect(() => {
    setLatestTheses(localThesisRepository.listTheses().slice(0, 3));
  }, []);

  const played = report.matches.filter((m) => matchState(m, now) === "played");
  const settledMatches = report.matches.filter((m) => m.result.settled);
  const featured =
    nextUpcoming(report.matches, now) ??
    played[played.length - 1] ??
    settledMatches[settledMatches.length - 1] ??
    report.matches[0];
  const featuredState = now ? matchState(featured, now) : null;
  const featuredEdge =
    featuredState !== "settled" && listings.length > 0 ? edgeFor(featured, listings) : undefined;
  const featuredHook = matchNarrative(featured).oneLine;
  const featuredHit =
    featured.result.settled && featured.result.winner
      ? featured.result.winner.toLowerCase() === featured.predictedWinner.toLowerCase()
      : null;

  return (
    <div>
      <h1>Deep research for sports prediction markets</h1>
      <p className="subtitle">
        We research every match, publish a probability before kickoff, and grade every pick in public
        once the result is in.
      </p>

      <div id="how-it-works" className="how-strip">
        <div className="how-step">
          <span className="how-n">01</span>
          <h2>We publish our number</h2>
          <p>
            Deep research on every match produces a probability for each pick, published before
            kickoff.
          </p>
        </div>
        <div className="how-step">
          <span className="how-n">02</span>
          <h2>Compare it with the market</h2>
          <p>
            A market price is the crowd&apos;s probability: a 52¢ YES pays $1 if it happens. The gap
            between our number and the price is the edge.
          </p>
        </div>
        <div className="how-step">
          <span className="how-n">03</span>
          <h2>Every pick is graded</h2>
          <p>
            When the market settles we mark the pick Correct or Missed, in public. If you like the
            edge, trade on Kalshi, Polymarket, or Hyperliquid.
          </p>
        </div>
      </div>

      <div className="section-head">
        <span className="lbl">Featured pick</span>
        <span className="mono muted">
          {report.sport} · {featuredState === "settled"
            ? `settled ${featured.date}`
            : featuredState === "played"
              ? `played ${featured.date}`
              : `kicks off ${featured.date}, ${featured.kickoff}`}
        </span>
      </div>

      <Link href={`/event/${featured.eventKey}`} className="blotter">
        <div className="blotter-row">
          <div className="blotter-cell ev-cell">
            <span className="lbl">Event</span>
            <div className="blotter-ev">
              {featured.matchup}
              <small>
                {report.sport} · {featured.date} · {featured.kickoff}
              </small>
            </div>
          </div>
          <div className="blotter-cell">
            <span className="lbl">Our call · {featured.predictedWinner}</span>
            <div className="blotter-val">{prob(featured)}</div>
          </div>
          {featuredState === "settled" ? (
            <div className="blotter-cell">
              <span className="lbl">Result</span>
              <span className={`blotter-tag ${featuredHit ? "pos" : "neg"}`}>
                {featuredHit ? "Correct" : "Missed"}
              </span>
            </div>
          ) : featuredState === "played" ? (
            <div className="blotter-cell">
              <span className="lbl">Status</span>
              <span className="blotter-tag flat">Grading</span>
            </div>
          ) : featuredEdge ? (
            <>
              <div className="blotter-cell">
                <span className="lbl">Market</span>
                <div className="blotter-val">{cents(featuredEdge.marketPrice)}</div>
              </div>
              <div className="blotter-cell">
                <span className="lbl">Edge</span>
                <div
                  className={`blotter-val ${
                    featuredEdge.edgePts >= 3 ? "pos" : featuredEdge.edgePts <= -3 ? "neg" : ""
                  }`}
                >
                  {featuredEdge.edgePts > 0 ? "+" : ""}
                  {featuredEdge.edgePts.toFixed(1)}
                </div>
              </div>
              <div className="blotter-cell">
                <span className="lbl">Verdict</span>
                <span
                  className={`blotter-tag ${
                    featuredEdge.edgePts >= 3 ? "pos" : featuredEdge.edgePts <= -3 ? "neg" : "flat"
                  }`}
                >
                  {featuredEdge.edgePts >= 3 ? "Value" : featuredEdge.edgePts <= -3 ? "No value" : "Fair"}
                </span>
              </div>
            </>
          ) : (
            <div className="blotter-cell">
              <span className="lbl">Market</span>
              <div className="muted mono">no live line</div>
            </div>
          )}
        </div>
        <div className="blotter-sub">
          {featuredState === "settled" ? (
            <span className={featuredHit ? "edge-pos" : "edge-neg"}>
              {featuredHit
                ? `${featured.result.winner} advanced. We called it at ${prob(featured)}.`
                : `${featured.result.winner} advanced. We had ${featured.predictedWinner} at ${prob(featured)}.`}
            </span>
          ) : featuredState === "played" ? (
            <span>Played, grading in progress. The result will be graded shortly.</span>
          ) : featuredEdge ? (
            <span>{featuredEdge.verdict}. Read the full case →</span>
          ) : (
            <span>Read the full case →</span>
          )}
        </div>
        {featuredState !== "settled" && featuredHook && (
          <p className="blotter-quote">{featuredHook}</p>
        )}
      </Link>

      <div className="card">
        <h2>Track record: every pick graded when the market settles</h2>
        <p>
          {overall.totalPicks} picks published. {overall.correct} of {overall.settled} settled picks
          correct so far{overall.settled < MIN_CALIBRATION_SAMPLE ? " (small sample, early days)" : ""}.
        </p>
        <Scorecard
          card={overall}
          label="Every pick is timestamped at publish and graded when its market settles."
        />
        <p>
          <Link className="button-link" href="/track-record">
            See the full track record
          </Link>
        </p>
        <p className="muted">
          <Link href={`/research/${report.slug}`}>Latest report: {report.title} →</Link>
        </p>
      </div>

      <div className="card">
        <h2>
          {report.competition}: {report.stage} picks and results
        </h2>
        <div className="grid">
          {sortForDisplay(report.matches, now).map((m) => (
            <EventCard key={m.eventKey} sport={report.sport} match={m} listings={listings} now={now} />
          ))}
        </div>
        <p className="muted">
          <Link href="/picks">All picks →</Link> · <Link href="/markets">Live prices →</Link>
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
          Have a read on one of these matches? Open an <Link href="/picks">event</Link> and publish
          your thesis.
        </p>
      )}
    </div>
  );
}
