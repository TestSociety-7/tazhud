"use client";

import { useStore } from "@/components/providers/store-provider";
import { formatMoney } from "@/lib/commerce";

export function useMoney() {
  const { data } = useStore();
  return (n: number) => formatMoney(n, data.settings);
}

export function Price({
  price,
  compareAt,
  className = "",
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const money = useMoney();
  const onSale = compareAt != null && compareAt > price;
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" };
  return (
    <span className={`font-latin inline-flex items-baseline gap-2 tabular-nums ${sizes[size]} ${className}`}>
      <span className={`font-bold ${onSale ? "text-danger" : "text-ink"}`}>
        {onSale && <span className="sr-only">سعر التخفيض </span>}
        {money(price)}
      </span>
      {onSale && (
        <s className="text-[0.85em] text-muted">
          <span className="sr-only">السعر الأصلي </span>
          {money(compareAt)}
        </s>
      )}
    </span>
  );
}

/** The price written on a paper swing tag (Atelier). */
export function PriceTag({
  price,
  compareAt,
  className = "",
  size = "sm",
  dark = false,
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "lg";
  dark?: boolean;
}) {
  const money = useMoney();
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={`swing-tag tabular-nums ${size === "lg" ? "swing-tag-lg" : ""} ${dark ? "swing-tag-dark" : ""} ${className}`}>
      <span className={onSale && !dark ? "text-danger" : undefined}>
        {onSale && <span className="sr-only">سعر التخفيض </span>}
        {money(price)}
      </span>
      {onSale && (
        <s>
          <span className="sr-only">السعر الأصلي </span>
          {money(compareAt)}
        </s>
      )}
    </span>
  );
}
