"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Leaderboard from "@/components/community/Leaderboard";
import ThesisRow from "@/components/community/ThesisRow";
import {
  fetchLeaderboard,
  fetchTheses,
  reactThesis,
  type FloorThesis,
  type ForecasterStat,
  type ReactionKind
} from "@/lib/community/client";
import { useIdentity } from "@/lib/community/identity";

/**
 * The full community destination: the whole forecaster leaderboard (desk
 * included) plus every graded thesis across events. Linked from the homepage
 * floor's "full leaderboard" call.
 */
export default function CommunityPage() {
  const { deviceId, ready } = useIdentity();
  const [forecasters, setForecasters] = useState<ForecasterStat[]>([]);
  const [theses, setTheses] = useState<FloorThesis[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = "Community | Sports Analyst AI Agent";
  }, []);

  const load = useCallback(async () => {
    const [lb, list] = await Promise.all([
      fetchLeaderboard(),
      fetchTheses({ me: deviceId || undefined })
    ]);
    setForecasters(lb);
    setTheses(list);
    setLoaded(true);
  }, [deviceId]);

  // Wait for the mounted device id so the "me" reaction state is populated.
  useEffect(() => {
    if (!ready) return;
    load().catch(() => setLoaded(true));
  }, [ready, load]);

  const onReact = async (id: string, kind: ReactionKind) => {
    if (!deviceId) return;
    try {
      const res = await reactThesis(id, deviceId, kind);
      setTheses((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, tail: res.tail, fade: res.fade, your: res.your } : t
        )
      );
    } catch {
      // Leave prior counts in place if the write fails.
    }
  };

  return (
    <div>
      <p className="muted">
        <Link href="/">← Home</Link>
      </p>
      <h1>Community</h1>
      <p className="muted">
        The crowd&apos;s calls, scored on the same board as the desk. Tail the sharp, fade the rest.
      </p>

      <section className="floor">
        <div className="floor-cols">
          <div className="thesis-feed">
            {loaded && theses.length === 0 && (
              <div className="thesis-row muted">No theses yet. Open an event to post the first.</div>
            )}
            {theses.map((t) => (
              <ThesisRow
                key={t.id}
                thesis={t}
                onReact={onReact}
                discussionHref={`/event/${t.eventKey}`}
              />
            ))}
          </div>
          <Leaderboard forecasters={forecasters} />
        </div>
      </section>
    </div>
  );
}
