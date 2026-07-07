"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/lib/marketGroups";

const CACHE_KEY = "saa:scan";
const CACHE_TTL_MS = 120000;

/**
 * One live-market scan shared across pages: cached in sessionStorage for two
 * minutes so navigating between home/events/event pages doesn't re-hit the
 * venue APIs (Kalshi rate-limits bursts).
 */
export function useLiveListings(): {
  listings: Listing[];
  /** Per-venue scan errors from /api/markets (keys are venue names). */
  errors: Record<string, string>;
  /** True when the scan request itself failed (no venue data at all). */
  failed: boolean;
  loaded: boolean;
} {
  const [listings, setListings] = useState<Listing[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null");
      if (cached && Date.now() - cached.at < CACHE_TTL_MS && Array.isArray(cached.listings)) {
        setListings(cached.listings);
        setErrors(cached.errors ?? {});
        setLoaded(true);
        return;
      }
    } catch {
      // corrupt cache: fall through to a fresh scan
    }
    fetch("/api/markets")
      .then((r) => r.json())
      .then((data: { listings?: Listing[]; errors?: Record<string, string> }) => {
        setListings(data.listings ?? []);
        setErrors(data.errors ?? {});
        setLoaded(true);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ at: Date.now(), listings: data.listings ?? [], errors: data.errors ?? {} })
          );
        } catch {
          // storage full: caching is best-effort
        }
      })
      .catch(() => {
        setFailed(true);
        setLoaded(true);
      });
  }, []);

  return { listings, errors, failed, loaded };
}
