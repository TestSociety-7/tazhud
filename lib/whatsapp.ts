import { formatMoney } from "./commerce";
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

export function buildOrderMessage(order: OrderInquiry, settings: StoreSettings) {
  const money = (n: number) => formatMoney(n, settings);
  const rule = "------------------------------";
  const lines: string[] = [];

  lines.push(`السلام عليكم ${settings.storeName}، أرغب بتأكيد هذا الطلب.`);
  lines.push("");
  lines.push(`*طلب رقم ${order.number}*`);
  lines.push(rule);

  order.lines.forEach((l, i) => {
    const options = [l.color, l.size].filter(Boolean).join(" / ");
    lines.push(`${i + 1}. *${l.name}*${l.kind === "bundle" ? " (مجموعة)" : ""}`);
    if (options) lines.push(`    ${options}`);
    lines.push(`    ${l.quantity} × ${money(l.unitPrice)} = ${money(l.unitPrice * l.quantity)}`);
  });

  lines.push(rule);
  lines.push(`المجموع الفرعي: ${money(order.subtotal)}`);
  if (order.couponCode) {
    lines.push(
      order.discount > 0
        ? `كود الخصم ${order.couponCode}: -${money(order.discount)}`
        : `كود الخصم ${order.couponCode}: توصيل مجاني`,
    );
  }
  lines.push(`التوصيل: ${order.delivery > 0 ? money(order.delivery) : "مجاني"}`);
  lines.push(`*الإجمالي: ${money(order.total)}*`);
  lines.push("");
  lines.push("*بيانات التوصيل*");
  lines.push(`الاسم: ${order.customer.name}`);
  lines.push(`الهاتف: ${order.customer.phone}`);
  lines.push(`العنوان: ${order.customer.address}${order.customer.city ? `، ${order.customer.city}` : ""}`);
  if (order.customer.notes) lines.push(`ملاحظات: ${order.customer.notes}`);
  lines.push("");
  lines.push("أرجو تأكيد التوفر وموعد التوصيل وطريقة الدفع. شكرًا لكم!");

  return lines.join("\n");
}
