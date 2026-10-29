import { NextResponse } from "next/server";
import { jsonError, readBody, sameOrigin } from "@/lib/server/guard";
import { blockedFor, clientIp, hit } from "@/lib/server/rate-limit";
import { hasSharedStorage, readCatalogFresh } from "@/lib/server/storage";
import { findCustomerOrder } from "@/lib/server/returns";
import { catalogToStoreData } from "@/lib/repository";
import { daysSince } from "@/lib/returns";

const MAX_TRIES = 12;
const WINDOW_MS = 15 * 60 * 1000;

/** Lets a customer open their own order (number + phone) to choose what to return. */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("الخدمة غير متاحة الآن. راسلينا على واتساب.", 503);
  if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
  const ip = clientIp(request);
  const wait = blockedFor("returns-lookup", ip, MAX_TRIES);
  if (wait) return jsonError("محاولات كثيرة. حاولي بعد قليل أو راسلينا على واتساب.", 429);
  hit("returns-lookup", ip, WINDOW_MS);

  let body: { number?: unknown; phone?: unknown };
  try {
    body = (await readBody(request, 2_000)) as typeof body;
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  const order = await findCustomerOrder(body?.number, body?.phone);
  if (!order) return jsonError("لم نجد طلبًا بهذا الرقم وهذا الهاتف. تأكدي منهما كما في رسالة واتساب.", 404);
  const store = catalogToStoreData(await readCatalogFresh());
  const products = new Map(store.products.map((p) => [p.id, p]));
  return NextResponse.json(
    {
      ok: true,
      order: {
        number: order.number,
        createdAt: order.createdAt,
        name: order.customer.name,
        lines: order.lines.map((l) => ({ ...l, image: products.get(l.refId)?.images[0] ?? "" })),
      },
      days: daysSince(order.createdAt),
      returnDays: store.settings.returnDays,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
