import type { OrderInquiry, OrderStatus } from "./types";

/**
 * Orders placed on this phone, kept in the browser so customers can find them again
 * without an account. Only this device sees them; the store keeps its own copy.
 */
export const MY_ORDERS_KEY = "tz-my-orders";
const MAX = 30;

export type SavedOrder = Pick<OrderInquiry, "id" | "number" | "createdAt" | "lines" | "subtotal" | "discount" | "delivery" | "total"> & {
  phone: string;
};

export function readMyOrders(): SavedOrder[] {
  try {
    const list = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || "[]");
    return Array.isArray(list) ? list.filter((o) => o && typeof o.number === "string") : [];
  } catch {
    return [];
  }
}

export function saveMyOrder(order: OrderInquiry) {
  try {
    const saved: SavedOrder = {
      id: order.id,
      number: order.number,
      createdAt: order.createdAt,
      lines: order.lines,
      subtotal: order.subtotal,
      discount: order.discount,
      delivery: order.delivery,
      total: order.total,
      phone: order.customer.phone,
    };
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify([saved, ...readMyOrders().filter((o) => o.number !== order.number)].slice(0, MAX)));
  } catch {
    /* storage unavailable: the order is still on WhatsApp */
  }
}

/** How each order status reads to the customer. */
export const CUSTOMER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: "بانتظار التأكيد", tone: "bg-gold/15 text-gold-deep" },
  contacted: { label: "تواصلنا معكِ", tone: "bg-sand text-forest" },
  confirmed: { label: "مؤكد · قيد التجهيز", tone: "bg-forest/10 text-forest" },
  completed: { label: "تم التوصيل", tone: "bg-success/10 text-success" },
  cancelled: { label: "ملغي", tone: "bg-danger/10 text-danger" },
};
