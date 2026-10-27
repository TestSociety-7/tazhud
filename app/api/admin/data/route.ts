import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/server/guard";
import { readCatalogFresh, readOrders, readSubscribers } from "@/lib/server/storage";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const [catalog, orders, subscribers] = await Promise.all([readCatalogFresh(), readOrders(), readSubscribers()]);
  return NextResponse.json({ catalog, orders, subscribers }, { headers: { "Cache-Control": "no-store" } });
}
