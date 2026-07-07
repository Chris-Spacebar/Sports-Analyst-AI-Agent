"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchLeaderboard,
  fetchTheses,
  reactThesis,
  type FloorThesis,
  type ForecasterStat,
  type ReactionKind
} from "@/lib/community/client";
import { useIdentity } from "@/lib/community/identity";
import ThesisRow from "./ThesisRow";
import Leaderboard from "./Leaderboard";
import ThesisComposer from "./ThesisComposer";

export default function CommunityFloor({
  eventKey,
  heading
}: {
  eventKey?: string;
  heading?: string;
}) {
  const { deviceId, ready } = useIdentity();
  const [theses, setTheses] = useState<FloorThesis[]>([]);
  const [forecasters, setForecasters] = useState<ForecasterStat[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);

  const limit = eventKey ? undefined : 6;

  const load = useCallback(async () => {
    try {
      const [t, lb] = await Promise.all([
        fetchTheses({ eventKey, limit, me: deviceId || undefined }),
        fetchLeaderboard()
      ]);
      setTheses(t);
      setForecasters(lb);
    } catch {
      // A transient fetch error should not blank the floor; keep the last state.
    }
  }, [eventKey, limit, deviceId]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const onReact = async (id: string, kind: ReactionKind) => {
    if (!deviceId) return;
    // Optimistic: reflect the toggle immediately, then reconcile from the server.
    setTheses((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const wasTail = t.your === "tail";
        const wasFade = t.your === "fade";
        let tail = t.tail;
        let fade = t.fade;
        let your: ReactionKind | null = kind;
        if (t.your === kind) {
          your = null;
          if (kind === "tail") tail -= 1;
          else fade -= 1;
        } else {
          if (kind === "tail") tail += 1;
          if (kind === "fade") fade += 1;
          if (wasTail) tail -= 1;
          if (wasFade) fade -= 1;
        }
        return { ...t, tail, fade, your };
      })
    );
    try {
      const res = await reactThesis(id, deviceId, kind);
      setTheses((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, tail: res.tail, fade: res.fade, your: res.your } : t
        )
      );
    } catch {
      load();
    }
  };

  const onPosted = () => {
    setComposerOpen(false);
    load();
  };

  return (
    <section className="floor">
      <div className="floor-strip">
        <span className="dot" />
        The floor · crowd calls graded live
      </div>

      <div className="floor-head">
        <div>
          <h2>{heading ?? "The floor"}</h2>
          <p className="sub">The crowd&apos;s calls, graded when the market settles.</p>
        </div>
        <button
          type="button"
          className="button-link"
          onClick={() => setComposerOpen((o) => !o)}
        >
          {composerOpen ? "Close" : "Post your thesis"}
        </button>
      </div>

      {composerOpen && <ThesisComposer eventKey={eventKey} onPosted={onPosted} />}

      <div className="floor-cols">
        <div className="thesis-feed">
          {theses.length === 0 ? (
            <div className="floor-empty">
              No calls on the floor yet. Be the first:{" "}
              <button
                type="button"
                className="link-inline"
                onClick={() => setComposerOpen(true)}
              >
                post your thesis
              </button>
              .
            </div>
          ) : (
            theses.map((t) => (
              <ThesisRow
                key={t.id}
                thesis={t}
                onReact={onReact}
                discussionHref={`/event/${t.eventKey}`}
              />
            ))
          )}
        </div>

        <Leaderboard forecasters={forecasters} compact />
      </div>

      {!eventKey && (
        <p className="floor-foot muted">
          <Link href="/community">See the whole floor →</Link>
        </p>
      )}
    </section>
  );
}
