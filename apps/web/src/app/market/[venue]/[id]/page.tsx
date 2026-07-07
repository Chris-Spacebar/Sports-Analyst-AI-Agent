"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { groupListings, type Listing, type MarketGroup } from "@/lib/marketGroups";
import { findTeam, researchEventFor } from "@/lib/teamMatch";
import { pct, cents } from "@/lib/format";
import { REPORTS } from "@/lib/reports";

interface PreparedOrder {
  intent?: unknown;
  status: "blocked" | "awaiting_approval" | "would_submit";
  reasons: string[];
  modelEdgeUsed?: boolean;
  error?: string;
}

export default function MarketPage() {
  const params = useParams<{ venue: string; id: string }>();
  const venue = decodeURIComponent(params.venue);
  const id = decodeURIComponent(params.id);
  const key = `${venue}:${id}`;

  const [group, setGroup] = useState<MarketGroup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [stake, setStake] = useState("25");
  const [limit, setLimit] = useState("");
  const [modelProb, setModelProb] = useState("");
  const [confidence, setConfidence] = useState("");
  const [result, setResult] = useState<PreparedOrder | null>(null);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`group:${key}`);
      if (cached) {
        setGroup(JSON.parse(cached));
        return;
      }
    } catch {
      // fall through to refetch
    }
    fetch("/api/markets")
      .then((r) => r.json())
      .then((data: { listings: Listing[] }) => {
        const g = groupListings(data.listings).find((x) => x.key === key);
        if (g) setGroup(g);
        else setLoadError("Market not found in the current scan; it may have closed.");
      })
      .catch((e) => setLoadError(String(e)));
  }, [key]);

  const selected = useMemo(() => {
    if (!group) return null;
    return group.outcomes.find((o) => o.id === selectedId) ?? group.outcomes[0];
  }, [group, selectedId]);

  // Default the limit price to the live price of the chosen outcome/side.
  useEffect(() => {
    if (selected?.yesPrice != null) {
      setLimit(selected.yesPrice.toFixed(3));
    }
  }, [selected]);

  const yesLimit = Number(limit);
  const p = Number(modelProb) / 100;
  const hasModel = modelProb.trim() !== "" && Number.isFinite(p) && p >= 0 && p <= 1;
  const edge = hasModel && Number.isFinite(yesLimit) ? (side === "YES" ? p - yesLimit : yesLimit - p) : null;

  const isWorldCupChampion =
    venue === "hyperliquid" && (group?.title ?? "").toLowerCase().includes("world cup champion");
  const research = group ? researchEventFor(group.title) : undefined;

  const prepare = async () => {
    if (!group || !selected) return;
    setPreparing(true);
    setResult(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venue: group.venue,
          marketId: selected.id,
          side,
          stakeUsd: Number(stake),
          limitPrice: yesLimit,
          modelProbability: hasModel ? p : undefined,
          confidence: confidence.trim() === "" ? undefined : Number(confidence),
          // undefined when the venue reports no depth data: the API waives the
          // liquidity check for unknown depth (mirrors the scan route's policy).
          marketLiquidityUsd: selected.liquidity ?? selected.volume
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setResult({ status: "blocked", reasons: [data?.error ?? `HTTP ${res.status}`] });
      } else {
        setResult(data);
      }
    } catch (e) {
      setResult({ status: "blocked", reasons: [`Request failed: ${String(e)}`] });
    } finally {
      setPreparing(false);
    }
  };

  if (loadError) {
    return (
      <div>
        <div className="banner error">{loadError}</div>
        <Link href="/markets">← Back to markets</Link>
      </div>
    );
  }
  if (!group) return <p className="muted">Loading market…</p>;

  return (
    <div>
      <p className="muted">
        <Link href="/markets">← Markets</Link>
      </p>
      <h1>{group.title}</h1>
      <div>
        <span className={`tag venue-${group.venue}`}>{group.venue}</span>
        {group.sport && <span className="tag sport">{group.sport.replace("_", " ")}</span>}
        <span className="tag">{group.outcomes.length} outcome{group.outcomes.length > 1 ? "s" : ""}</span>
      </div>
      {research && (
        <p className="muted">
          <Link href={`/event/${research.eventKey}`}>Our research on this event →</Link>
        </p>
      )}

      <div className="detail-grid">
        <div className="card">
          <h2>Outcomes</h2>
          {group.outcomes.length > 1 && (
            <>
              <label>Choose an outcome</label>
              <select value={selected?.id} onChange={(e) => setSelectedId(e.target.value)}>
                {group.outcomes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {(o.outcome ?? o.title) + (o.yesPrice != null ? ` (${pct(o.yesPrice)})` : "")}
                  </option>
                ))}
              </select>
            </>
          )}
          {selected && (
            <>
              <div className="price">{pct(selected.yesPrice)}</div>
              <div className="muted">
                YES price · {selected.outcome ?? selected.title}
                {selected.volume ? ` · vol ${Math.round(selected.volume).toLocaleString()}` : ""}
                {selected.closeTime ? ` · closes ${new Date(selected.closeTime).toLocaleDateString()}` : ""}
              </div>
              {selected.url && (
                <p className="muted">
                  <a href={selected.url} target="_blank" rel="noreferrer">
                    View on {group.venue} ↗
                  </a>
                </p>
              )}
            </>
          )}
          <table className="table">
            <thead>
              <tr>
                <th>Outcome</th>
                <th>YES</th>
                <th>NO</th>
              </tr>
            </thead>
            <tbody>
              {group.outcomes.map((o) => (
                <tr
                  key={o.id}
                  className={o.id === selected?.id ? "row-active" : undefined}
                  onClick={() => setSelectedId(o.id)}
                >
                  <td>{o.outcome ?? o.title}</td>
                  <td>{pct(o.yesPrice)}</td>
                  <td>{o.yesPrice != null ? pct(1 - o.yesPrice) : "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Order ticket</h2>
          <div className="ticket-wrap">
            <div className="coming-soon-overlay">
              <strong>Trading features coming soon</strong>
              <p className="muted">
                Use Hyperliquid Outcome, Polymarket, or Kalshi to trade this market directly.
              </p>
              {selected?.url && (
                <a className="button-link" href={selected.url} target="_blank" rel="noreferrer">
                  Trade on {group.venue} ↗
                </a>
              )}
            </div>
            <div className="ticket-blur">

          <label>Side</label>
          <div className="side-toggle">
            {(["YES", "NO"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={side === s ? "side-btn active" : "side-btn"}
                onClick={() => setSide(s)}
              >
                {s} {selected?.yesPrice != null ? pct(s === "YES" ? selected.yesPrice : 1 - selected.yesPrice) : ""}
              </button>
            ))}
          </div>

          <label>
            Limit price for YES (0 to 1). YES currently costs{" "}
            {selected?.yesPrice != null ? cents(selected.yesPrice) : "n/a"}.
          </label>
          <input type="number" step={0.001} min={0} max={1} value={limit} onChange={(e) => setLimit(e.target.value)} />

          <label>Stake (USD)</label>
          <input type="number" step={1} min={0} value={stake} onChange={(e) => setStake(e.target.value)} />

          <label>Your probability that YES happens (%).</label>
          <input
            type="number"
            step={1}
            min={0}
            max={100}
            placeholder="e.g. 64"
            value={modelProb}
            onChange={(e) => setModelProb(e.target.value)}
          />

          <label>Analysis confidence (0-1)</label>
          <input
            type="number"
            step={0.05}
            min={0}
            max={1}
            placeholder="e.g. 0.7"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
          />

          {edge != null && (
            <p className={edge > 0 ? "edge-pos" : "edge-neg"}>
              Model edge on {side}: {(edge * 100).toFixed(1)} points
            </p>
          )}

          <button onClick={prepare} disabled={preparing || !selected}>
            {preparing ? "Checking guardrails…" : "Prepare order"}
          </button>

          {result && (
            <div className={`verdict verdict-${result.status}`}>
              <strong>
                {result.status === "blocked" && "Blocked by guardrails"}
                {result.status === "awaiting_approval" && "Prepared, awaiting your approval"}
                {result.status === "would_submit" && "Would submit (auto mode)"}
              </strong>
              {result.reasons.length > 0 && (
                <ul>
                  {result.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {isWorldCupChampion && (
        <div className="card">
          <h2>Round of 16: fixtures vs live champion odds</h2>
          <p className="muted">
            Hyperliquid lists the Champion market (teams still alive appear above); these are the Round of
            16 ties from the research report with each side&apos;s live odds of winning the tournament.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Fixture</th>
                <th>Analyst pick</th>
                <th>Advance</th>
                <th>Champion odds (live)</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS[0].matches.map((m) => {
                const a = findTeam(group.outcomes, m.teamA);
                const b = findTeam(group.outcomes, m.teamB);
                return (
                  <tr key={m.num}>
                    <td>{m.num}</td>
                    <td>{m.date}</td>
                    <td>{m.matchup}</td>
                    <td>{m.predictedWinner}</td>
                    <td>{m.chanceToAdvance}</td>
                    <td>
                      {m.teamA}: {a ? pct(a.yesPrice) : "out"} · {m.teamB}: {b ? pct(b.yesPrice) : "out"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="muted">
            &quot;out&quot; = no longer listed among live outcomes (eliminated or settled). Full match
            analysis on the <Link href="/picks">picks pages</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
