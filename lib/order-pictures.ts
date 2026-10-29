import { SITE_URL } from "./site";
import type { OrderLine, Product } from "./types";

const MAX_ITEMS = 8;
export const ORDER_NUMBER_RE = /^[A-Z0-9-]{4,32}$/;

/**
 * A link that shows the ordered pieces. WhatsApp turns it into a picture preview,
 * because a wa.me message can carry text only. Everything needed is in the address
 * (product slugs and quantities), so it works before the order is even saved.
 */
export function orderPicturesUrl(number: string, lines: OrderLine[], products: Product[]) {
  const items = lines
    .flatMap((l) => {
      const p = l.kind === "product" ? products.find((x) => x.id === l.refId) : undefined;
      return p ? [`${p.slug}~${l.quantity}`] : [];
    })
    .slice(0, MAX_ITEMS);
  if (!items.length) return undefined;
  return `${SITE_URL}/o/${encodeURIComponent(number)}/${items.join(".")}`;
}

/** Reads the items part of that link back; anything malformed is skipped. */
export function parseOrderItems(raw: string) {
  return decodeURIComponent(raw)
    .split(".")
    .slice(0, MAX_ITEMS)
    .flatMap((part) => {
      const m = /^([a-z0-9-]{1,80})~(\d{1,3})$/.exec(part);
      return m ? [{ slug: m[1], quantity: Math.max(1, Number(m[2])) }] : [];
    });
}
