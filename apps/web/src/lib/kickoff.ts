import type { ReportMatch } from "@/lib/reports";

export type MatchState = "upcoming" | "played" | "settled";

const kickoffTime = (m: ReportMatch): number =>
  m.kickoffISO ? new Date(m.kickoffISO).getTime() : Number.POSITIVE_INFINITY;

export function matchState(m: ReportMatch, now?: Date | null): MatchState {
  if (m.result.settled) return "settled";
  if (now && m.kickoffISO && new Date(m.kickoffISO).getTime() <= now.getTime()) return "played";
  return "upcoming";
}

export function nextUpcoming(matches: ReportMatch[], now?: Date | null): ReportMatch | undefined {
  return matches
    .filter(
      (m) =>
        !m.result.settled &&
        m.kickoffISO != null &&
        (!now || new Date(m.kickoffISO).getTime() > now.getTime())
    )
    .sort((a, b) => kickoffTime(a) - kickoffTime(b))[0];
}

export function sortForDisplay(matches: ReportMatch[], now?: Date | null): ReportMatch[] {
  const upcoming = matches
    .filter((m) => matchState(m, now) === "upcoming")
    .sort((a, b) => kickoffTime(a) - kickoffTime(b));
  const played = matches
    .filter((m) => matchState(m, now) === "played")
    .sort((a, b) => kickoffTime(a) - kickoffTime(b));
  const settled = matches.filter((m) => matchState(m, now) === "settled");
  return [...upcoming, ...played, ...settled];
}
