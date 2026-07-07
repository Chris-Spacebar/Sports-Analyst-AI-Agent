import { promises as fs } from "node:fs";
import path from "node:path";
import { computeForecasters, gradeThesis, housePickFor } from "./grade";
import { communitySeed, type CommunityData, type ReactionRecord } from "./seed";
import type {
  CommunityPick,
  CommunityThesis,
  FloorThesis,
  ForecasterStat,
  ReactionKind,
  ThesisComment
} from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "community.json");

/**
 * Every mutation is a read-modify-write, so all disk work is serialized through
 * one promise chain: an in-process mutex. Two POSTs cannot interleave a read
 * against each other's write and clobber a count.
 */
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  // Keep the chain alive even if a job rejects, without leaking the rejection.
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isReactionKind(v: unknown): v is ReactionKind {
  return v === "tail" || v === "fade";
}

function validPick(v: unknown): CommunityPick | undefined {
  if (v == null || typeof v !== "object") return undefined;
  const p = v as Record<string, unknown>;
  if (typeof p.eventKey !== "string") return undefined;
  if (typeof p.outcome !== "string") return undefined;
  if (p.side !== "YES" && p.side !== "NO") return undefined;
  if (typeof p.probability !== "number" || !Number.isFinite(p.probability)) return undefined;
  return {
    eventKey: p.eventKey,
    outcome: p.outcome,
    side: p.side,
    probability: p.probability
  };
}

function validThesis(v: unknown): CommunityThesis | null {
  if (v == null || typeof v !== "object") return null;
  const t = v as Record<string, unknown>;
  if (
    typeof t.id !== "string" ||
    typeof t.eventKey !== "string" ||
    typeof t.authorId !== "string" ||
    typeof t.handle !== "string" ||
    typeof t.title !== "string" ||
    typeof t.body !== "string" ||
    typeof t.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: t.id,
    eventKey: t.eventKey,
    authorId: t.authorId,
    handle: t.handle,
    title: t.title,
    body: t.body,
    createdAt: t.createdAt,
    pick: validPick(t.pick),
    tail: 0,
    fade: 0,
    commentCount: 0
  };
}

function validReaction(v: unknown): ReactionRecord | null {
  if (v == null || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  if (typeof r.thesisId !== "string" || typeof r.authorId !== "string" || !isReactionKind(r.kind)) {
    return null;
  }
  return { thesisId: r.thesisId, authorId: r.authorId, kind: r.kind };
}

function validComment(v: unknown): ThesisComment | null {
  if (v == null || typeof v !== "object") return null;
  const c = v as Record<string, unknown>;
  if (
    typeof c.id !== "string" ||
    typeof c.thesisId !== "string" ||
    typeof c.authorId !== "string" ||
    typeof c.handle !== "string" ||
    typeof c.body !== "string" ||
    typeof c.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: c.id,
    thesisId: c.thesisId,
    authorId: c.authorId,
    handle: c.handle,
    body: c.body,
    createdAt: c.createdAt
  };
}

function repair(raw: unknown): CommunityData {
  const r = (raw ?? {}) as Record<string, unknown>;
  const theses = Array.isArray(r.theses)
    ? (r.theses.map(validThesis).filter(Boolean) as CommunityThesis[])
    : [];
  const reactions = Array.isArray(r.reactions)
    ? (r.reactions.map(validReaction).filter(Boolean) as ReactionRecord[])
    : [];
  const comments = Array.isArray(r.comments)
    ? (r.comments.map(validComment).filter(Boolean) as ThesisComment[])
    : [];
  return { theses, reactions, comments };
}

/**
 * Read the backing file, falling back to seed data whenever it is missing,
 * empty, or malformed. A read never throws to the caller: a corrupt file must
 * not take the whole floor down.
 */
async function load(): Promise<CommunityData> {
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    if (text.trim().length === 0) return communitySeed();
    const data = repair(JSON.parse(text));
    if (data.theses.length === 0) return communitySeed();
    return data;
  } catch {
    return communitySeed();
  }
}

