export const pct = (p: number | null | undefined, digits = 0): string =>
  p != null ? `${(p * 100).toFixed(digits)}%` : "n/a";

export const cents = (p: number, digits = 0): string => `${(p * 100).toFixed(digits)}¢`;

/**
 * Display label for a sport key. Internally the association-football sport is
 * keyed "soccer" (playbooks, detection, market data); users see "Football".
 * "american_football" (added later) shows as "American Football".
 */
export const sportLabel = (sport?: string | null): string => {
  if (!sport) return "";
  const key = sport.toLowerCase().replace(/[\s_]+/g, "_");
  if (key === "soccer" || key === "football") return "Football";
  if (key === "american_football") return "American Football";
  return sport
    .replace(/[_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
