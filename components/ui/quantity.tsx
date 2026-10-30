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
    <div role="group" aria-label={label} className={`inline-flex ${h} items-center rounded-[0.95rem] border border-line bg-paper`}>
      <button
        type="button"
        className={`grid ${h} ${w} place-items-center rounded-[0.8rem] text-ink transition-colors hover:bg-sand disabled:opacity-35`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="إنقاص الكمية"
      >
        <Minus className="size-4" />
      </button>
      <output className="font-latin min-w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`grid ${h} ${w} place-items-center rounded-[0.8rem] text-ink transition-colors hover:bg-sand disabled:opacity-35`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="زيادة الكمية"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
