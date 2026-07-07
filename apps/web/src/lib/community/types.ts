export type ReactionKind = "tail" | "fade";

export interface CommunityPick {
  eventKey: string;
  outcome: string;
  side: "YES" | "NO";
  probability: number;
}

export interface CommunityThesis {
  id: string;
  eventKey: string;
  authorId: string;
  handle: string;
  title: string;
  body: string;
  createdAt: string;
  pick?: CommunityPick;
  tail: number;
  fade: number;
  commentCount: number;
}

export interface ThesisComment {
  id: string;
  thesisId: string;
  authorId: string;
  handle: string;
  body: string;
  createdAt: string;
}

export interface GradedResult {
  settled: boolean;
  gradeable: boolean;
  hit?: boolean;
  brier?: number;
}

export interface ForecasterStat {
  handle: string;
  authorId: string;
  settled: number;
  correct: number;
  pending: number;
  brier: number | null;
  isHouse?: boolean;
}

export interface FloorThesis extends CommunityThesis {
  your: ReactionKind | null;
  graded: GradedResult;
  house: { winner: string; probability: number } | null;
}
