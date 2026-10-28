import { NextResponse } from "next/server";
import { adminGuard, jsonError, readBody } from "@/lib/server/guard";
import { writeCatalog } from "@/lib/server/storage";
import { normalizeStoreData, splitStoreData } from "@/lib/repository";
import type { StoreData } from "@/lib/types";

function safeHref(value: unknown) {
  const v = typeof value === "string" ? value.trim() : "";
  if (/^\/(?!\/)/.test(v)) return v;
  return /^https?:\/\/[^\s]+$/i.test(v) ? v : "";
}

export async function PUT(request: Request) {
  const denied = await adminGuard(request);
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
  // Links may only point inside the store or to a normal web page (never javascript: and the like).
  const h = catalog.homepage;
  catalog.settings.instagramUrl = safeHref(catalog.settings.instagramUrl);
  h.announcement.link = safeHref(h.announcement.link);
  h.hero.primaryHref = safeHref(h.hero.primaryHref);
  h.hero.secondaryHref = safeHref(h.hero.secondaryHref);
  h.promo.ctaHref = safeHref(h.promo.ctaHref);
  try {
    await writeCatalog(catalog);
  } catch (err) {
    console.error(err);
    return jsonError("تعذّر الحفظ في التخزين. حاول مجددًا.", 502);
  }
  return NextResponse.json({ ok: true });
}
