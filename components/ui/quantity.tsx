"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "الكمية",
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-10" : "h-12";
  const w = size === "sm" ? "w-10" : "w-12";
  const btn = `grid ${h} ${w} place-items-center rounded-full text-ink transition-[transform,background-color] duration-300 ease-[var(--ease-spring)] hover:bg-paper active:scale-75 disabled:opacity-30 disabled:active:scale-100`;
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex ${h} items-center rounded-full bg-sand/80 p-0 shadow-[inset_0_0_0_1px_var(--color-line),inset_0_2px_4px_rgb(12_16_36/0.05)]`}
    >
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="إنقاص الكمية">
        <Minus className="size-4" />
      </button>
      <output className="font-latin grid min-w-8 place-items-center overflow-hidden text-center text-sm font-bold tabular-nums text-ink" aria-live="polite">
        <span key={value} className="qty-pop block">
          {value}
        </span>
      </output>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="زيادة الكمية">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
