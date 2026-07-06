import { NextResponse } from "next/server";
import { validateSettingsPatch } from "@saa/execution";
import { PLAYBOOKS } from "@saa/agent";
import { getSettings, updateSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: ["body must be valid JSON"] }, { status: 400 });
  }

  const result = validateSettingsPatch(body, { allowedSports: PLAYBOOKS.map((p) => p.sport) });
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }
  return NextResponse.json(updateSettings(result.patch));
}
