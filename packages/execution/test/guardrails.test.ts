import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, checkGuardrails, prepareOrder, type OrderIntent } from "../src/index.js";

const okIntent: OrderIntent = {
  venue: "kalshi",
  marketId: "TEST-MARKET",
  side: "YES",
  stakeUsd: 20,
  limitPrice: 0.55,
  edge: 0.1,
  confidence: 0.8,
  marketLiquidityUsd: 5000
};

const armed = { ...DEFAULT_SETTINGS, mode: "semi_auto" as const };
const cleanState = { openExposureUsd: 0, realizedPnlTodayUsd: 0 };

describe("checkGuardrails", () => {
  it("allows a sane intent when armed", () => {
    expect(checkGuardrails(okIntent, armed, cleanState)).toEqual({ allowed: true, reasons: [] });
  });

  it("blocks everything in analysis mode", () => {
    const r = checkGuardrails(okIntent, DEFAULT_SETTINGS, cleanState);
    expect(r.allowed).toBe(false);
    expect(r.reasons).toContain("Mode is analysis-only");
  });

  it("blocks when the kill switch is on", () => {
    const r = checkGuardrails(okIntent, { ...armed, killSwitch: true }, cleanState);
    expect(r.reasons).toContain("Kill switch is ON");
  });

  it("blocks disabled venues", () => {
    const r = checkGuardrails(okIntent, { ...armed, venuesEnabled: ["polymarket"] }, cleanState);
    expect(r.allowed).toBe(false);
  });

  it("blocks edges below the minimum but allows exactly at it", () => {
    expect(checkGuardrails({ ...okIntent, edge: 0.05 }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, edge: armed.minEdge }, armed, cleanState).allowed).toBe(true);
  });

  it("blocks low confidence", () => {
    expect(checkGuardrails({ ...okIntent, confidence: 0.5 }, armed, cleanState).allowed).toBe(false);
  });

  it("enforces the per-market stake cap inclusively", () => {
    expect(checkGuardrails({ ...okIntent, stakeUsd: 26 }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, stakeUsd: 25 }, armed, cleanState).allowed).toBe(true);
  });

  it("enforces the total exposure cap", () => {
    expect(checkGuardrails(okIntent, armed, { ...cleanState, openExposureUsd: 190 }).allowed).toBe(false);
    expect(checkGuardrails(okIntent, armed, { ...cleanState, openExposureUsd: 180 }).allowed).toBe(true);
  });

  it("stops after the daily loss limit", () => {
    const r = checkGuardrails(okIntent, armed, { ...cleanState, realizedPnlTodayUsd: -50 });
    expect(r.allowed).toBe(false);
  });

  it("blocks markets thinner than minLiquidity", () => {
    const r = checkGuardrails({ ...okIntent, marketLiquidityUsd: 500 }, armed, cleanState);
    expect(r.allowed).toBe(false);
    expect(r.reasons.join()).toMatch(/liquidity/i);
  });

  it("rejects degenerate limit prices", () => {
    expect(checkGuardrails({ ...okIntent, limitPrice: 0 }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, limitPrice: 1 }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, limitPrice: Number.NaN }, armed, cleanState).allowed).toBe(false);
  });

  it("rejects zero, negative, and non-finite stakes", () => {
    expect(checkGuardrails({ ...okIntent, stakeUsd: 0 }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, stakeUsd: -50 }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, stakeUsd: Number.NaN }, armed, cleanState).allowed).toBe(false);
  });

  it("rejects NaN edge, confidence, and liquidity instead of letting them pass comparisons", () => {
    expect(checkGuardrails({ ...okIntent, edge: Number.NaN }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, confidence: Number.NaN }, armed, cleanState).allowed).toBe(false);
    expect(checkGuardrails({ ...okIntent, marketLiquidityUsd: Number.NaN }, armed, cleanState).allowed).toBe(false);
  });

  it("rejects non-finite account state instead of silently disabling caps", () => {
    expect(checkGuardrails(okIntent, armed, { openExposureUsd: Number.NaN, realizedPnlTodayUsd: 0 }).allowed).toBe(false);
    expect(checkGuardrails(okIntent, armed, { openExposureUsd: 0, realizedPnlTodayUsd: Number.NaN }).allowed).toBe(false);
  });
});

describe("prepareOrder", () => {
  it("blocks without EXECUTION_ENABLED even when guardrails pass", () => {
    delete process.env.EXECUTION_ENABLED;
    const r = prepareOrder(okIntent, armed, cleanState);
    expect(r.status).toBe("blocked");
    expect(r.reasons).toContain("EXECUTION_ENABLED is not true");
  });

  it("awaits approval in semi_auto when enabled", () => {
    process.env.EXECUTION_ENABLED = "true";
    try {
      expect(prepareOrder(okIntent, armed, cleanState).status).toBe("awaiting_approval");
      expect(prepareOrder(okIntent, { ...armed, mode: "auto" }, cleanState).status).toBe("would_submit");
    } finally {
      delete process.env.EXECUTION_ENABLED;
    }
  });

  it("reports guardrail reasons when blocked", () => {
    const r = prepareOrder(okIntent, DEFAULT_SETTINGS, cleanState);
    expect(r.status).toBe("blocked");
    expect(r.reasons.length).toBeGreaterThan(0);
  });
});
