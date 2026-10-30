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
  const h = size === "sm" ? "h-9" : "h-11";
  const w = size === "sm" ? "w-9" : "w-11";
  return (
    <div role="group" aria-label={label} className={`inline-flex ${h} items-center rounded-full bg-sand shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]`}>
      <button
        type="button"
        className={`grid ${h} ${w} place-items-center rounded-full text-ink transition-[background-color,transform] duration-300 ease-[var(--ease-spring)] hover:bg-white/10 active:scale-75 disabled:opacity-30`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="إنقاص الكمية"
      >
        <Minus className="size-4" />
      </button>
      <output className="min-w-8 text-center font-display text-sm font-bold text-ink tabular-nums" aria-live="polite">
        <span key={value} className="bump">{value}</span>
      </output>
      <button
        type="button"
        className={`grid ${h} ${w} place-items-center rounded-full text-ink transition-[background-color,transform] duration-300 ease-[var(--ease-spring)] hover:bg-white/10 active:scale-75 disabled:opacity-30`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="زيادة الكمية"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
