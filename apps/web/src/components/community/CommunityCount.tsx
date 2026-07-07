"use client";

import { useEffect, useState } from "react";
import { fetchTheses } from "@/lib/community/client";

/**
 * Live community thesis count for the status bar. Client-fetched so the number
 * reflects real posts, rather than being baked into the statically rendered layout.
 */
export default function CommunityCount() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTheses({})
      .then((t) => {
        if (alive) setN(t.length);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (n == null) return null;
  return <> · {n} community theses</>;
}
