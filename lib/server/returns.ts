import { readOrdersForLookup } from "./storage";
import { samePhone } from "@/lib/returns";

/** Finds a saved order by its number, but only for the phone it was placed with. */
export async function findCustomerOrder(number: unknown, phone: unknown) {
  const n = typeof number === "string" ? number.trim().toUpperCase().replace(/\s+/g, "") : "";
  const p = typeof phone === "string" ? phone.trim() : "";
  if (n.length < 4 || n.length > 32 || !p) return null;
  const orders = await readOrdersForLookup();
  return orders.find((o) => o.number.toUpperCase() === n && o.status !== "cancelled" && samePhone(o.customer.phone, p)) ?? null;
}
