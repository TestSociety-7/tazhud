import { formatMoney } from "./commerce";
import { dateFormat, piecesLabel } from "./arabic";
import type { OrderInquiry, StoreSettings } from "./types";

/** Keeps digits only, as wa.me expects (country code, no +, spaces or dashes). */
export function normalizeWhatsappNumber(input: string) {
  return input.replace(/\D/g, "");
}

export function isValidWhatsappNumber(input: string) {
  const digits = normalizeWhatsappNumber(input);
  return digits.length >= 8 && digits.length <= 15;
}

export function whatsappLink(number: string, text?: string) {
  const base = `https://wa.me/${normalizeWhatsappNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * The order as the store receives it on WhatsApp: a clear, formal receipt the admin can
 * read at a glance. WhatsApp renders *text* as bold. `picturesUrl` adds a link whose
 * preview shows the ordered pieces above the message.
 */
export function buildOrderMessage(order: OrderInquiry, settings: StoreSettings, picturesUrl?: string) {
  const money = (n: number) => formatMoney(n, settings);
  const rule = "────────────────";
  const pieces = order.lines.reduce((n, l) => n + l.quantity, 0);
  const lines: string[] = [];

  lines.push("السلام عليكم ورحمة الله،");
  lines.push(`أودّ تأكيد الطلب التالي من *${settings.storeName}*.`);
  lines.push("");
  lines.push(`*رقم الطلب:* ${order.number}`);
  lines.push(`*التاريخ:* ${dateFormat(order.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}`);
  lines.push(rule);
  lines.push(`*تفاصيل الطلب* (${piecesLabel(pieces)})`);
  order.lines.forEach((l, i) => {
    lines.push("");
    lines.push(`${i + 1}. *${l.name}*`);
    const options = [l.color && `اللون: ${l.color}`, l.size && `المقاس: ${l.size}`].filter(Boolean).join("  |  ");
    if (options) lines.push(`    ${options}`);
    lines.push(`    الكمية: ${l.quantity} × ${money(l.unitPrice)} = *${money(l.unitPrice * l.quantity)}*`);
  });
  if (picturesUrl) {
    lines.push("");
    lines.push(`صور القطع: ${picturesUrl}`);
  }
  lines.push(rule);
  lines.push("*ملخص الحساب*");
  lines.push(`المجموع الفرعي: ${money(order.subtotal)}`);
  if (order.couponCode) {
    lines.push(order.discount > 0 ? `الخصم (${order.couponCode}): −${money(order.discount)}` : `الخصم (${order.couponCode}): توصيل مجاني`);
  }
  lines.push(`التوصيل: ${order.delivery > 0 ? money(order.delivery) : "مجاني"}`);
  lines.push(`*الإجمالي المستحق: ${money(order.total)}*`);
  lines.push(rule);
  lines.push("*بيانات التوصيل*");
  lines.push(`الاسم: ${order.customer.name}`);
  lines.push(`الهاتف: ${order.customer.phone}`);
  lines.push(`العنوان: ${order.customer.address}${order.customer.city ? `، ${order.customer.city}` : ""}`);
  if (order.customer.notes) lines.push(`ملاحظات: ${order.customer.notes}`);
  lines.push(rule);
  lines.push("أرجو تأكيد توفّر القطع وموعد التوصيل وطريقة الدفع.");
  lines.push("شكرًا لكم.");

  return lines.join("\n");
}
