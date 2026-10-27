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

  lines.push(`Assalamu alaikum ${settings.storeName}, I'd like to place an order.`);
  lines.push("");
  lines.push(`*Order ${order.number}*`);
  lines.push(rule);

  order.lines.forEach((l, i) => {
    const options = [l.color, l.size].filter(Boolean).join(" / ");
    lines.push(`${i + 1}. *${l.name}*${l.kind === "bundle" ? " (bundle)" : ""}`);
    if (options) lines.push(`    ${options}`);
    lines.push(`    ${l.quantity} x ${money(l.unitPrice)} = ${money(l.unitPrice * l.quantity)}`);
  });

  lines.push(rule);
  lines.push(`Subtotal: ${money(order.subtotal)}`);
  if (order.couponCode) {
    lines.push(
      order.discount > 0
        ? `Coupon ${order.couponCode}: -${money(order.discount)}`
        : `Coupon ${order.couponCode}: free delivery`,
    );
  }
  lines.push(`Delivery: ${order.delivery > 0 ? money(order.delivery) : "Free"}`);
  lines.push(`*Total: ${money(order.total)}*`);
  lines.push("");
  lines.push("*Delivery details*");
  lines.push(`Name: ${order.customer.name}`);
  lines.push(`Phone: ${order.customer.phone}`);
  lines.push(`Address: ${order.customer.address}${order.customer.city ? `, ${order.customer.city}` : ""}`);
  if (order.customer.notes) lines.push(`Notes: ${order.customer.notes}`);
  lines.push("");
  lines.push("Please confirm availability, delivery time and payment. Thank you!");

  return lines.join("\n");
}
