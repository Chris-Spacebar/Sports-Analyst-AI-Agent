import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settingsStore";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  const patch = await req.json();
  return NextResponse.json(updateSettings(patch));
}
