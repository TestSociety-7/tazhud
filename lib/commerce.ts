import type { Bundle, Coupon, Product, StoreData, StoreSettings } from "./types";

export function formatMoney(amount: number, settings: Pick<StoreSettings, "currency" | "locale">) {
  try {
    return new Intl.NumberFormat(settings.locale || "en-US", {
      style: "currency",
      currency: settings.currency || "USD",
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${settings.currency} ${amount.toFixed(2)}`;
  }
}

export const roundMoney = (n: number) => Math.round(n * 100) / 100;

/** The price a customer actually pays for one unit. */
export function effectivePrice(p: Pick<Product, "price" | "salePrice">) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function isOnSale(p: Pick<Product, "price" | "salePrice">) {
  return effectivePrice(p) < p.price;
}

export function discountPercent(p: Pick<Product, "price" | "salePrice">) {
  if (!isOnSale(p)) return 0;
  return Math.round((1 - effectivePrice(p) / p.price) * 100);
}

export type StockState = "in" | "low" | "out";

export function stockState(stock: number, lowThreshold: number): StockState {
  if (stock <= 0) return "out";
  if (stock <= lowThreshold) return "low";
  return "in";
}

export function stockLabel(stock: number, lowThreshold: number) {
  const s = stockState(stock, lowThreshold);
  if (s === "out") return "Sold out";
  if (s === "low") return `Only ${stock} left`;
  return "In stock";
}

export function visibleProducts(data: StoreData) {
  return data.products.filter((p) => p.published);
}

export function bundleDetails(bundle: Bundle, products: Product[]) {
  const items = bundle.items
    .map((it) => ({ ...it, product: products.find((p) => p.id === it.productId) }))
    .filter((it): it is typeof it & { product: Product } => Boolean(it.product));
  const value = roundMoney(items.reduce((s, it) => s + effectivePrice(it.product) * it.quantity, 0));
  const available =
    bundle.active &&
    items.length === bundle.items.length &&
    items.every((it) => it.product.published && it.product.stock >= it.quantity);
  return { items, value, savings: Math.max(0, roundMoney(value - bundle.price)), available };
}

export interface CouponResult {
  ok: boolean;
  coupon?: Coupon;
  discount: number;
  freeDelivery: boolean;
  message: string;
}

export function evaluateCoupon(
  code: string,
  subtotal: number,
  coupons: Coupon[],
  settings: Pick<StoreSettings, "currency" | "locale">,
  today = new Date(),
): CouponResult {
  const normalized = code.trim().toUpperCase();
  const none = { ok: false, discount: 0, freeDelivery: false };
  if (!normalized) return { ...none, message: "Enter a code." };
  const coupon = coupons.find((c) => c.code.toUpperCase() === normalized);
  if (!coupon || !coupon.active) return { ...none, message: "That code isn't valid." };
  if (coupon.expiresOn) {
    const end = new Date(`${coupon.expiresOn}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && end < today) return { ...none, message: "That code has expired." };
  }
  if (subtotal < coupon.minSubtotal) {
    return {
      ...none,
      coupon,
      message: `Add ${formatMoney(roundMoney(coupon.minSubtotal - subtotal), settings)} more to use ${coupon.code}.`,
    };
  }
  if (coupon.type === "free_delivery") {
    return { ok: true, coupon, discount: 0, freeDelivery: true, message: "Free delivery applied." };
  }
  const raw = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  const discount = roundMoney(Math.min(subtotal, Math.max(0, raw)));
  return { ok: true, coupon, discount, freeDelivery: false, message: `${coupon.code} applied.` };
}

export function deliveryFor(
  subtotalAfterDiscount: number,
  settings: Pick<StoreSettings, "deliveryFee" | "freeDeliveryThreshold">,
  freeDelivery: boolean,
) {
  if (subtotalAfterDiscount <= 0 || freeDelivery) return 0;
  if (settings.freeDeliveryThreshold > 0 && subtotalAfterDiscount >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryFee;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string, taken: string[]) {
  const root = slugify(base) || "item";
  let slug = root;
  let n = 2;
  while (taken.includes(slug)) slug = `${root}-${n++}`;
  return slug;
}

export function newId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}
