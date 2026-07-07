"use client";

import Link from "next/link";
import type { ForecasterStat } from "@/lib/community/client";

function hitRate(f: ForecasterStat): string {
  if (f.settled === 0) return "no settled picks";
  const rate = Math.round((f.correct / f.settled) * 100);
  const losses = f.settled - f.correct;
  return `${f.correct}-${losses}, ${rate}% hit`;
}

export default function Leaderboard({
  forecasters,
  compact
}: {
  forecasters: ForecasterStat[];
  compact?: boolean;
}) {
  const rows = compact ? forecasters.slice(0, 5) : forecasters;

  return (
    <div className="cboard">
      <h3>Forecasters</h3>
      {rows.length === 0 && <div className="clb-empty">No graded calls yet.</div>}
      {rows.map((f, i) => (
        <div key={f.authorId} className={`clb-row${f.isHouse ? " house" : ""}`}>
          <span className="clb-rank">{i + 1}</span>
          <div className="clb-id">
            <span className="clb-handle">
              {f.handle}
              {f.isHouse ? " (house)" : ""}
            </span>
            <span className="clb-sub">{hitRate(f)}</span>
          </div>
          <span className="clb-brier">
            <b>{f.brier != null ? f.brier.toFixed(3) : "n/a"}</b>
            <span className="clb-brier-lbl">Brier</span>
          </span>
        </div>
      ))}
      {compact && (
        <div className="foot">
          <Link href="/community">Full leaderboard →</Link>
        </div>
      )}
    </div>
  );
}
