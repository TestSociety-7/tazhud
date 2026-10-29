import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/server/guard";
import { readReturns } from "@/lib/server/storage";

export async function GET(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  return NextResponse.json({ returns: await readReturns() }, { headers: { "Cache-Control": "no-store" } });
}
