import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, validateSettingsPatch } from "../src/index.js";

describe("validateSettingsPatch", () => {
  it("accepts a full valid settings object", () => {
    const r = validateSettingsPatch({ ...DEFAULT_SETTINGS });
    expect(r.ok).toBe(true);
    expect(r.patch).toEqual(DEFAULT_SETTINGS);
  });

  it("accepts a partial patch", () => {
    const r = validateSettingsPatch({ minEdge: 0.1, killSwitch: true });
    expect(r.ok).toBe(true);
    expect(r.patch).toEqual({ minEdge: 0.1, killSwitch: true });
  });

  it("rejects non-object bodies", () => {
    for (const bad of [null, "x", 3, [1]]) {
      expect(validateSettingsPatch(bad).ok).toBe(false);
    }
  });

  it("rejects unknown keys", () => {
    const r = validateSettingsPatch({ minEdge: 0.1, hax: true });
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain("unknown setting: hax");
    expect(r.patch).toEqual({});
  });

  it("rejects prototype-chain key names as unknown too", () => {
    for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      const r = validateSettingsPatch(JSON.parse(`{"${key}": 1}`));
      expect(r.ok).toBe(false);
      expect(r.errors.join()).toContain(`unknown setting: ${key}`);
    }
  });

  it("rejects non-finite and out-of-range numbers", () => {
    expect(validateSettingsPatch({ minEdge: Number.NaN }).ok).toBe(false);
    expect(validateSettingsPatch({ minEdge: Infinity }).ok).toBe(false);
    expect(validateSettingsPatch({ minEdge: 1.5 }).ok).toBe(false);
    expect(validateSettingsPatch({ minConfidence: -0.1 }).ok).toBe(false);
    expect(validateSettingsPatch({ maxStakePerMarket: "25" }).ok).toBe(false);
  });

  it("rejects bad enum and boolean values", () => {
    expect(validateSettingsPatch({ mode: "yolo" }).ok).toBe(false);
    expect(validateSettingsPatch({ killSwitch: "true" }).ok).toBe(false);
  });

  it("rejects unknown venues and dedupes valid ones", () => {
    expect(validateSettingsPatch({ venuesEnabled: ["kalshi", "draftkings"] }).ok).toBe(false);
    const r = validateSettingsPatch({ venuesEnabled: ["kalshi", "kalshi"] });
    expect(r.ok).toBe(true);
    expect(r.patch.venuesEnabled).toEqual(["kalshi"]);
  });

  it("checks sportsEnabled against allowedSports when provided", () => {
    const allowed = ["soccer", "baseball"];
    expect(validateSettingsPatch({ sportsEnabled: ["soccer"] }, { allowedSports: allowed }).ok).toBe(true);
    expect(validateSettingsPatch({ sportsEnabled: ["cricket"] }, { allowedSports: allowed }).ok).toBe(false);
    expect(validateSettingsPatch({ sportsEnabled: [42] }).ok).toBe(false);
  });
});
