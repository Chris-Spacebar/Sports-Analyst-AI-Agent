const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const wordHit = (text: string, keyword: string) =>
  new RegExp(`\\b${escapeRegExp(keyword.trim().toLowerCase())}\\b`).test(text);

/**
 * Whole-word keyword match (case-insensitive on both sides), shared by all
 * venue adapters. Word boundaries stop "kbo" from matching "kickboxing" while
 * still matching punctuation-adjacent titles like "KBO: LG Twins vs Doosan".
 * A text matching any excludeKeyword never matches. An empty/missing keyword
 * list matches everything (no filter).
 */
export function matchesKeywords(text: string, keywords?: string[], excludeKeywords?: string[]): boolean {
  const t = text.toLowerCase();
  if (excludeKeywords?.some((k) => wordHit(t, k))) return false;
  if (!keywords || keywords.length === 0) return true;
  return keywords.some((k) => wordHit(t, k));
}
