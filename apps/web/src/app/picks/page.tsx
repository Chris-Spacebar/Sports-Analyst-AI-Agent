"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REPORTS, gradeReport } from "@/lib/reports";
import EventCard from "@/components/EventCard";
import { useLiveListings } from "@/lib/useLiveListings";
import { sortForDisplay } from "@/lib/kickoff";

export default function PicksPage() {
  const { listings } = useLiveListings();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => setNow(new Date()), []);

  // Client components can't export metadata; set the tab title directly.
  useEffect(() => {
    document.title = "Picks | Sports Analyst AI Agent";
  }, []);

  return (
    <div>
      <h1>Picks</h1>
      <p className="subtitle">
        Every event we cover, with the research, live prices, and community theses in one place.
      </p>
      {REPORTS.map((report) => {
        const card = gradeReport(report);
        return (
          <div key={report.id} className="card">
            <h2>
              {report.competition}: {report.stage}
            </h2>
            <p className="muted">
              {card.correct}/{card.settled} settled picks correct, {card.pending} pending, published{" "}
              {report.publishedAt} · <Link href={`/research/${report.slug}`}>full report</Link>
            </p>
            <div className="grid">
              {sortForDisplay(report.matches, now).map((m) => (
                <EventCard key={m.eventKey} sport={report.sport} match={m} listings={listings} now={now} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
