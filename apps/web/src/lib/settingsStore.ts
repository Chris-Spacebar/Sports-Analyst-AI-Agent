import { DEFAULT_SETTINGS, type AgentSettings } from "@saa/execution";

/**
 * In-memory settings store for the scaffold.
 * Vercel serverless functions are stateless, so this resets between cold starts.
 * Step 2 of the roadmap: replace with Vercel KV / Supabase (same interface).
 */
let settings: AgentSettings = { ...DEFAULT_SETTINGS };

export function getSettings(): AgentSettings {
  return settings;
}

export function updateSettings(patch: Partial<AgentSettings>): AgentSettings {
  settings = { ...settings, ...patch };
  return settings;
}
