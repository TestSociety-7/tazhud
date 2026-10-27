import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { hasSharedStorage } from "./storage";

export async function isAdmin() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export const jsonError = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

/** Returns an error response when the request may not use the admin API. */
export async function adminGuard() {
  if (!(await isAdmin())) return jsonError("انتهت جلسة الدخول. سجّل الدخول مجددًا.", 401);
  if (!hasSharedStorage()) return jsonError("التخزين المشترك غير متصل.", 503);
  return null;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v * 100) / 100) : 0);

export const ORDER_ID_RE = /^ord-[a-z0-9-]{4,40}$/i;
const STATUSES = new Set(["new", "contacted", "confirmed", "completed", "cancelled"]);

/** Trims and bounds every field of an order sent by a browser. */
export function cleanOrder(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const id = str(o.id, 48);
  if (!ORDER_ID_RE.test(id)) return null;
  const customer = (o.customer ?? {}) as Record<string, unknown>;
  const lines = Array.isArray(o.lines) ? o.lines.slice(0, 60) : [];
  if (!lines.length) return null;
  return {
    id,
    number: str(o.number, 32) || id,
    createdAt: str(o.createdAt, 40) || new Date().toISOString(),
    status: (STATUSES.has(o.status as string) ? o.status : "new") as "new",
    customer: {
      name: str(customer.name, 120),
      phone: str(customer.phone, 40),
      address: str(customer.address, 400),
      city: str(customer.city, 120),
      notes: str(customer.notes, 600),
    },
    lines: lines.map((raw) => {
      const l = (raw ?? {}) as Record<string, unknown>;
      return {
        kind: l.kind === "bundle" ? ("bundle" as const) : ("product" as const),
        refId: str(l.refId, 80),
        name: str(l.name, 200),
        color: str(l.color, 60) || undefined,
        size: str(l.size, 60) || undefined,
        quantity: Math.min(999, Math.max(1, Math.round(num(l.quantity)))),
        unitPrice: num(l.unitPrice),
      };
    }),
    subtotal: num(o.subtotal),
    discount: num(o.discount),
    delivery: num(o.delivery),
    total: num(o.total),
    couponCode: str(o.couponCode, 40),
    currency: str(o.currency, 8) || "USD",
    adminNote: str(o.adminNote, 2000),
  };
}

export async function readBody(request: Request, maxBytes: number) {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("too_large");
  return JSON.parse(text) as unknown;
}
