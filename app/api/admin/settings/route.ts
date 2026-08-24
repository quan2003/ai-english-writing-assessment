import { NextRequest, NextResponse } from "next/server";
import { getSystemConfig, saveSystemConfig } from "@/lib/systemConfig";

export async function GET() {
  const config = getSystemConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = saveSystemConfig(body);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
