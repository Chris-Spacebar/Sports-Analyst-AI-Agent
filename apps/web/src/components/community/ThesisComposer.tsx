"use client";

import { useMemo, useState } from "react";
import { REPORTS } from "@/lib/reports";
import { postThesis } from "@/lib/community/client";
import { useIdentity } from "@/lib/community/identity";

const NO_PICK = "__note__";

interface EventOption {
  eventKey: string;
  matchup: string;
  teamA: string;
  teamB: string;
}

const EVENT_OPTIONS: EventOption[] = REPORTS.flatMap((r) =>
  r.matches.map((m) => ({
    eventKey: m.eventKey,
    matchup: m.matchup,
    teamA: m.teamA,
    teamB: m.teamB
  }))
);

export default function ThesisComposer({
  eventKey,
  teamA,
  teamB,
  onPosted
}: {
  eventKey?: string;
  teamA?: string;
  teamB?: string;
  onPosted: () => void;
}) {
  const { deviceId, handle, ready, claim } = useIdentity();

  const [handleInput, setHandleInput] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(
    eventKey ?? EVENT_OPTIONS[0]?.eventKey ?? ""
  );
  const [outcome, setOutcome] = useState<string>(NO_PICK);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [probability, setProbability] = useState("60");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeEvent = useMemo(() => {
    const key = eventKey ?? selectedEvent;
    const opt = EVENT_OPTIONS.find((e) => e.eventKey === key);
    if (opt) return opt;
    if (eventKey && teamA && teamB) {
      return { eventKey, matchup: `${teamA} vs ${teamB}`, teamA, teamB };
    }
    return null;
  }, [eventKey, selectedEvent, teamA, teamB]);

  if (!ready) {
    return <div className="composer">Loading…</div>;
  }

  if (!handle) {
    const claimHandle = () => {
      const h = handleInput.trim();
      if (!h) return;
      claim(h);
    };
    return (
      <div className="composer">
        <div className="handle-gate">
          <label>Claim a handle</label>
          <p className="sub">
            Pick a handle to post under. No password: it lives on this device.
          </p>
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
    const targetEvent = eventKey ?? selectedEvent;
    if (!targetEvent) {
      setError("Pick an event.");
      return;
    }
    if (!trimmedTitle) {
      setError("Add a title.");
      return;
    }
    if (!trimmedBody) {
      setError("Add your rationale.");
      return;
    }

    let pick;
    if (outcome !== NO_PICK) {
      const p = Number(probability);
      if (!Number.isFinite(p) || p < 1 || p > 99) {
        setError("Probability must be between 1 and 99.");
        return;
      }
      pick = {
        eventKey: targetEvent,
        outcome,
        side,
        probability: p / 100
      };
    }

    setPosting(true);
    try {
      await postThesis({
        eventKey: targetEvent,
        authorId: deviceId,
        handle,
        title: trimmedTitle,
        body: trimmedBody,
        pick
      });
      setTitle("");
      setBody("");
      setOutcome(NO_PICK);
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
      {!eventKey && (
        <>
          <label>Event</label>
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setOutcome(NO_PICK);
            }}
          >
            {EVENT_OPTIONS.map((o) => (
              <option key={o.eventKey} value={o.eventKey}>
                {o.matchup}
              </option>
            ))}
          </select>
        </>
      )}

      <label>Your pick</label>
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
        <option value={NO_PICK}>General note (no pick)</option>
        {activeEvent && (
          <>
            <option value={activeEvent.teamA}>{activeEvent.teamA} to advance</option>
            <option value={activeEvent.teamB}>{activeEvent.teamB} to advance</option>
          </>
        )}
      </select>

      {outcome !== NO_PICK && (
        <>
          <label>Side</label>
          <div className="side-toggle">
            {(["YES", "NO"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={side === s ? "side-btn active" : "side-btn"}
                onClick={() => setSide(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <label>Your probability (1-99%)</label>
          <input
            type="number"
            min={1}
            max={99}
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
        </>
      )}

      <label>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="One line: what is your call?"
      />

      <label>Rationale</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Why do you like it?"
        rows={4}
      />

      {error && <p className="composer-error">{error}</p>}

      <button type="button" className="button-link" onClick={submit} disabled={posting}>
        {posting ? "Posting…" : "Post thesis"}
      </button>
    </div>
  );
}
