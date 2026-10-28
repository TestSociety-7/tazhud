import { NextResponse } from "next/server";
import { cleanOrder, jsonError, readBody, sameOrigin } from "@/lib/server/guard";
import { blockedFor, clientIp, hit } from "@/lib/server/rate-limit";
import { hasSharedStorage, orderExists, readCatalogFresh, writeOrder } from "@/lib/server/storage";
import { catalogToStoreData } from "@/lib/repository";
import { deliveryFor, effectivePrice, evaluateCoupon, roundMoney } from "@/lib/commerce";

const MAX_ORDERS = 8;
const WINDOW_MS = 10 * 60 * 1000;

/** Saves a copy of a checkout for the admin. The order itself is sent on WhatsApp. */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("التخزين المشترك غير متصل.", 503);
  if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
  const ip = clientIp(request);
  if (blockedFor("orders", ip, MAX_ORDERS)) return jsonError("طلبات كثيرة في وقت قصير. حاولي بعد قليل.", 429);

  let order;
  try {
    order = cleanOrder(await readBody(request, 100_000));
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  if (!order || !order.customer.name || !order.customer.phone) return jsonError("طلب غير صالح.", 400);
  // Customers can only create new inquiries, never edit existing ones.
  if (await orderExists(order.id)) return jsonError("هذا الطلب محفوظ مسبقًا.", 409);
  hit("orders", ip, WINDOW_MS);

  // Prices come from the saved catalogue, never from the browser.
  const store = catalogToStoreData(await readCatalogFresh());
  const lines = order.lines.flatMap((l) => {
    const p = store.products.find((x) => x.id === l.refId && x.published);
    return p ? [{ ...l, kind: "product" as const, name: p.name, unitPrice: effectivePrice(p) }] : [];
  });
  if (!lines.length) return jsonError("طلب غير صالح.", 400);
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const coupon = store.settings.couponsEnabled && order.couponCode ? evaluateCoupon(order.couponCode, subtotal, store.coupons, store.settings) : null;
  const discount = coupon?.ok ? coupon.discount : 0;
  const delivery = deliveryFor(subtotal - discount, store.settings, Boolean(coupon?.ok && coupon.freeDelivery));

  await writeOrder({
    ...order,
    lines,
    subtotal,
    discount,
    delivery,
    total: roundMoney(subtotal - discount + delivery),
    couponCode: coupon?.ok ? order.couponCode.toUpperCase() : "",
    currency: "ILS",
    status: "new",
    adminNote: "",
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
