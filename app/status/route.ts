import { NextResponse } from "next/server";
import { hasSharedStorage } from "@/lib/server/storage";

/** Health check: is shared storage connected? Reveals nothing else. */
export function GET() {
  return NextResponse.json({ ok: true, sharedStorage: hasSharedStorage() }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
