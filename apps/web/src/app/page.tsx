"use client";

import { useEffect, useState } from "react";

interface Listing {
  id: string;
  venue: string;
  title: string;
  sport?: string;
  yesPrice: number | null;
  closeTime?: string;
  volume?: number;
  url?: string;
}

interface ScanResponse {
  listings: Listing[];
  errors: Record<string, string>;
  scannedAt: string;
}

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

  return (
    <div>
      <h1>Sports markets — model vs price</h1>
      <div className="banner">
        Analysis mode. This dashboard surfaces sports listings from Kalshi, Polymarket, and Hyperliquid
        and pairs them with the agent&apos;s factor-based analysis. It is not financial advice.
      </div>

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
            {data.listings.length} sports listings · scanned {new Date(data.scannedAt).toLocaleString()}
          </p>
          <div className="grid">
            {data.listings.map((l) => (
              <div className="card" key={`${l.venue}-${l.id}`}>
                <div>
                  <span className="tag">{l.venue}</span>
                  {l.sport && <span className="tag sport">{l.sport.replace("_", " ")}</span>}
                </div>
                <h2>{l.url ? <a href={l.url} target="_blank" rel="noreferrer">{l.title}</a> : l.title}</h2>
                <div className="price">{l.yesPrice != null ? `${Math.round(l.yesPrice * 100)}%` : "—"}</div>
                <div className="muted">
                  YES price{l.volume ? ` · vol ${Math.round(l.volume).toLocaleString()}` : ""}
                  {l.closeTime ? ` · closes ${new Date(l.closeTime).toLocaleDateString()}` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
