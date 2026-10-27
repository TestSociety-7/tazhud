import { NextResponse } from "next/server";
import { cleanOrder, jsonError, readBody } from "@/lib/server/guard";
import { hasSharedStorage, orderExists, writeOrder } from "@/lib/server/storage";

/** Saves a copy of a checkout for the admin. The order itself is sent on WhatsApp. */
export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("التخزين المشترك غير متصل.", 503);
  let order;
  try {
    order = cleanOrder(await readBody(request, 100_000));
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  if (!order || !order.customer.name || !order.customer.phone) return jsonError("طلب غير صالح.", 400);
  // Customers can only create new inquiries, never edit existing ones.
  if (await orderExists(order.id)) return jsonError("هذا الطلب محفوظ مسبقًا.", 409);
  await writeOrder({ ...order, status: "new", adminNote: "", createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
