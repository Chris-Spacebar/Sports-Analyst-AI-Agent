export const pct = (p: number | null | undefined, digits = 0): string =>
  p != null ? `${(p * 100).toFixed(digits)}%` : "n/a";

export const cents = (p: number, digits = 0): string => `${(p * 100).toFixed(digits)}¢`;
