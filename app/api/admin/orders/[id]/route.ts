import { NextResponse } from "next/server";
import { adminGuard, cleanOrder, jsonError, ORDER_ID_RE, readBody } from "@/lib/server/guard";
import { deleteOrder, writeOrder } from "@/lib/server/storage";

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  let order;
  try {
    order = cleanOrder(await readBody(request, 100_000));
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  if (!order || order.id !== id) return jsonError("طلب غير صالح.", 400);
  await writeOrder(order);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ORDER_ID_RE.test(id)) return jsonError("طلب غير صالح.", 400);
  await deleteOrder(id);
  return NextResponse.json({ ok: true });
}
