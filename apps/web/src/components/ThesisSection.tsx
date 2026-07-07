"use client";

import { useCallback, useEffect, useState } from "react";
import ThesisRow from "@/components/community/ThesisRow";
import ThesisComposer from "@/components/community/ThesisComposer";
import {
  fetchComments,
  fetchTheses,
  postComment,
  reactThesis,
  type FloorThesis,
  type ReactionKind,
  type ThesisComment
} from "@/lib/community/client";
import { useIdentity } from "@/lib/community/identity";

/**
 * Community theses for one event: an API-backed feed of graded calls, tail/fade,
 * a per-thesis comment thread, and a composer. Identity is pseudonymous (device
 * id + claimed handle) so there is no sign-in gate.
 */
export default function ThesisSection({
  eventKey,
  teamA,
  teamB
}: {
  eventKey: string;
  teamA: string;
  teamB: string;
}) {
  const { deviceId, handle, ready } = useIdentity();
  const [theses, setTheses] = useState<FloorThesis[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, ThesisComment[]>>({});
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchTheses({ eventKey, me: deviceId || undefined });
    setTheses(list);
    setLoaded(true);
  }, [eventKey, deviceId]);

  // useIdentity resolves device/handle only after mount; wait for it so the
  // "me" reaction state is correct on the first fetch.
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

  const toggleThread = async (id: string) => {
    setDraft("");
    if (openThread === id) {
      setOpenThread(null);
      return;
    }
    setOpenThread(id);
    if (!comments[id]) {
      try {
        const list = await fetchComments(id);
        setComments((prev) => ({ ...prev, [id]: list }));
      } catch {
        setComments((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  const submitComment = async (id: string) => {
    const body = draft.trim();
    if (!body || !deviceId || !handle) return;
    setPosting(true);
    try {
      const comment = await postComment({ thesisId: id, authorId: deviceId, handle, body });
      setComments((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), comment] }));
      setTheses((prev) =>
        prev.map((t) => (t.id === id ? { ...t, commentCount: t.commentCount + 1 } : t))
      );
      setDraft("");
    } catch {
      // Keep the draft so the writer can retry.
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="floor">
      <div className="floor-head">
        <div>
          <h2>Community theses</h2>
          <div className="sub">The crowd&apos;s calls on this match, graded when the market settles.</div>
        </div>
        <button type="button" onClick={() => setComposerOpen((v) => !v)}>
          {composerOpen ? "Close composer" : "Post your thesis"}
        </button>
      </div>

      {composerOpen && (
        <ThesisComposer
          eventKey={eventKey}
          teamA={teamA}
          teamB={teamB}
          onPosted={() => {
            setComposerOpen(false);
            load().catch(() => undefined);
          }}
        />
      )}

      <div className="thesis-feed">
        {loaded && theses.length === 0 && (
          <div className="thesis-row muted">No theses on this event yet. Yours can be the first.</div>
        )}
        {theses.map((t) => {
          const thread = comments[t.id] ?? [];
          const open = openThread === t.id;
          return (
            <div key={t.id}>
              <ThesisRow thesis={t} onReact={onReact} />
              <div className="thesis-comments">
                <button type="button" className="tf" onClick={() => toggleThread(t.id)}>
                  {open ? "Hide discussion" : "Discuss"} <span className="n">{t.commentCount}</span>
                </button>
                {open && (
                  <div className="thread">
                    {thread.length === 0 && <p className="muted">No comments yet.</p>}
                    {thread.map((c) => (
                      <p key={c.id} className="comment">
                        <span className="handle">{c.handle}</span> {c.body}
                      </p>
                    ))}
                    {handle ? (
                      <>
                        <textarea
                          className="prompt-box"
                          rows={2}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Add to the discussion…"
                        />
                        <button
                          type="button"
                          onClick={() => submitComment(t.id)}
                          disabled={posting || draft.trim().length === 0}
                        >
                          Comment
                        </button>
                      </>
                    ) : (
                      <p className="muted">Post a thesis to claim a handle, then join the discussion.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
