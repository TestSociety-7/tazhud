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
  const sizes = { sm: "text-[0.95rem]", md: "text-base", lg: "text-[1.75rem] leading-none" };
  return (
    <span className={`font-latin inline-flex items-baseline gap-2 tabular-nums ${sizes[size]} ${className}`}>
      <span className={`font-bold ${onSale ? "text-danger" : "text-ink"}`}>
        {onSale && <span className="sr-only">سعر التخفيض </span>}
        {money(price)}
      </span>
      {onSale && (
        <s className="text-[0.78em] font-medium text-muted decoration-gold/70">
          <span className="sr-only">السعر الأصلي </span>
          {money(compareAt)}
        </s>
      )}
    </span>
  );
}
