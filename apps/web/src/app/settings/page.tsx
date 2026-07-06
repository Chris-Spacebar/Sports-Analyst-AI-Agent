"use client";

import { useEffect, useState } from "react";
import { SETTING_BOUNDS } from "@saa/execution";

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

type NumericKey =
  | "minEdge"
  | "minConfidence"
  | "maxStakePerMarket"
  | "maxTotalExposure"
  | "dailyLossLimit"
  | "minLiquidity";

const ALL_SPORTS = ["soccer", "american_football", "basketball", "baseball"];
const ALL_VENUES = ["kalshi", "polymarket", "hyperliquid"];

// min/max come from SETTING_BOUNDS so the client enforces exactly what the server does.
const NUMBER_FIELDS: Array<{ key: NumericKey; label: string; step: number }> = [
  { key: "minEdge", label: "Minimum edge (0-1), e.g. 0.07 = 7 points", step: 0.01 },
  { key: "minConfidence", label: "Minimum confidence (0-1)", step: 0.05 },
  { key: "maxStakePerMarket", label: "Max stake per market (USD)", step: 1 },
  { key: "maxTotalExposure", label: "Max total exposure (USD)", step: 1 },
  { key: "dailyLossLimit", label: "Daily loss limit (USD)", step: 1 },
  { key: "minLiquidity", label: "Minimum market liquidity/volume (USD)", step: 1 }
];

const toDrafts = (s: Settings): Record<NumericKey, string> =>
  Object.fromEntries(NUMBER_FIELDS.map((f) => [f.key, String(s[f.key])])) as Record<NumericKey, string>;

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [drafts, setDrafts] = useState<Record<NumericKey, string> | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Settings) => {
        setS(data);
        setDrafts(toDrafts(data));
      })
      .catch((e) => setErrors([`Could not load settings: ${String(e)}`]));
  }, []);

  if (!s || !drafts) {
    return (
      <div>
        {errors.map((e) => (
          <div key={e} className="banner error">{e}</div>
        ))}
        {errors.length === 0 && <p className="muted">Loading settings…</p>}
      </div>
    );
  }

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const save = async () => {
    const parsed: Partial<Record<NumericKey, number>> = {};
    const problems: string[] = [];
    for (const f of NUMBER_FIELDS) {
      const { min, max } = SETTING_BOUNDS[f.key];
      const raw = drafts[f.key].trim();
      const n = Number(raw);
      if (raw === "" || !Number.isFinite(n) || n < min || n > max) {
        problems.push(`${f.label}: enter a number between ${min} and ${max}`);
      } else {
        parsed[f.key] = n;
      }
    }
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...s, ...parsed })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors(data && Array.isArray(data.errors) ? data.errors : [`Save failed (HTTP ${res.status})`]);
        return;
      }
      setS(data);
      setDrafts(toDrafts(data));
      setErrors([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErrors([`Save failed: ${String(e)}`]);
    }
  };

  return (
    <div>
      <h1>Agent settings</h1>
      <div className="banner">
        These are the guardrails the agent respects. Execution stays off unless mode is semi_auto/auto
        AND the EXECUTION_ENABLED env var is true. The kill switch overrides everything.
      </div>

      {errors.map((e) => (
        <div key={e} className="banner error">{e}</div>
      ))}

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
        {NUMBER_FIELDS.map((f) => (
          <div key={f.key}>
            <label>{f.label}</label>
            <input
              type="number"
              step={f.step}
              min={SETTING_BOUNDS[f.key].min}
              max={SETTING_BOUNDS[f.key].max}
              value={drafts[f.key]}
              onChange={(e) => setDrafts({ ...drafts, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button onClick={save}>{saved ? "Saved" : "Save settings"}</button>
      <p className="muted">
        Note: the scaffold stores settings in memory (they reset on redeploy). Wire this to Vercel KV or
        Supabase in Step 2 for persistence — see docs/SETUP.md.
      </p>
    </div>
  );
}
