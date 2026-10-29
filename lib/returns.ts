import type { ReturnRequest, ReturnStatus, StoreSettings } from "./types";
import { formatMoney } from "./commerce";

/** The last order placed on this device, so the customer doesn't have to look it up. */
export const LAST_ORDER_KEY = "tz-last-order";

export const RETURN_REASONS = [
  "المقاس غير مناسب",
  "اللون مختلف عن الصورة",
  "عيب في القطعة",
  "وصلتني قطعة غير التي طلبتها",
  "غيّرت رأيي",
] as const;

export const RETURN_STATUS_META: Record<ReturnStatus, { label: string; tone: "neutral" | "green" | "gold" | "red" | "blue" }> = {
  new: { label: "جديد", tone: "gold" },
  contacted: { label: "تم التواصل", tone: "blue" },
  received: { label: "استلمنا القطع", tone: "green" },
  completed: { label: "مكتمل", tone: "neutral" },
  rejected: { label: "مرفوض", tone: "red" },
};

export const RETURN_TYPE_LABEL: Record<ReturnRequest["type"], string> = {
  exchange: "استبدال",
  refund: "إرجاع واسترداد المبلغ",
};

/** Whole days since an ISO date. */
export function daysSince(iso: string, now = Date.now()) {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86_400_000)) : 0;
}

/** Same phone number written two ways (+972 52… and 052…) still matches. */
export function samePhone(a: string, b: string) {
  const da = a.replace(/\D/g, "");
  const db = b.replace(/\D/g, "");
  if (da.length < 7 || db.length < 7) return false;
  return da.slice(-8) === db.slice(-8);
}

/** The WhatsApp message the customer sends with their request (so they can add photos). */
export function buildReturnMessage(r: ReturnRequest, settings: Pick<StoreSettings, "storeName" | "currency" | "locale">) {
  const money = (n: number) => formatMoney(n, settings);
  const lines = [
    `السلام عليكم ${settings.storeName} 🤍`,
    `أرغب في *${RETURN_TYPE_LABEL[r.type]}*.`,
    "",
    `↩️ *رقم الطلب:* ${r.number}`,
    `🧾 *رقم الطلب الأصلي:* ${r.orderNumber}`,
    "",
    "*القطع:*",
    ...r.lines.map((l) => `• ${l.name}${[l.color, l.size].filter(Boolean).length ? ` (${[l.color, l.size].filter(Boolean).join("، ")})` : ""} × ${l.quantity} · ${money(l.unitPrice * l.quantity)}`),
    "",
    `*السبب:* ${r.reason}`,
  ];
  if (r.type === "exchange" && r.wish) lines.push(`*أريد بدلها:* ${r.wish}`);
  if (r.notes) lines.push(`*ملاحظات:* ${r.notes}`);
  lines.push("", `الاسم: ${r.customer.name}`, `الهاتف: ${r.customer.phone}`);
  return lines.join("\n");
}
