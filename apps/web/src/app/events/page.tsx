"use client";

import { useEffect } from "react";
import Link from "next/link";
import { REPORTS, gradeReport } from "@/lib/reports";
import EventCard from "@/components/EventCard";
import { useLiveListings } from "@/lib/useLiveListings";

export default function EventsPage() {
  const { listings } = useLiveListings();

  // Client components can't export metadata — set the tab title directly.
  useEffect(() => {
    document.title = "Events — Sports Analyst AI Agent";
  }, []);

  return (
    <div>
      <h1>Events</h1>
      <p className="subtitle">
        Every event we cover — the research, live market prices, and community theses in one place.
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
                <EventCard key={m.eventKey} sport={report.sport} match={m} listings={listings} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
