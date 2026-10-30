"use client";

import { useState } from "react";
import { Check, Search, Sparkles } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { effectivePrice, formatMoney, visibleProducts } from "@/lib/commerce";
import { Modal } from "./ui";

/** A tap-to-choose product, shown as a photo tile. "" means the automatic choice. */
export function ProductPicker({
  label,
  value,
  onChange,
  autoLabel,
  autoNote,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  autoLabel: string;
  autoNote: string;
}) {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const products = visibleProducts(data).filter((p) => p.images[0]);
  const current = products.find((p) => p.id === value);
  const q = query.trim();
  const list = q ? products.filter((p) => p.name.includes(q) || p.sku?.toLowerCase().includes(q.toLowerCase())) : products;
  const money = (n: number) => formatMoney(n, data.settings);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div>
      <p className="label">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-paper p-2.5 text-start transition-colors hover:border-gold"
      >
        {current ? (
          <SmartImage src={current.images[0]} alt="" className="size-16 shrink-0 rounded-xl" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-sand text-gold">
            <Sparkles className="size-6" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{current ? current.name : autoLabel}</span>
          <span className="block truncate text-xs text-muted">{current ? money(effectivePrice(current)) : autoNote}</span>
        </span>
        <span className="shrink-0 rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-gold-bright">تغيير</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={label} size="lg">
        <label className="relative mb-4 block">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="field ps-9" type="search" placeholder="ابحث باسم المنتج" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="ابحث باسم المنتج" />
        </label>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {!q && (
            <li>
              <button
                type="button"
                onClick={() => pick("")}
                aria-pressed={!value}
                className={`press flex h-full w-full flex-col overflow-hidden rounded-2xl border text-start ${!value ? "border-gold ring-2 ring-gold/40" : "border-line"}`}
              >
                <span className="grid aspect-square w-full place-items-center bg-sand text-gold">
                  <Sparkles className="size-8" />
                </span>
                <span className="p-2.5">
                  <span className="block text-sm font-semibold text-ink">{autoLabel}</span>
                  <span className="block text-[0.7rem] leading-snug text-muted">{autoNote}</span>
                </span>
              </button>
            </li>
          )}
          {list.map((p) => {
            const on = p.id === value;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p.id)}
                  aria-pressed={on}
                  className={`press relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-start ${on ? "border-gold ring-2 ring-gold/40" : "border-line"}`}
                >
                  <SmartImage src={p.images[0]} alt="" className="aspect-square w-full" />
                  {on && (
                    <span className="absolute top-2 end-2 grid size-7 place-items-center rounded-full bg-gold text-white shadow">
                      <Check className="size-4" />
                    </span>
                  )}
                  <span className="p-2.5">
                    <span className="line-clamp-1 text-sm font-semibold text-ink">{p.name}</span>
                    <span className="block text-xs text-muted">{money(effectivePrice(p))}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {list.length === 0 && <p className="py-8 text-center text-sm text-muted">لا يوجد منتج بهذا الاسم.</p>}
      </Modal>
    </div>
  );
}
