"use client";

import { useMemo, useState } from "react";
import { getEvent, sportTree, type ReportMatch } from "@/lib/reports";
import { sportLabel } from "@/lib/format";
import { postThesis, type FloorThesis } from "@/lib/community/client";
import { gradeThesis, housePickFor } from "@/lib/community/grade";
import { useIdentity } from "@/lib/community/identity";
import ThesisRow from "./ThesisRow";

type Call = "A" | "B" | "none";

const clampProb = (raw: string): number => {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return 60;
  return Math.min(99, Math.max(1, n));
};

/** Default to the first match still open, so a fresh call is not on a finished game. */
const firstOpen = (matches?: ReportMatch[]): ReportMatch | undefined =>
  matches?.find((m) => !m.result.settled) ?? matches?.[0];

export default function ThesisComposer({
  eventKey,
  onPosted
}: {
  eventKey?: string;
  teamA?: string;
  teamB?: string;
  onPosted: () => void;
}) {
  const { deviceId, handle, ready, claim } = useIdentity();
  const tree = useMemo(() => sportTree(), []);

  // On an event page the match is fixed; on the floor the user picks it via the
  // sport, competition, match cascade.
  const fixed = eventKey ? getEvent(eventKey) : undefined;
  const fixedSport = fixed?.report.sport;
  const fixedCompetition = fixed?.report.competition;

  const [handleInput, setHandleInput] = useState("");
  const [sportKey, setSportKey] = useState(fixedSport ?? tree[0]?.sport ?? "");
  const [competition, setCompetition] = useState(
    fixedCompetition ?? tree[0]?.competitions[0]?.competition ?? ""
  );
  const [matchKey, setMatchKey] = useState(
    eventKey ?? firstOpen(tree[0]?.competitions[0]?.matches)?.eventKey ?? ""
  );
  const [call, setCall] = useState<Call>("A");
  const [probability, setProbability] = useState("60");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sportGroup = tree.find((s) => s.sport === sportKey) ?? tree[0];
  const compGroup =
    sportGroup?.competitions.find((c) => c.competition === competition) ??
    sportGroup?.competitions[0];
  const activeMatch =
    (eventKey ? fixed?.match : undefined) ??
    compGroup?.matches.find((m) => m.eventKey === matchKey) ??
    compGroup?.matches[0];

  const onSport = (next: string) => {
    setSportKey(next);
    const g = tree.find((s) => s.sport === next);
    const firstComp = g?.competitions[0];
    setCompetition(firstComp?.competition ?? "");
    setMatchKey(firstOpen(firstComp?.matches)?.eventKey ?? "");
  };
  const onCompetition = (next: string) => {
    setCompetition(next);
    const c = sportGroup?.competitions.find((x) => x.competition === next);
    setMatchKey(firstOpen(c?.matches)?.eventKey ?? "");
  };

  const targetKey = eventKey ?? activeMatch?.eventKey ?? "";
  const outcome =
    call === "none" || !activeMatch
      ? null
      : call === "A"
        ? activeMatch.teamA
        : activeMatch.teamB;

  // Live preview: the exact row the floor will render, so the questions map
  // one to one onto the result. Probability is clamped so a mid-edit value
  // never shows as NaN.
  const previewPick =
    outcome && targetKey
      ? { eventKey: targetKey, outcome, side: "YES" as const, probability: clampProb(probability) / 100 }
      : undefined;
  const preview: FloorThesis = {
    id: "preview",
    eventKey: targetKey,
    authorId: deviceId || "you",
    handle: handle || "@you",
    title: title.trim() || "Your headline",
    body: body.trim() || "Your rationale will show here.",
    createdAt: new Date().toISOString(),
    pick: previewPick,
    tail: 0,
    fade: 0,
    commentCount: 0,
    your: null,
    graded: gradeThesis({ eventKey: targetKey, pick: previewPick }),
    house: previewPick ? housePickFor(targetKey) : null
  };

  if (!ready) {
    return <div className="composer">Loading...</div>;
  }

  if (!handle) {
    const claimHandle = () => {
      const h = handleInput.trim();
      if (!h) return;
      claim(h.startsWith("@") ? h : `@${h}`);
    };
    return (
      <div className="composer">
        <div className="handle-gate">
          <label>Claim a handle</label>
          <p className="sub">Pick a handle to post under. No password: it lives on this device.</p>
          <input
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            placeholder="e.g. edgehunter"
            onKeyDown={(e) => {
              if (e.key === "Enter") claimHandle();
            }}
          />
          <button type="button" className="button-link" onClick={claimHandle}>
            Claim and continue
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!targetKey) {
      setError("Pick a match.");
      return;
    }
    if (!trimmedTitle) {
      setError("Add a headline.");
      return;
    }
    if (!trimmedBody) {
      setError("Add your rationale.");
      return;
    }

    const pick =
      outcome && targetKey
        ? { eventKey: targetKey, outcome, side: "YES" as const, probability: clampProb(probability) / 100 }
        : undefined;

    setPosting(true);
    try {
      await postThesis({
        eventKey: targetKey,
        authorId: deviceId,
        handle,
        title: trimmedTitle,
        body: trimmedBody,
        pick
      });
      setTitle("");
      setBody("");
      setCall("A");
      setProbability("60");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="composer">
      {eventKey ? (
        <>
          <label>Match</label>
          <p className="composer-fixed">
            {activeMatch?.matchup}
            {fixedSport ? ` · ${sportLabel(fixedSport)}` : ""}
            {fixedCompetition ? ` · ${fixedCompetition}` : ""}
          </p>
        </>
      ) : (
        <div className="composer-cascade">
          <div>
            <label>Sport</label>
            <select value={sportKey} onChange={(e) => onSport(e.target.value)}>
              {tree.map((s) => (
                <option key={s.sport} value={s.sport}>
                  {sportLabel(s.sport)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Event</label>
            <select value={competition} onChange={(e) => onCompetition(e.target.value)}>
              {sportGroup?.competitions.map((c) => (
                <option key={c.competition} value={c.competition}>
                  {c.competition}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Match</label>
            <select value={matchKey} onChange={(e) => setMatchKey(e.target.value)}>
              {compGroup?.matches.map((m) => (
                <option key={m.eventKey} value={m.eventKey}>
                  {m.matchup}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <label>Your call</label>
      <select value={call} onChange={(e) => setCall(e.target.value as Call)}>
        {activeMatch && <option value="A">{activeMatch.teamA} to advance</option>}
        {activeMatch && <option value="B">{activeMatch.teamB} to advance</option>}
        <option value="none">Just a note (no pick)</option>
      </select>

      {call !== "none" && (
        <>
          <label>Your probability that {outcome} advances</label>
          <input
            type="number"
            min={1}
            max={99}
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
        </>
      )}

      <label>Headline</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="One line: what is your call?"
      />

      <label>Rationale</label>
      <textarea
        className="prompt-box"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Form, availability, tactics, venue, why the number is what it is."
        rows={4}
      />

      <span className="composer-preview-label">How it appears on the floor</span>
      <div className="composer-preview">
        <ThesisRow thesis={preview} onReact={() => undefined} />
      </div>

      {error && <p className="composer-error">{error}</p>}

      <button type="button" className="button-link" onClick={submit} disabled={posting}>
        {posting ? "Posting..." : "Post thesis"}
      </button>
    </div>
  );
}
