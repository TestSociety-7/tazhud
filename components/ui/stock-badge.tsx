"use client";

import { useStore } from "@/components/providers/store-provider";
import { stockLabel, stockState } from "@/lib/commerce";

export function StockBadge({ stock, className = "" }: { stock: number; className?: string }) {
  const { data } = useStore();
  const state = stockState(stock, data.settings.lowStockThreshold);
  const tone = {
    in: "text-success",
    low: "text-[#9a6a1f]",
    out: "text-danger",
  }[state];
  const dot = { in: "bg-success", low: "bg-[#c9922f]", out: "bg-danger" }[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone} ${className}`}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {stockLabel(stock, data.settings.lowStockThreshold)}
    </span>
  );
}
