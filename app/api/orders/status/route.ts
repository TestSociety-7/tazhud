import { NextResponse } from "next/server";
import { jsonError, readBody, sameOrigin } from "@/lib/server/guard";
import { blockedFor, clientIp, hit } from "@/lib/server/rate-limit";
import { hasSharedStorage, readOrdersForLookup } from "@/lib/server/storage";
import { samePhone } from "@/lib/returns";

const MAX_CHECKS = 40;
const WINDOW_MS = 10 * 60 * 1000;

/** Current status of the customer's own orders (each one needs its number and phone). */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return NextResponse.json({ ok: true, statuses: {} });
  if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
  const ip = clientIp(request);
  if (blockedFor("order-status", ip, MAX_CHECKS)) return jsonError("محاولات كثيرة. حاولي بعد قليل.", 429);

  let body: { orders?: unknown };
  try {
    body = (await readBody(request, 8_000)) as typeof body;
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  const asked = (Array.isArray(body?.orders) ? body.orders : []).slice(0, 10).flatMap((raw) => {
    const o = (raw ?? {}) as { number?: unknown; phone?: unknown };
    return typeof o.number === "string" && typeof o.phone === "string" ? [{ number: o.number.toUpperCase().slice(0, 32), phone: o.phone.slice(0, 40) }] : [];
  });
  if (!asked.length) return NextResponse.json({ ok: true, statuses: {} });
  // Each number checked counts as one try, so numbers can't be guessed in bulk.
  for (let i = 0; i < asked.length; i++) hit("order-status", ip, WINDOW_MS);
  const orders = await readOrdersForLookup();
  const statuses: Record<string, string> = {};
  for (const a of asked) {
    const o = orders.find((x) => x.number.toUpperCase() === a.number && samePhone(x.customer.phone, a.phone));
    if (o) statuses[o.number] = o.status;
  }
  return NextResponse.json({ ok: true, statuses }, { headers: { "Cache-Control": "no-store" } });
}
