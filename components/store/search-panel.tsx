"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
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
  const popular = ["Chiffon", "Abaya", "Underscarf", "Satin", "Linen"];

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
          Search products
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search hijabs, abayas, colours…"
          className="field !min-h-14 !rounded-full !pl-12 !text-base"
          autoComplete="off"
        />
      </form>

      {q.trim() === "" ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="eyebrow w-full text-muted">Popular</span>
          {popular.map((p) => (
            <button key={p} type="button" className="btn btn-sm btn-outline border-line" onClick={() => setQ(p)}>
              {p}
            </button>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted" role="status">
          No pieces match “{q}”. Try a colour or fabric.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line" aria-label="Search results">
          {results.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.slug}`} onClick={onNavigate} className="flex items-center gap-4 rounded-xl py-3 transition-colors hover:bg-sand/60">
                <SmartImage src={p.images[0]} alt="" className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{p.name}</p>
                  <p className="truncate text-xs text-muted">{p.tagline}</p>
                </div>
                <Price price={effectivePrice(p)} compareAt={p.price} size="sm" />
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/shop?q=${encodeURIComponent(q)}`} onClick={onNavigate} className="flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-forest">
              See all results <ArrowRight className="size-4" />
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
