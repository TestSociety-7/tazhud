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
 * The order as the store receives it on WhatsApp: a clean receipt the admin can read
 * at a glance. WhatsApp renders *text* as bold.
 */
export function buildOrderMessage(order: OrderInquiry, settings: StoreSettings) {
  const money = (n: number) => formatMoney(n, settings);
  const rule = "━━━━━━━━━━━━━━";
  const pieces = order.lines.reduce((n, l) => n + l.quantity, 0);
  const lines: string[] = [];

  lines.push(`السلام عليكم 🌿`);
  lines.push(`طلب جديد من متجر *${settings.storeName}*`);
  lines.push("");
  lines.push(`🧾 *رقم الطلب:* ${order.number}`);
  lines.push(`📅 ${dateFormat(order.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}`);
  lines.push("");
  lines.push(`🛍️ *القطع* (${piecesLabel(pieces)})`);

  order.lines.forEach((l, i) => {
    lines.push(`${i + 1}) *${l.name}*`);
    const options = [l.color && `اللون: ${l.color}`, l.size && `المقاس: ${l.size}`].filter(Boolean).join(" · ");
    if (options) lines.push(`    ${options}`);
    lines.push(`    ${l.quantity} × ${money(l.unitPrice)} = *${money(l.unitPrice * l.quantity)}*`);
  });

  lines.push(rule);
  lines.push(`المجموع: ${money(order.subtotal)}`);
  if (order.couponCode) {
    lines.push(order.discount > 0 ? `الخصم (${order.couponCode}): −${money(order.discount)}` : `الخصم (${order.couponCode}): توصيل مجاني`);
  }
  lines.push(`التوصيل: ${order.delivery > 0 ? money(order.delivery) : "مجاني"}`);
  lines.push(`💳 *الإجمالي: ${money(order.total)}*`);
  lines.push(rule);
  lines.push("");
  lines.push("👤 *بيانات التوصيل*");
  lines.push(`الاسم: ${order.customer.name}`);
  lines.push(`الهاتف: ${order.customer.phone}`);
  lines.push(`العنوان: ${order.customer.address}${order.customer.city ? `، ${order.customer.city}` : ""}`);
  if (order.customer.notes) lines.push(`📝 ملاحظات: ${order.customer.notes}`);
  lines.push("");
  lines.push("أرجو تأكيد الطلب وموعد التوصيل وطريقة الدفع. شكرًا 🤍");

  return lines.join("\n");
}
