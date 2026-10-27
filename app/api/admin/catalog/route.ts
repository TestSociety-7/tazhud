import { NextResponse } from "next/server";
import { adminGuard, jsonError, readBody } from "@/lib/server/guard";
import { writeCatalog } from "@/lib/server/storage";
import { normalizeStoreData, splitStoreData } from "@/lib/repository";
import type { StoreData } from "@/lib/types";

export async function PUT(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await readBody(request, 4_000_000);
  } catch (err) {
    return err instanceof Error && err.message === "too_large"
      ? jsonError("البيانات كبيرة جدًا. استخدم صورًا أصغر.", 413)
      : jsonError("طلب غير صالح.", 400);
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as StoreData).products)) {
    return jsonError("طلب غير صالح.", 400);
  }
  const { catalog } = splitStoreData(normalizeStoreData({ ...(body as StoreData), version: 1 }));
  try {
    await writeCatalog(catalog);
  } catch (err) {
    console.error(err);
    return jsonError("تعذّر الحفظ في التخزين. حاول مجددًا.", 502);
  }
  return NextResponse.json({ ok: true });
}
