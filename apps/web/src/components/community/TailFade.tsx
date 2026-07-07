"use client";

import type { ReactionKind } from "@/lib/community/client";

export default function TailFade({
  thesisId,
  tail,
  fade,
  your,
  onReact
}: {
  thesisId: string;
  tail: number;
  fade: number;
  your: ReactionKind | null;
  onReact: (id: string, kind: ReactionKind) => void;
}) {
  return (
    <div className="tf-group">
      <button
        type="button"
        className={`tf${your === "tail" ? " on" : ""}`}
        onClick={() => onReact(thesisId, "tail")}
      >
        <span className="k tail">Tail</span>
        <span className="n">{tail}</span>
      </button>
      <button
        type="button"
        className={`tf${your === "fade" ? " on" : ""}`}
        onClick={() => onReact(thesisId, "fade")}
      >
        <span className="k fade">Fade</span>
        <span className="n">{fade}</span>
      </button>
    </div>
  );
}
