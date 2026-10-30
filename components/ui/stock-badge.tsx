"use client";

import { useStore } from "@/components/providers/store-provider";
import { stockLabel, stockState } from "@/lib/commerce";

export function StockBadge({ stock, className = "" }: { stock: number; className?: string }) {
  const { data } = useStore();
  const state = stockState(stock, data.settings.lowStockThreshold);
  const tone = {
    in: "text-success",
    low: "text-gold-bright",
    out: "text-danger",
  }[state];
  const dot = { in: "bg-success", low: "bg-gold animate-pulse", out: "bg-danger" }[state];
  return (
    <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 text-xs font-bold ${tone} ${className}`}>
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {stockLabel(stock, data.settings.lowStockThreshold)}
    </span>
  );
}
