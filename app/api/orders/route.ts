import { after, NextResponse } from "next/server";
import { cleanOrder, jsonError, readBody, sameOrigin } from "@/lib/server/guard";
import { blockedFor, clientIp, hit } from "@/lib/server/rate-limit";
import { hasSharedStorage, orderExists, readCatalogFresh, writeOrder } from "@/lib/server/storage";
import { catalogToStoreData } from "@/lib/repository";
import { bundleDetails, deliveryFor, effectivePrice, evaluateCoupon, formatMoney, roundMoney } from "@/lib/commerce";
import { notifyAdmins } from "@/lib/server/push";
import { orderFlood } from "@/lib/server/spam";
import type { OrderLine } from "@/lib/types";

const MAX_ORDERS = 8;
/** The number the checkout makes, e.g. TZ-261029-4821. */
const NUMBER_RE = /^TZ-\d{6}-\d{4}$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
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
  // Same checks as the checkout form, so hand-made requests can't slip junk in.
  const digits = order.customer.phone.replace(/\D/g, "");
  if (!NUMBER_RE.test(order.number) || !PHONE_RE.test(order.customer.phone) || digits.length < 7 || digits.length > 15) {
    return jsonError("طلب غير صالح.", 400);
  }
  // Customers can only create new inquiries, never edit existing ones.
  if (await orderExists(order.id)) return jsonError("هذا الطلب محفوظ مسبقًا.", 409);
  hit("orders", ip, WINDOW_MS);
  const flood = await orderFlood(order.customer.phone);
  if (flood) return jsonError(flood, 429);

  // Prices come from the saved catalogue, never from the browser.
  const store = catalogToStoreData(await readCatalogFresh());
  const lines = order.lines.flatMap((l): OrderLine[] => {
    if (l.kind === "bundle") {
      const b = store.bundles.find((x) => x.id === l.refId);
      if (!b || !bundleDetails(b, store.products).available) return [];
      return [{ ...l, kind: "bundle", name: b.name, color: "", size: "", unitPrice: b.price }];
    }
    const p = store.products.find((x) => x.id === l.refId && x.published);
    if (!p) return [];
    // Only a colour and size the piece really comes in.
    const color = p.colors.some((c) => c.name === l.color) ? l.color : undefined;
    const size = p.sizes.includes(l.size ?? "") ? l.size : undefined;
    return [{ ...l, kind: "product", name: p.name, color, size, unitPrice: effectivePrice(p) }];
  });
  if (!lines.length) return jsonError("طلب غير صالح.", 400);
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const coupon = store.settings.couponsEnabled && order.couponCode ? evaluateCoupon(order.couponCode, subtotal, store.coupons, store.settings) : null;
  const discount = coupon?.ok ? coupon.discount : 0;
  const delivery = deliveryFor(subtotal - discount, store.settings, Boolean(coupon?.ok && coupon.freeDelivery));

  const total = roundMoney(subtotal - discount + delivery);
  await writeOrder({
    ...order,
    lines,
    subtotal,
    discount,
    delivery,
    total,
    couponCode: coupon?.ok ? order.couponCode.toUpperCase() : "",
    currency: "ILS",
    status: "new",
    adminNote: "",
    createdAt: new Date().toISOString(),
  });
  // Tell the admin's phone right away, after the customer already has the answer.
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  after(() =>
    notifyAdmins({
      title: "طلب جديد 🛍️",
      body: `${order.customer.name} · ${pieces} ${pieces === 1 ? "قطعة" : "قطع"} · ${formatMoney(total, store.settings)}`,
      url: `/admin/orders?open=${encodeURIComponent(order.id)}`,
      tag: order.id,
    }),
  );
  return NextResponse.json({ ok: true });
}
