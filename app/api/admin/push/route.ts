import { NextResponse } from "next/server";
import { adminGuard, jsonError, readBody } from "@/lib/server/guard";
import { deletePushSubscription, hasSharedStorage, writePushSubscription } from "@/lib/server/storage";
import { isValidSubscription, notifyAdmins, vapidKeys } from "@/lib/server/push";

/** The public key a device needs to subscribe, and whether notifications can work here. */
export async function GET(request: Request) {
  const denied = await adminGuard(request, { needsStorage: false });
  if (denied) return denied;
  return NextResponse.json({ available: hasSharedStorage(), publicKey: vapidKeys().publicKey }, { headers: { "Cache-Control": "no-store" } });
}

/** Turns new-order notifications on for this device. */
export async function POST(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  if (!hasSharedStorage()) return jsonError("الإشعارات تحتاج ربط التخزين المشترك أولًا.", 503);
  let sub: unknown;
  try {
    sub = await readBody(request, 4_000);
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  if (!isValidSubscription(sub)) return jsonError("طلب غير صالح.", 400);
  await writePushSubscription({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  return NextResponse.json({ ok: true });
}

/** Turns them off for this device. */
export async function DELETE(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  let body: { endpoint?: unknown };
  try {
    body = (await readBody(request, 2_000)) as { endpoint?: unknown };
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  if (typeof body?.endpoint !== "string" || body.endpoint.length > 800) return jsonError("طلب غير صالح.", 400);
  if (hasSharedStorage()) await deletePushSubscription(body.endpoint).catch(() => {});
  return NextResponse.json({ ok: true });
}

/** Sends a test notification to every device that turned them on. */
export async function PUT(request: Request) {
  const denied = await adminGuard(request);
  if (denied) return denied;
  if (!hasSharedStorage()) return jsonError("الإشعارات تحتاج ربط التخزين المشترك أولًا.", 503);
  await notifyAdmins({ title: "إشعار تجريبي ✨", body: "الإشعارات تعمل. سيصلك تنبيه مثل هذا مع كل طلب جديد.", url: "/admin/orders", tag: "test" });
  return NextResponse.json({ ok: true });
}
