"use client";

/**
 * Thesis persistence interface — Phase B ships the INTERFACE against local
 * storage only; swap `localThesisRepository` for a Supabase-backed
 * implementation when accounts land. Nothing outside this file should know
 * where theses live.
 */

export interface Thesis {
  id: string;
  eventKey: string;
  author: string;
  title: string;
  body: string;
  createdAt: string;
  /** Present on auto-scorable theses; absent on free-form ones. */
  pick?: {
    outcome: string;
    side: "YES" | "NO";
    /** Stated probability of the pick, 0..1. */
    probability: number;
    confidence?: number;
    venue?: string;
    priceAtPost?: number | null;
  };
}

export interface EventComment {
  id: string;
  eventKey: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ThesisRepository {
  listTheses(eventKey?: string): Thesis[];
  addThesis(t: Omit<Thesis, "id" | "createdAt">): Thesis;
  listComments(eventKey: string): EventComment[];
  addComment(c: Omit<EventComment, "id" | "createdAt">): EventComment;
}

const THESES_KEY = "saa:theses";
const COMMENTS_KEY = "saa:comments";

function read<T extends { eventKey: string; createdAt: string }>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(v)) return [];
    // One malformed entry (extension, older schema) must not crash every page
    // forever — drop anything without the fields the sort/filter code touches.
    return v.filter(
      (x): x is T =>
        x != null && typeof x === "object" && typeof x.eventKey === "string" && typeof x.createdAt === "string"
    );
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full/unavailable — the session keeps working, entries just don't persist.
  }
}

const newId = () => `t_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const localThesisRepository: ThesisRepository = {
  listTheses(eventKey) {
    const all = read<Thesis>(THESES_KEY).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return eventKey ? all.filter((t) => t.eventKey === eventKey) : all;
  },
  addThesis(t) {
    const thesis: Thesis = { ...t, id: newId(), createdAt: new Date().toISOString() };
    write(THESES_KEY, [...read<Thesis>(THESES_KEY), thesis]);
    return thesis;
  },
  listComments(eventKey) {
    return read<EventComment>(COMMENTS_KEY)
      .filter((c) => c.eventKey === eventKey)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  addComment(c) {
    const comment: EventComment = { ...c, id: newId(), createdAt: new Date().toISOString() };
    write(COMMENTS_KEY, [...read<EventComment>(COMMENTS_KEY), comment]);
    return comment;
  }
};
