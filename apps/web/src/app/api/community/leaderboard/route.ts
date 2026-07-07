import { NextResponse } from "next/server";
import { leaderboard } from "@/lib/community/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const forecasters = await leaderboard();
  return NextResponse.json({ forecasters });
}
