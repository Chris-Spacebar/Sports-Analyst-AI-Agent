import { DEFAULT_SETTINGS, type AgentSettings } from "@saa/execution";

/**
 * In-memory settings store for the scaffold.
 * Vercel serverless functions are stateless, so this resets between cold starts.
 * Step 2 of the roadmap: replace with Vercel KV / Supabase (same interface).
 */
const envMode = process.env.AGENT_MODE;
let settings: AgentSettings = {
  ...DEFAULT_SETTINGS,
  // AGENT_MODE sets the boot default; the Settings UI can change it at runtime.
  ...(envMode === "analysis" || envMode === "semi_auto" || envMode === "auto" ? { mode: envMode } : {})
};

export function getSettings(): AgentSettings {
  return settings;
}

export function updateSettings(patch: Partial<AgentSettings>): AgentSettings {
  settings = { ...settings, ...patch };
  return settings;
}
