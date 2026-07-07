import type {
  CommunityPick,
  CommunityThesis,
  FloorThesis,
  ForecasterStat,
  ReactionKind,
  ThesisComment
} from "./types";

export type {
  CommunityPick,
  CommunityThesis,
  FloorThesis,
  ForecasterStat,
  GradedResult,
  ReactionKind,
  ThesisComment
} from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      // Non-JSON error body: fall through to the status-only message.
    }
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchTheses(opts?: {
  eventKey?: string;
  limit?: number;
  me?: string;
}): Promise<FloorThesis[]> {
  const params = new URLSearchParams();
  if (opts?.eventKey) params.set("event", opts.eventKey);
  if (typeof opts?.limit === "number") params.set("limit", String(opts.limit));
  if (opts?.me) params.set("me", opts.me);
  const qs = params.toString();
  const res = await fetch(`/api/community/theses${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  const data = await json<{ theses: FloorThesis[] }>(res);
  return data.theses;
}

export async function postThesis(input: {
  eventKey: string;
  authorId: string;
  handle: string;
  title: string;
  body: string;
  pick?: CommunityPick;
}): Promise<CommunityThesis> {
  const res = await fetch("/api/community/theses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await json<{ thesis: CommunityThesis }>(res);
  return data.thesis;
}

export async function reactThesis(
  id: string,
  authorId: string,
  kind: ReactionKind
): Promise<{ tail: number; fade: number; your: ReactionKind | null }> {
  const res = await fetch(`/api/community/theses/${id}/react`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authorId, kind })
  });
  return json<{ tail: number; fade: number; your: ReactionKind | null }>(res);
}

export async function fetchComments(id: string): Promise<ThesisComment[]> {
  const res = await fetch(`/api/community/theses/${id}/comments`, { cache: "no-store" });
  const data = await json<{ comments: ThesisComment[] }>(res);
  return data.comments;
}

export async function postComment(input: {
  thesisId: string;
  authorId: string;
  handle: string;
  body: string;
}): Promise<ThesisComment> {
  const res = await fetch(`/api/community/theses/${input.thesisId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authorId: input.authorId, handle: input.handle, body: input.body })
  });
  const data = await json<{ comment: ThesisComment }>(res);
  return data.comment;
}

export async function fetchLeaderboard(): Promise<ForecasterStat[]> {
  const res = await fetch("/api/community/leaderboard", { cache: "no-store" });
  const data = await json<{ forecasters: ForecasterStat[] }>(res);
  return data.forecasters;
}
