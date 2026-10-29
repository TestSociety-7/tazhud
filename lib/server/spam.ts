import { readRecent } from "./storage";
import { samePhone } from "@/lib/returns";
import type { OrderInquiry, ReturnRequest } from "@/lib/types";

/**
 * Limits that hold across every server copy, because they count what is
 * actually saved in storage (the per-IP limits in rate-limit.ts only see one
 * copy). They stop a bot from flooding the admin with fake orders or returns.
 */
const MINUTE = 60 * 1000;

/** Most new orders the whole store accepts in 10 minutes; a real rush is far below this. */
const STORE_ORDERS_PER_10_MIN = 40;
/** Most orders one phone number can place in an hour. */
const PHONE_ORDERS_PER_HOUR = 3;

/** An error message when this order looks like a flood, otherwise null. */
export async function orderFlood(phone: string): Promise<string | null> {
  const lastHour = await readRecent<OrderInquiry>("orders", 60 * MINUTE);
  const last10 = lastHour.filter((o) => Date.parse(o.createdAt) >= Date.now() - 10 * MINUTE);
  if (last10.length >= STORE_ORDERS_PER_10_MIN) return "الطلبات كثيرة الآن. أرسلي طلبكِ على واتساب مباشرة.";
  if (lastHour.filter((o) => samePhone(o.customer.phone, phone)).length >= PHONE_ORDERS_PER_HOUR) {
    return "وصلتنا عدة طلبات من هذا الرقم. سنتواصل معكِ على واتساب قريبًا.";
  }
  return null;
}

const STORE_RETURNS_PER_10_MIN = 20;
const RETURNS_PER_ORDER_PER_DAY = 2;

/** An error message when this return request looks like a flood, otherwise null. */
export async function returnFlood(orderNumber: string): Promise<string | null> {
  const lastDay = await readRecent<ReturnRequest>("returns", 24 * 60 * MINUTE);
  const last10 = lastDay.filter((r) => Date.parse(r.createdAt) >= Date.now() - 10 * MINUTE);
  if (last10.length >= STORE_RETURNS_PER_10_MIN) return "الطلبات كثيرة الآن. راسلينا على واتساب.";
  if (lastDay.filter((r) => r.orderNumber === orderNumber).length >= RETURNS_PER_ORDER_PER_DAY) {
    return "استلمنا طلبكِ لهذا الطلب. سنتواصل معكِ على واتساب.";
  }
  return null;
}
