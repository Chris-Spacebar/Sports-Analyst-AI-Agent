import { NextResponse } from "next/server";
import { addThesis, listTheses } from "@/lib/community/store";
import type { CommunityPick } from "@/lib/community/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventKey = url.searchParams.get("event") ?? undefined;
  const me = url.searchParams.get("me") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw != null && Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : undefined;
  const theses = await listTheses({ eventKey, me, limit });
  return NextResponse.json({ theses });
}

function parsePick(v: unknown): CommunityPick | undefined | "invalid" {
  if (v == null) return undefined;
  if (typeof v !== "object") return "invalid";
  const p = v as Record<string, unknown>;
  if (typeof p.eventKey !== "string" || typeof p.outcome !== "string") return "invalid";
  if (p.side !== "YES" && p.side !== "NO") return "invalid";
  const probability = Number(p.probability);
  // Stated probability must be a real edge, strictly inside 0..1.
  if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) return "invalid";
  return { eventKey: p.eventKey, outcome: p.outcome, side: p.side, probability };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventKey = typeof body.eventKey === "string" ? body.eventKey.trim() : "";
  const authorId = typeof body.authorId === "string" ? body.authorId.trim() : "";
  const handle = typeof body.handle === "string" ? body.handle.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";

  if (!eventKey || !authorId || !handle || !title || !bodyText) {
    return NextResponse.json(
      { error: "eventKey, authorId, handle, title and body are required." },
      { status: 400 }
    );
  }

  const pick = parsePick(body.pick);
  if (pick === "invalid") {
    return NextResponse.json(
      { error: "Pick must name an outcome, a YES/NO side, and a probability strictly between 0 and 1." },
      { status: 400 }
    );
  }

  const thesis = await addThesis({ eventKey, authorId, handle, title, body: bodyText, pick });
  return NextResponse.json({ thesis }, { status: 201 });
}
