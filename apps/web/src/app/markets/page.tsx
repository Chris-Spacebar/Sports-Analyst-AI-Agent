"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { groupListings, type Listing, type MarketGroup } from "@/lib/marketGroups";

interface ScanResponse {
  listings: Listing[];
  errors: Record<string, string>;
  scannedAt: string;
}

const pct = (p: number | null | undefined) => (p != null ? `${Math.round(p * 100)}%` : "—");

export default function Dashboard() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const groups: MarketGroup[] = data ? groupListings(data.listings) : [];

  const openGroup = (g: MarketGroup) => {
    // Hand the already-scanned group to the detail page so it doesn't rescan.
    try {
      sessionStorage.setItem(`group:${g.key}`, JSON.stringify(g));
    } catch {
      // Storage full/unavailable — the detail page falls back to refetching.
    }
  };

  return (
    <div>
      <h1>Live sports markets</h1>
      <p className="subtitle">
        Live prices for sports markets on Kalshi, Polymarket, and Hyperliquid — a market price is roughly
        the crowd&apos;s probability (buy at 52¢, win $1 if it happens). Our research lives on the{" "}
        <a href="/events">event pages</a>. Not financial advice.
      </p>

      {loading && <p className="muted">Scanning venues…</p>}
      {error && <p className="muted">Error: {error}</p>}

      {data && (
        <>
          {Object.entries(data.errors ?? {}).map(([venue, msg]) => (
            <p key={venue} className="muted">
              {venue}: could not fetch ({msg})
            </p>
          ))}
          <p className="muted">
            {groups.length} markets ({data.listings.length} outcomes) · scanned{" "}
            {new Date(data.scannedAt).toLocaleString()}
          </p>
          <div className="grid">
            {groups.map((g) => (
              <Link
                key={g.key}
                href={`/market/${encodeURIComponent(g.venue)}/${encodeURIComponent(g.key.slice(g.venue.length + 1))}`}
                className="card market-card"
                onClick={() => openGroup(g)}
              >
                <div>
                  <span className={`tag venue-${g.venue}`}>{g.venue}</span>
                  {g.sport && <span className="tag sport">{g.sport.replace("_", " ")}</span>}
                  {g.outcomes.length > 1 && <span className="tag">{g.outcomes.length} outcomes</span>}
                </div>
                <h2>{g.title}</h2>
                {g.outcomes.length === 1 ? (
                  <>
                    <div className="price">{pct(g.outcomes[0].yesPrice)}</div>
                    <div className="muted">
                      {/* Name the outcome — a lone survivor of a "A vs B" event is ambiguous otherwise. */}
                      YES{g.outcomes[0].outcome ? ` · ${g.outcomes[0].outcome}` : " price"}
                      {g.volume ? ` · vol ${Math.round(g.volume).toLocaleString()}` : ""}
                      {g.closeTime ? ` · closes ${new Date(g.closeTime).toLocaleDateString()}` : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <ul className="outcome-preview">
                      {g.outcomes.slice(0, 3).map((o) => (
                        <li key={o.id}>
                          <span>{o.outcome ?? o.title}</span>
                          <span className="price-sm">{pct(o.yesPrice)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="muted">
                      {g.outcomes.length > 3 ? `+ ${g.outcomes.length - 3} more · ` : ""}
                      {g.volume ? `vol ${Math.round(g.volume).toLocaleString()} · ` : ""}
                      view market →
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
