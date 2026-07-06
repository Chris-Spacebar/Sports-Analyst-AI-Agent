"use client";

import { useEffect, useState } from "react";

interface Settings {
  mode: "analysis" | "semi_auto" | "auto";
  sportsEnabled: string[];
  venuesEnabled: string[];
  minEdge: number;
  minConfidence: number;
  maxStakePerMarket: number;
  maxTotalExposure: number;
  dailyLossLimit: number;
  minLiquidity: number;
  killSwitch: boolean;
}

const ALL_SPORTS = ["soccer", "american_football", "basketball", "baseball"];
const ALL_VENUES = ["kalshi", "polymarket", "hyperliquid"];

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setS);
  }, []);

  if (!s) return <p className="muted">Loading settings…</p>;

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const save = async () => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1>Agent settings</h1>
      <div className="banner">
        These are the guardrails the agent respects. Execution stays off unless mode is semi_auto/auto
        AND the EXECUTION_ENABLED env var is true. The kill switch overrides everything.
      </div>

      <div className="card">
        <h2>Mode</h2>
        <select value={s.mode} onChange={(e) => setS({ ...s, mode: e.target.value as Settings["mode"] })}>
          <option value="analysis">analysis — research and edge reports only</option>
          <option value="semi_auto">semi_auto — prepares orders, I approve each one</option>
          <option value="auto">auto — executes within guardrails (requires env flag)</option>
        </select>
        <label>
          <input
            type="checkbox"
            style={{ width: "auto", marginRight: 8 }}
            checked={s.killSwitch}
            onChange={(e) => setS({ ...s, killSwitch: e.target.checked })}
          />
          KILL SWITCH — stop everything
        </label>
      </div>

      <div className="card">
        <h2>Sports (phase rollout)</h2>
        {ALL_SPORTS.map((sp) => (
          <label key={sp}>
            <input
              type="checkbox"
              style={{ width: "auto", marginRight: 8 }}
              checked={s.sportsEnabled.includes(sp)}
              onChange={() => setS({ ...s, sportsEnabled: toggle(s.sportsEnabled, sp) })}
            />
            {sp.replace("_", " ")}
          </label>
        ))}
      </div>

      <div className="card">
        <h2>Venues</h2>
        {ALL_VENUES.map((v) => (
          <label key={v}>
            <input
              type="checkbox"
              style={{ width: "auto", marginRight: 8 }}
              checked={s.venuesEnabled.includes(v)}
              onChange={() => setS({ ...s, venuesEnabled: toggle(s.venuesEnabled, v) })}
            />
            {v}
          </label>
        ))}
      </div>

      <div className="card">
        <h2>Thresholds and caps</h2>
        <label>Minimum edge (0-1), e.g. 0.07 = 7 points</label>
        <input type="number" step="0.01" value={s.minEdge} onChange={(e) => setS({ ...s, minEdge: Number(e.target.value) })} />
        <label>Minimum confidence (0-1)</label>
        <input type="number" step="0.05" value={s.minConfidence} onChange={(e) => setS({ ...s, minConfidence: Number(e.target.value) })} />
        <label>Max stake per market (USD)</label>
        <input type="number" value={s.maxStakePerMarket} onChange={(e) => setS({ ...s, maxStakePerMarket: Number(e.target.value) })} />
        <label>Max total exposure (USD)</label>
        <input type="number" value={s.maxTotalExposure} onChange={(e) => setS({ ...s, maxTotalExposure: Number(e.target.value) })} />
        <label>Daily loss limit (USD)</label>
        <input type="number" value={s.dailyLossLimit} onChange={(e) => setS({ ...s, dailyLossLimit: Number(e.target.value) })} />
        <label>Minimum market liquidity (USD)</label>
        <input type="number" value={s.minLiquidity} onChange={(e) => setS({ ...s, minLiquidity: Number(e.target.value) })} />
      </div>

      <button onClick={save}>{saved ? "Saved" : "Save settings"}</button>
      <p className="muted">
        Note: the scaffold stores settings in memory (they reset on redeploy). Wire this to Vercel KV or
        Supabase in Step 2 for persistence — see docs/SETUP.md.
      </p>
    </div>
  );
}
