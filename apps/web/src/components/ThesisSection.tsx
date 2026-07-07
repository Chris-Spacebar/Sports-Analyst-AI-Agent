"use client";

import { useEffect, useState } from "react";
import { localThesisRepository, type EventComment, type Thesis } from "@/lib/thesisStore";
import { pct } from "@/lib/format";

export function ThesisCard({ t }: { t: Thesis }) {
  return (
    <div className="thesis-card">
      <div>
        <span className="tag">{t.author}</span>
        {t.pick ? (
          <span className="tag sport">
            {t.pick.side} {t.pick.outcome} · P {pct(t.pick.probability)}
          </span>
        ) : (
          <span className="tag">free-form</span>
        )}
        <span className="muted"> {new Date(t.createdAt).toLocaleString()}</span>
      </div>
      <h2>{t.title}</h2>
      <p className="thesis-body">{t.body}</p>
    </div>
  );
}

interface OutcomeOption {
  label: string;
  venue: string;
  price: number | null;
}

/**
 * Community theses for one event: feed + composer + discussion.
 * Persistence is the swappable ThesisRepository, local-only until accounts land.
 */
export default function ThesisSection({
  eventKey,
  outcomeOptions
}: {
  eventKey: string;
  outcomeOptions: OutcomeOption[];
}) {
  const repo = localThesisRepository;
  const [theses, setTheses] = useState<Thesis[]>([]);
  // Start empty: a render-time localStorage read would make SSR and client
  // HTML diverge (hydration failure); the effect below loads after mount.
  const [comments, setComments] = useState<EventComment[]>([]);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"pick" | "freeform">("pick");
  const [outcome, setOutcome] = useState("");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [probability, setProbability] = useState("");
  const [confidence, setConfidence] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");

  // localStorage is browser-only; load after mount to avoid hydration mismatch.
  useEffect(() => {
    setTheses(repo.listTheses(eventKey));
    setComments(repo.listComments(eventKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKey]);

  const publish = () => {
    const a = author.trim() || "anonymous";
    if (title.trim().length === 0 || body.trim().length === 0) {
      setFormError("Give your thesis a title and a rationale.");
      return;
    }
    let pick: Thesis["pick"];
    if (mode === "pick") {
      const p = Number(probability) / 100;
      if (!outcome) {
        setFormError("Choose the outcome your thesis is about (or switch to free-form).");
        return;
      }
      if (!Number.isFinite(p) || p <= 0 || p >= 1) {
        setFormError("Stated probability must be between 1 and 99 (%).");
        return;
      }
      const opt = outcomeOptions.find((o) => o.label === outcome);
      const c = Number(confidence);
      pick = {
        outcome,
        side,
        probability: p,
        confidence: Number.isFinite(c) && confidence.trim() !== "" ? c : undefined,
        venue: opt?.venue,
        priceAtPost: opt?.price ?? null
      };
    }
    repo.addThesis({ eventKey, author: a, title: title.trim(), body: body.trim(), pick });
    setTheses(repo.listTheses(eventKey));
    setTitle("");
    setBody("");
    setProbability("");
    setConfidence("");
    setFormError(null);
  };

  const addComment = () => {
    if (commentBody.trim().length === 0) return;
    repo.addComment({ eventKey, author: commentAuthor.trim() || "anonymous", body: commentBody.trim() });
    setComments(repo.listComments(eventKey));
    setCommentBody("");
  };

  return (
    <>
      <div className="card">
        <h2>Community theses</h2>
        <p className="muted">
          Stored locally in your browser for now. Accounts and cloud publishing arrive with sign-in.
        </p>
        {theses.length === 0 && <p className="muted">No theses yet. Yours can be the first.</p>}
        {theses.map((t) => (
          <ThesisCard key={t.id} t={t} />
        ))}

        <h2>Share your thesis</h2>
        <label>Handle</label>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. @edgehunter" />
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One line: what's your call?" />

        <label>Thesis type</label>
        <div className="side-toggle">
          <button
            type="button"
            className={mode === "pick" ? "side-btn active" : "side-btn"}
            onClick={() => setMode("pick")}
          >
            Market pick (auto-scored)
          </button>
          <button
            type="button"
            className={mode === "freeform" ? "side-btn active" : "side-btn"}
            onClick={() => setMode("freeform")}
          >
            Free-form
          </button>
        </div>

        {mode === "pick" && (
          <>
            <label>Outcome</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="">Choose an outcome…</option>
              {outcomeOptions.map((o) => (
                <option key={`${o.venue}:${o.label}`} value={o.label}>
                  {o.label} ({o.venue}{o.price != null ? `, ${(o.price * 100).toFixed(1)}%` : ""})
                </option>
              ))}
            </select>
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
            <label>Your stated probability (%)</label>
            <input
              type="number"
              min={1}
              max={99}
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              placeholder="e.g. 64"
            />
            <label>Confidence (0-1, optional)</label>
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              placeholder="e.g. 0.7"
            />
          </>
        )}

        <label>Rationale</label>
        <textarea
          className="prompt-box"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="The research behind your call: form, availability, tactics, venue, weather, price…"
        />
        {formError && <div className="banner error">{formError}</div>}
        <button onClick={publish}>Publish thesis</button>
      </div>

      <div className="card">
        <h2>Discussion</h2>
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
        {comments.map((c) => (
          <p key={c.id} className="comment">
            <span className="tag">{c.author}</span> {c.body}
          </p>
        ))}
        <label>Add a comment</label>
        <input value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} placeholder="Handle" />
        <textarea
          className="prompt-box"
          rows={2}
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Join the discussion…"
        />
        <button onClick={addComment} disabled={commentBody.trim().length === 0}>
          Comment
        </button>
      </div>
    </>
  );
}
