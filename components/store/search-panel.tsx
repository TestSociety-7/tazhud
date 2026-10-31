"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { effectivePrice, visibleProducts } from "@/lib/commerce";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { searchProducts } from "@/lib/search";

export function SearchPanel({ onNavigate, active }: { onNavigate: () => void; active: boolean }) {
  const { data } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const results = useMemo(() => searchProducts(visibleProducts(data), data.categories, q).slice(0, 6), [data, q]);
  const popular = ["شيفون", "عباية", "بونيه", "ساتان", "كتان"];

  return (
    <div className="container-x max-w-3xl py-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onNavigate();
          router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative"
      >
        <label htmlFor="site-search" className="sr-only">
          ابحثي في المنتجات
        </label>
        <Search className="pointer-events-none absolute top-1/2 start-4 z-[1] size-5 -translate-y-1/2 text-forest" aria-hidden />
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحثي عن طرح، عبايات، ألوان…"
          className="field glass !min-h-14 !rounded-full !border-transparent !ps-12 !text-base"
          autoComplete="off"
        />
      </form>

      {q.trim() === "" ? (
        <div className="rise mt-5 flex flex-wrap gap-2">
          <span className="eyebrow w-full text-muted">الأكثر بحثًا</span>
          {popular.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => setQ(p)}>
              {p}
            </button>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted" role="status">
          لا توجد قطع تطابق «{q}». جرّبي لونًا أو نوع قماش.
        </p>
      ) : (
        <ul className="rise mt-4 space-y-1" aria-label="نتائج البحث">
          {results.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.slug}`} onClick={onNavigate} className="press flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-paper/80">
                <SmartImage src={p.images[0]} alt="" className="leaf h-18 w-15 shrink-0 shadow-[var(--shadow-soft)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{p.name}</p>
                  <p className="truncate text-xs text-muted">{p.tagline}</p>
                </div>
                <Price price={effectivePrice(p)} compareAt={p.price} size="sm" />
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/shop?q=${encodeURIComponent(q)}`} onClick={onNavigate} className="press mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-ivory">
              عرض كل النتائج <ArrowLeft className="size-4" />
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