async function save(data: CommunityData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = path.join(DATA_DIR, `community.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  // Write to a temp file then rename: a reader never sees a half-written file.
  await fs.rename(tmp, DATA_FILE);
}

function reactionCounts(reactions: ReactionRecord[], thesisId: string): { tail: number; fade: number } {
  let tail = 0;
  let fade = 0;
  for (const r of reactions) {
    if (r.thesisId !== thesisId) continue;
    if (r.kind === "tail") tail += 1;
    else fade += 1;
  }
  return { tail, fade };
}

function yourReaction(
  reactions: ReactionRecord[],
  thesisId: string,
  me: string | undefined
): ReactionKind | null {
  if (!me) return null;
  const found = reactions.find((r) => r.thesisId === thesisId && r.authorId === me);
  return found ? found.kind : null;
}

function commentCountFor(comments: ThesisComment[], thesisId: string): number {
  return comments.reduce((n, c) => (c.thesisId === thesisId ? n + 1 : n), 0);
}

function toFloor(t: CommunityThesis, data: CommunityData, me: string | undefined): FloorThesis {
  const counts = reactionCounts(data.reactions, t.id);
  return {
    ...t,
    tail: counts.tail,
    fade: counts.fade,
    commentCount: commentCountFor(data.comments, t.id),
    your: yourReaction(data.reactions, t.id, me),
    graded: gradeThesis(t),
    house: housePickFor(t.eventKey)
  };
}

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export async function listTheses(opts?: {
  eventKey?: string;
  limit?: number;
  me?: string;
}): Promise<FloorThesis[]> {
  const data = await load();
  let rows = [...data.theses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts?.eventKey) rows = rows.filter((t) => t.eventKey === opts.eventKey);
  if (typeof opts?.limit === "number") rows = rows.slice(0, opts.limit);
  return rows.map((t) => toFloor(t, data, opts?.me));
}

export async function getThesis(id: string): Promise<CommunityThesis | undefined> {
  const data = await load();
  return data.theses.find((t) => t.id === id);
}

export async function addThesis(input: {
  eventKey: string;
  authorId: string;
  handle: string;
  title: string;
  body: string;
  pick?: CommunityPick;
}): Promise<CommunityThesis> {
  return serialize(async () => {
    const data = await load();
    const thesis: CommunityThesis = {
      id: newId("th"),
      eventKey: input.eventKey,
      authorId: input.authorId,
      handle: input.handle,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
      pick: input.pick,
      tail: 0,
      fade: 0,
      commentCount: 0
    };
    data.theses.push(thesis);
    await save(data);
    return thesis;
  });
}

export async function react(
  thesisId: string,
  authorId: string,
  kind: ReactionKind
): Promise<{ tail: number; fade: number; your: ReactionKind | null }> {
  return serialize(async () => {
    const data = await load();
    const idx = data.reactions.findIndex(
      (r) => r.thesisId === thesisId && r.authorId === authorId
    );
    let your: ReactionKind | null;
    if (idx === -1) {
      data.reactions.push({ thesisId, authorId, kind });
      your = kind;
    } else if (data.reactions[idx].kind === kind) {
      // Same kind again toggles the reaction off.
      data.reactions.splice(idx, 1);
      your = null;
    } else {
      data.reactions[idx].kind = kind;
      your = kind;
    }
    await save(data);
    const counts = reactionCounts(data.reactions, thesisId);
    return { tail: counts.tail, fade: counts.fade, your };
  });
}

export async function listComments(thesisId: string): Promise<ThesisComment[]> {
  const data = await load();
  return data.comments
    .filter((c) => c.thesisId === thesisId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addComment(input: {
  thesisId: string;
  authorId: string;
  handle: string;
  body: string;
}): Promise<ThesisComment> {
  return serialize(async () => {
    const data = await load();
    const comment: ThesisComment = {
      id: newId("c"),
      thesisId: input.thesisId,
      authorId: input.authorId,
      handle: input.handle,
      body: input.body,
      createdAt: new Date().toISOString()
    };
    data.comments.push(comment);
    await save(data);
    return comment;
  });
}

export async function leaderboard(): Promise<ForecasterStat[]> {
  const data = await load();
  return computeForecasters(data.theses);
}
