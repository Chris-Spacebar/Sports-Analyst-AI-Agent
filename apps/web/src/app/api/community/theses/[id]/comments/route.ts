import { NextResponse } from "next/server";
import { addComment, listComments } from "@/lib/community/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const comments = await listComments(id);
  return NextResponse.json({ comments });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const authorId = typeof body.authorId === "string" ? body.authorId.trim() : "";
  const handle = typeof body.handle === "string" ? body.handle.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";
  if (!authorId || !handle || !bodyText) {
    return NextResponse.json(
      { error: "authorId, handle and body are required." },
      { status: 400 }
    );
  }

  const comment = await addComment({ thesisId: id, authorId, handle, body: bodyText });
  return NextResponse.json({ comment }, { status: 201 });
}
