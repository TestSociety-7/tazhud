import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/server/guard";
import { hasSharedStorage, listOrderIds } from "@/lib/server/storage";

/** Ids of all saved orders. The admin polls this to spot new orders cheaply. */
export async function GET(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const ids = hasSharedStorage() ? await listOrderIds() : [];
  return NextResponse.json({ ids }, { headers: { "Cache-Control": "no-store" } });
}
