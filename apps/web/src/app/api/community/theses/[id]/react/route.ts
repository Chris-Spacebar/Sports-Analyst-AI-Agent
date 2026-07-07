import { NextResponse } from "next/server";
import { react } from "@/lib/community/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const authorId = typeof body.authorId === "string" ? body.authorId.trim() : "";
  const kind = body.kind;
  if (!authorId || (kind !== "tail" && kind !== "fade")) {
    return NextResponse.json(
      { error: "authorId and a kind of 'tail' or 'fade' are required." },
      { status: 400 }
    );
  }

  const result = await react(id, authorId, kind);
  return NextResponse.json(result);
}
