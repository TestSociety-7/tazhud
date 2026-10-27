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
    <span className={`inline-flex items-baseline gap-2 ${sizes[size]} ${className}`}>
      <span className={`font-semibold ${onSale ? "text-danger" : "text-ink"}`}>
        {onSale && <span className="sr-only">Sale price </span>}
        {money(price)}
      </span>
      {onSale && (
        <s className="text-[0.85em] text-muted">
          <span className="sr-only">Original price </span>
          {money(compareAt)}
        </s>
      )}
    </span>
  );
}
