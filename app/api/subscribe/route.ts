import { NextResponse } from "next/server";
import { jsonError, readBody } from "@/lib/server/guard";
import { hasSharedStorage, writeSubscriber } from "@/lib/server/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  if (!hasSharedStorage()) return jsonError("التخزين المشترك غير متصل.", 503);
  let email = "";
  try {
    const body = (await readBody(request, 2_000)) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  } catch {
    return jsonError("طلب غير صالح.", 400);
  }
  if (!EMAIL_RE.test(email)) return jsonError("يرجى إدخال بريد إلكتروني صحيح.", 400);
  await writeSubscriber({ email, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
