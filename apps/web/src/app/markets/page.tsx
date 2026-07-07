"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { groupListings, type Listing, type MarketGroup } from "@/lib/marketGroups";
import { researchEventFor } from "@/lib/teamMatch";
import { pct } from "@/lib/format";

interface ScanResponse {
  listings: Listing[];
  errors: Record<string, string>;
  scannedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
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
      // Storage full/unavailable: the detail page falls back to refetching.
    }
  };

  return (
    <div>
      <h1>Live prices</h1>
      <p className="subtitle">
        {"Live prices from Kalshi, Polymarket, and Hyperliquid. A price is the crowd's probability: 52¢ means a 52% chance. Not financial advice."}{" "}
        <Link href="/picks">Our research lives on the picks pages.</Link>
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
            {groups.map((g) => {
              const research = researchEventFor(g.title);
              // Not a real <a>: anchors cannot nest inside the card link.
              const researchLink = research && (
                <span
                  role="link"
                  tabIndex={0}
                  className="tag"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/event/${research.eventKey}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/event/${research.eventKey}`);
                    }
                  }}
                >
                  our research →
                </span>
              );
              return (
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
                        {/* Name the outcome: a lone survivor of a "A vs B" event is ambiguous otherwise. */}
                        YES{g.outcomes[0].outcome ? ` · ${g.outcomes[0].outcome}` : " price"}
                        {g.volume ? ` · vol ${Math.round(g.volume).toLocaleString()}` : ""}
                        {g.closeTime ? ` · closes ${new Date(g.closeTime).toLocaleDateString()}` : ""}
                        {researchLink && <> · {researchLink}</>}
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
                        {researchLink && <> · {researchLink}</>}
                      </div>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
