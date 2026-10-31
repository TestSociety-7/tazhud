"use client";

import { useStore } from "@/components/providers/store-provider";
import { stockLabel, stockState } from "@/lib/commerce";

export function StockBadge({ stock, className = "" }: { stock: number; className?: string }) {
  const { data } = useStore();
  const state = stockState(stock, data.settings.lowStockThreshold);
  const tone = {
    in: "text-success bg-success/8 ring-success/20",
    low: "text-gold-deep bg-gold/12 ring-gold/30",
    out: "text-danger bg-danger/8 ring-danger/20",
  }[state];
  const dot = { in: "bg-success", low: "bg-gold", out: "bg-danger" }[state];
  return (
    <span className={`inline-flex min-h-7 items-center gap-2 rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${tone} ${className}`}>
      <span className={`size-1.5 rounded-full ${dot} ${state === "out" ? "" : "live-dot"}`} aria-hidden />
      {stockLabel(stock, data.settings.lowStockThreshold)}
    </span>
  );
}
