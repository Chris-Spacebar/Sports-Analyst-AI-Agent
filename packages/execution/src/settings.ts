import { DEFAULT_SETTINGS, type AgentMode, type AgentSettings } from "./guardrails.js";

export const AGENT_MODES: AgentMode[] = ["analysis", "semi_auto", "auto"];
export const KNOWN_VENUES = ["kalshi", "polymarket", "hyperliquid"] as const;

/** Bounds for every numeric setting — validation and UI share these. */
export const SETTING_BOUNDS: Record<
  "minEdge" | "minConfidence" | "maxStakePerMarket" | "maxTotalExposure" | "dailyLossLimit" | "minLiquidity",
  { min: number; max: number }
> = {
  minEdge: { min: 0, max: 1 },
  minConfidence: { min: 0, max: 1 },
  maxStakePerMarket: { min: 0, max: 1000000 },
  maxTotalExposure: { min: 0, max: 10000000 },
  dailyLossLimit: { min: 0, max: 10000000 },
  minLiquidity: { min: 0, max: 1000000000 }
};

export interface PatchValidation {
  ok: boolean;
  errors: string[];
  /** Only the valid, known keys from the input. Empty when ok is false. */
  patch: Partial<AgentSettings>;
}

/**
 * Validate an untrusted settings patch (e.g. a request body) field by field.
 * Rejects unknown keys, wrong types, non-finite numbers, and out-of-range values.
 * Pass `allowedSports` (playbook sport ids) to also validate sportsEnabled entries.
 */
export function validateSettingsPatch(
  input: unknown,
  opts: { allowedSports?: string[] } = {}
): PatchValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["patch must be a JSON object"], patch: {} };
  }
  const body = input as Record<string, unknown>;
  const errors: string[] = [];
  const patch: Partial<AgentSettings> = {};

  for (const key of Object.keys(body)) {
    // Object.hasOwn, not `in`: keys like "__proto__" or "toString" exist on the
    // prototype chain and must still be rejected as unknown settings.
    if (!Object.hasOwn(DEFAULT_SETTINGS, key)) errors.push(`unknown setting: ${key}`);
  }

  if ("mode" in body) {
    const v = body.mode;
    if (typeof v === "string" && (AGENT_MODES as string[]).includes(v)) patch.mode = v as AgentMode;
    else errors.push(`mode must be one of: ${AGENT_MODES.join(", ")}`);
  }

  if ("killSwitch" in body) {
    if (typeof body.killSwitch === "boolean") patch.killSwitch = body.killSwitch;
    else errors.push("killSwitch must be a boolean");
  }

  if ("sportsEnabled" in body) {
    const v = body.sportsEnabled;
    const allowed = opts.allowedSports;
    if (Array.isArray(v) && v.every((s): s is string => typeof s === "string" && (!allowed || allowed.includes(s)))) {
      patch.sportsEnabled = [...new Set(v)];
    } else {
      errors.push(
        allowed
          ? `sportsEnabled must be an array drawn from: ${allowed.join(", ")}`
          : "sportsEnabled must be an array of strings"
      );
    }
  }

  if ("venuesEnabled" in body) {
    const v = body.venuesEnabled;
    if (Array.isArray(v) && v.every((x): x is AgentSettings["venuesEnabled"][number] => typeof x === "string" && (KNOWN_VENUES as readonly string[]).includes(x))) {
      patch.venuesEnabled = [...new Set(v)];
    } else {
      errors.push(`venuesEnabled must be an array drawn from: ${KNOWN_VENUES.join(", ")}`);
    }
  }

  for (const [key, bounds] of Object.entries(SETTING_BOUNDS) as Array<[keyof typeof SETTING_BOUNDS, { min: number; max: number }]>) {
    if (!(key in body)) continue;
    const v = body[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v < bounds.min || v > bounds.max) {
      errors.push(`${key} must be a number between ${bounds.min} and ${bounds.max}`);
    } else {
      patch[key] = v;
    }
  }

  return { ok: errors.length === 0, errors, patch: errors.length === 0 ? patch : {} };
}
