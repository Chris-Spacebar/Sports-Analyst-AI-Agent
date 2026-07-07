"use client";

import Link from "next/link";
import type { FloorThesis, ReactionKind } from "@/lib/community/client";
import { getEvent } from "@/lib/reports";
import { pct } from "@/lib/format";
import TailFade from "./TailFade";

function ago(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function gradeLabel(thesis: FloorThesis): { text: string; cls: string } {
  const { graded } = thesis;
  if (!graded.gradeable) return { text: "not auto-graded", cls: "" };
  if (!graded.settled) return { text: "grades when it settles", cls: "" };
  if (graded.hit) return { text: "graded: correct", cls: "hit" };
  return { text: "graded: missed", cls: "miss" };
}

export default function ThesisRow({
  thesis,
  onReact,
  discussionHref
}: {
  thesis: FloorThesis;
  onReact: (id: string, kind: ReactionKind) => void;
  /** When set, the row shows a link to where the thread lives (homepage, community).
   *  Omit on the event page, which renders its own inline comment thread. */
  discussionHref?: string;
}) {
  const event = getEvent(thesis.eventKey);
  const match = event?.match;
  const settled = match?.result.settled ?? false;
  const grade = gradeLabel(thesis);

  return (
    <div className="thesis-row">
      <div className="who">
        <span className="handle">{thesis.handle}</span>
        <span className="ago">{ago(thesis.createdAt)}</span>
      </div>

      {match && (
        <div className="thesis-event">
          {match.matchup} · {settled ? "settled" : `kicks off ${match.date}`}
        </div>
      )}

      {thesis.pick && (
        <div className="thesis-call">
          <span className="pick">
            {thesis.pick.outcome}
            {thesis.pick.side === "NO" ? " NO" : ""}
          </span>
          <span className="num">{pct(thesis.pick.probability)}</span>
          {thesis.house && (
            <span className="vs">house {pct(thesis.house.probability)}</span>
          )}
        </div>
      )}

      {thesis.title && <div className="thesis-title">{thesis.title}</div>}
      {thesis.body && <p className="thesis-rationale">{thesis.body}</p>}

      <div className="thesis-actions">
        <TailFade
          thesisId={thesis.id}
          tail={thesis.tail}
          fade={thesis.fade}
          your={thesis.your}
          onReact={onReact}
        />
        {discussionHref && (
          <Link href={discussionHref} className="discuss">
            Discuss <span className="n">{thesis.commentCount}</span>
          </Link>
        )}
        <span className={`thesis-grade ${grade.cls}`}>{grade.text}</span>
      </div>
    </div>
  );
}
