"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  bundleDetails,
  deliveryFor,
  effectivePrice,
  evaluateCoupon,
  roundMoney,
  type CouponResult,
} from "@/lib/commerce";
import type { Bundle, Product } from "@/lib/types";
import { useStore } from "./store-provider";

export interface CartLine {
  key: string;
  kind: "product" | "bundle";
  refId: string;
  color?: string;
  size?: string;
  quantity: number;
}

export interface ResolvedLine extends CartLine {
  name: string;
  image: string;
  href: string;
  unitPrice: number;
  compareAt?: number;
  lineTotal: number;
  maxQuantity: number;
  available: boolean;
  product?: Product;
  bundle?: Bundle;
}

interface CartState {
  lines: CartLine[];
  couponCode: string;
}

interface CartContextValue {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  coupon: CouponResult | null;
  discount: number;
  delivery: number;
  total: number;
  couponCode: string;
  hydrated: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addProduct: (product: Product, opts: { color?: string; size?: string; quantity: number }) => void;
  addBundle: (bundle: Bundle) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => CouponResult;
  removeCoupon: () => void;
}

const CART_KEY = "tazhud:cart:v1";
const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (l: Omit<CartLine, "key" | "quantity">) =>
  [l.kind, l.refId, l.color ?? "", l.size ?? ""].join("|");

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data } = useStore();
  const [state, setState] = useState<CartState>({ lines: [], couponCode: "" });
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* start with an empty cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(state));
    } catch {
      /* cart persistence is best-effort */
    }
  }, [state, hydrated]);

  const lines = useMemo<ResolvedLine[]>(() => {
    const out: ResolvedLine[] = [];
    for (const line of state.lines) {
      if (line.kind === "product") {
        const product = data.products.find((p) => p.id === line.refId);
        if (!product) continue;
        const unitPrice = effectivePrice(product);
        out.push({
          ...line,
          product,
          name: product.name,
          image: product.images[0] ?? "",
          href: `/product/${product.slug}`,
          unitPrice,
          compareAt: unitPrice < product.price ? product.price : undefined,
          lineTotal: roundMoney(unitPrice * line.quantity),
          maxQuantity: Math.max(0, product.stock),
          available: product.published && product.stock >= line.quantity,
        });
      } else {
        const bundle = data.bundles.find((b) => b.id === line.refId);
        if (!bundle) continue;
        const details = bundleDetails(bundle, data.products);
        const maxQuantity = details.items.length
          ? Math.min(...details.items.map((it) => Math.floor(it.product.stock / it.quantity)))
          : 0;
        out.push({
          ...line,
          bundle,
          name: bundle.name,
          image: bundle.image,
          href: `/shop?view=bundles#${bundle.slug}`,
          unitPrice: bundle.price,
          compareAt: details.value > bundle.price ? details.value : undefined,
          lineTotal: roundMoney(bundle.price * line.quantity),
          maxQuantity,
          available: details.available && maxQuantity >= line.quantity,
        });
      }
    }
    return out;
  }, [state.lines, data.products, data.bundles]);

  const subtotal = roundMoney(lines.reduce((s, l) => s + l.lineTotal, 0));
  const coupon = state.couponCode
    ? evaluateCoupon(state.couponCode, subtotal, data.coupons, data.settings)
    : null;
  const discount = coupon?.ok ? coupon.discount : 0;
  const delivery = lines.length ? deliveryFor(subtotal - discount, data.settings, Boolean(coupon?.ok && coupon.freeDelivery)) : 0;
  const total = roundMoney(Math.max(0, subtotal - discount) + delivery);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const addLine = useCallback((line: Omit<CartLine, "key">, max: number) => {
    setState((s) => {
      const key = lineKey(line);
      const existing = s.lines.find((l) => l.key === key);
      if (existing) {
        return {
          ...s,
          lines: s.lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.min(max, l.quantity + line.quantity) } : l,
          ),
        };
      }
      return { ...s, lines: [...s.lines, { ...line, key, quantity: Math.min(max, line.quantity) }] };
    });
  }, []);

  const addProduct = useCallback<CartContextValue["addProduct"]>(
    (product, { color, size, quantity }) => {
      addLine({ kind: "product", refId: product.id, color, size, quantity }, Math.max(1, product.stock));
    },
    [addLine],
  );

  const addBundle = useCallback<CartContextValue["addBundle"]>(
    (bundle) => addLine({ kind: "bundle", refId: bundle.id, quantity: 1 }, 99),
    [addLine],
  );

  const setQuantity = useCallback((key: string, quantity: number) => {
    setState((s) => ({
      ...s,
      lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.round(quantity)) } : l)),
    }));
  }, []);

  const remove = useCallback((key: string) => {
    setState((s) => ({ ...s, lines: s.lines.filter((l) => l.key !== key) }));
  }, []);

  const clear = useCallback(() => setState({ lines: [], couponCode: "" }), []);

  const applyCoupon = useCallback(
    (code: string) => {
      const result = evaluateCoupon(code, subtotal, data.coupons, data.settings);
      // Keep a code that only needs a higher subtotal, so it applies automatically later.
      if (result.ok || result.coupon) setState((s) => ({ ...s, couponCode: code.trim().toUpperCase() }));
      return result;
    },
    [subtotal, data.coupons, data.settings],
  );

  const removeCoupon = useCallback(() => setState((s) => ({ ...s, couponCode: "" })), []);

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    coupon,
    discount,
    delivery,
    total,
    couponCode: state.couponCode,
    hydrated,
    drawerOpen,
    setDrawerOpen,
    addProduct,
    addBundle,
    setQuantity,
    remove,
    clear,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
