import { after, NextResponse } from "next/server";
import { jsonError, readBody, sameOrigin } from "@/lib/server/guard";
import { blockedFor, clientIp, hit } from "@/lib/server/rate-limit";
import { hasSharedStorage, writeReturn } from "@/lib/server/storage";
import { findCustomerOrder } from "@/lib/server/returns";
import { notifyAdmins } from "@/lib/server/push";
import { newId } from "@/lib/commerce";
import { RETURN_REASONS, RETURN_TYPE_LABEL } from "@/lib/returns";
import type { ReturnRequest } from "@/lib/types";

const MAX_REQUESTS = 5;
const WINDOW_MS = 30 * 60 * 1000;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Saves a return or exchange request for the admin. The customer also sends it on WhatsApp. */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("الخدمة غير متاحة الآن. راسلينا على واتساب.", 503);
  if (!sameOrigin(request)) return jsonError("طلب غير مسموح.", 403);
  const ip = clientIp(request);
  if (blockedFor("returns", ip, MAX_REQUESTS)) return jsonError("طلبات كثيرة في وقت قصير. راسلينا على واتساب.", 429);

  let body: Record<string, unknown>;
  try {
    body = (await readBody(request, 10_000)) as Record<string, unknown>;
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  const order = await findCustomerOrder(body?.orderNumber, body?.phone);
  if (!order) return jsonError("لم نجد هذا الطلب.", 404);

  // Only pieces from the order itself, never more than were bought.
  const picks = Array.isArray(body.items) ? body.items.slice(0, 60) : [];
  const lines = picks.flatMap((raw) => {
    const it = (raw ?? {}) as { index?: unknown; quantity?: unknown };
    const line = typeof it.index === "number" ? order.lines[it.index] : undefined;
    const qty = typeof it.quantity === "number" ? Math.round(it.quantity) : 0;
    if (!line || qty < 1) return [];
    return [{ refId: line.refId, name: line.name, color: line.color, size: line.size, unitPrice: line.unitPrice, quantity: Math.min(qty, line.quantity) }];
  });
  const type = body.type === "refund" ? "refund" : body.type === "exchange" ? "exchange" : null;
  const reason = str(body.reason, 120);
  if (!lines.length || !type || !reason) return jsonError("اختاري القطع وسبب الطلب.", 400);
  hit("returns", ip, WINDOW_MS);

  const rand = Math.floor(1000 + Math.random() * 9000);
  const ret: ReturnRequest = {
    id: newId("ret"),
    number: `R-${order.number.replace(/^TZ-/, "")}-${rand}`,
    createdAt: new Date().toISOString(),
    status: "new",
    orderId: order.id,
    orderNumber: order.number,
    orderDate: order.createdAt,
    customer: { name: order.customer.name, phone: order.customer.phone },
    lines,
    type,
    reason: (RETURN_REASONS as readonly string[]).includes(reason) ? reason : reason.slice(0, 120),
    wish: type === "exchange" ? str(body.wish, 200) : "",
    notes: str(body.notes, 500),
    adminNote: "",
  };
  await writeReturn(ret);
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  after(() =>
    notifyAdmins({
      title: `طلب ${RETURN_TYPE_LABEL[type]} ↩️`,
      body: `${ret.customer.name} · ${pieces} ${pieces === 1 ? "قطعة" : "قطع"} · ${reason}`,
      url: `/admin/returns?open=${encodeURIComponent(ret.id)}`,
      tag: ret.id,
    }),
  );
  return NextResponse.json({ ok: true, request: ret });
}
