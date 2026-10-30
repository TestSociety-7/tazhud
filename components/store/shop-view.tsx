"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { effectivePrice, isOnSale, visibleProducts } from "@/lib/commerce";
import { searchProducts } from "@/lib/search";
import { piecesLabel } from "@/lib/arabic";
import type { Product } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { ProductGrid, ProductGridSkeleton } from "./product-card";

const SORTS = {
  featured: "المقترحة",
  newest: "الأحدث",
  "price-asc": "السعر: من الأقل للأعلى",
  "price-desc": "السعر: من الأعلى للأقل",
} as const;
type SortKey = keyof typeof SORTS;

function sortProducts(list: Product[], sort: SortKey) {
  const out = [...list];
  switch (sort) {
    case "newest":
      return out.sort(
        (a, b) =>
          Number(b.newArrival) - Number(a.newArrival) ||
          b.createdAt.localeCompare(a.createdAt),
      );
    case "price-asc":
      return out.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "price-desc":
      return out.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    default:
      return out.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

export function ShopView() {
  const { data, ready } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get("category") ?? "";
  const q = params.get("q") ?? "";
  const sort =
    (params.get("sort") as SortKey) in SORTS
      ? (params.get("sort") as SortKey)
      : "featured";
  const onlySale = params.get("sale") === "1";
  const inStock = params.get("stock") === "1";
  const colour = params.get("colour") ?? "";

  const [query, setQuery] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setQuery(q);
  }

  function setParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  const categories = useMemo(
    () => [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [data.categories],
  );
  const activeCategory = categories.find((c) => c.slug === category);

  const base = useMemo(() => visibleProducts(data), [data]);
  const allColours = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of base)
      for (const c of p.colors) if (!map.has(c.name)) map.set(c.name, c.hex);
    return [...map.entries()].slice(0, 18);
  }, [base]);

  const results = useMemo(() => {
    let list = base;
    if (activeCategory)
      list = list.filter((p) => p.categoryId === activeCategory.id);
    if (onlySale) list = list.filter(isOnSale);
    if (inStock) list = list.filter((p) => p.stock > 0);
    if (colour)
      list = list.filter((p) => p.colors.some((c) => c.name === colour));
    if (q) list = searchProducts(list, data.categories, q);
    return q && sort === "featured" ? list : sortProducts(list, sort);
  }, [
    base,
    activeCategory,
    onlySale,
    inStock,
    colour,
    q,
    sort,
    data.categories,
  ]);

  const activeFilters = [
    onlySale && { key: "sale", label: "عليها خصم" },
    inStock && { key: "stock", label: "متوفر" },
    colour && { key: "colour", label: colour },
    q && { key: "q", label: `«${q}»` },
  ].filter(Boolean) as { key: string; label: string }[];

  const title = activeCategory?.name ?? (q ? "نتائج البحث" : "كل المنتجات");
  const description = activeCategory?.description ?? "";

  const filterControls = (
    <div className="space-y-7">
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">القسم</legend>
        <ul className="flex flex-wrap gap-2 lg:block lg:space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setParam({ category: null })}
              className="opt-chip lg:w-full lg:justify-between"
              aria-pressed={!category}
            >
              كل المنتجات{" "}
              <span className="text-xs opacity-60">{base.length}</span>
            </button>
          </li>
          {categories.map((c) => {
            const n = base.filter((p) => p.categoryId === c.id).length;
            const active = c.slug === category;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setParam({ category: c.slug })}
                  className="opt-chip lg:w-full lg:justify-between"
                  aria-pressed={active}
                >
                  {c.name} <span className="text-xs opacity-60">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-muted">تصفية</legend>
        <div className="panel divide-y divide-white/[0.06] px-4">
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-ink">
          عليها خصم
          <input
            type="checkbox"
            className="switch"
            checked={onlySale}
            onChange={(e) => setParam({ sale: e.target.checked ? "1" : null })}
          />
        </label>
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-ink">
          المتوفر فقط
          <input
            type="checkbox"
            className="switch"
            checked={inStock}
            onChange={(e) => setParam({ stock: e.target.checked ? "1" : null })}
          />
        </label>
        </div>
      </fieldset>
      {allColours.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-muted">اللون</legend>
          <div className="flex flex-wrap gap-2.5 px-1">
            {allColours.map(([name, hex]) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  setParam({ colour: colour === name ? null : name })
                }
                aria-pressed={colour === name}
                aria-label={name}
                title={name}
                className="swatch"
              >
                <span style={{ background: hex }} />
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );

  const sortSelect = (
    <>
      <label htmlFor="sort" className="sr-only">
        ترتيب حسب
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(e) =>
          setParam({
            sort: e.target.value === "featured" ? null : e.target.value,
          })
        }
        className="field !min-h-10 !w-auto !rounded-full !border-white/[0.08] !bg-white/[0.07] !py-1.5 !text-sm font-semibold"
      >
        {Object.entries(SORTS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <div className="tabbar-pad">
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 start-1/2 size-80 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl rtl:translate-x-1/2" aria-hidden />
        <div className="container-x relative pt-5 pb-4 sm:pt-10 sm:pb-6">
          <nav aria-label="مسار التنقل" className="text-xs text-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-ink">
                  الرئيسية
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/shop" className="hover:text-ink">
                  المتجر
                </Link>
              </li>
              {activeCategory && (
                <>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="text-ink">
                    {activeCategory.name}
                  </li>
                </>
              )}
            </ol>
          </nav>
          <div className="mt-2 flex items-end justify-between gap-3">
            <h1 key={title} className="season-title reel-title animate-fade-up text-[2.6rem] sm:text-6xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
              {description}
            </p>
          )}

          <form
            role="search"
            className="relative mt-5 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ q: query.trim() || null });
            }}
          >
            <label htmlFor="shop-search" className="sr-only">
              ابحثي في المجموعة
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 start-4 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="shop-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحثي بالاسم أو القماش أو اللون"
              className="field !min-h-12 !rounded-full !border-white/[0.08] !bg-white/[0.07] !ps-11"
            />
          </form>
        </div>
      </header>

      {/* Phones: category chips and the filter button stay under the header while scrolling. */}
      <div className="sticky top-[var(--store-bar)] z-20 border-b border-white/[0.06] bg-ivory/80 backdrop-blur-xl lg:hidden">
        <div role="group" aria-label="الأقسام" className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2.5">
          <button
            type="button"
            className="pop relative grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
            onClick={() => setFiltersOpen(true)}
            aria-label="تصفية"
          >
            <SlidersHorizontal className="size-[1.1rem]" />
            {activeFilters.length > 0 && (
              <span className="absolute -top-0.5 -end-0.5 grid size-5 place-items-center rounded-full bg-gold font-latin text-[0.65rem] font-bold text-white" aria-hidden>
                {activeFilters.length}
              </span>
            )}
          </button>
          <span className="h-6 w-px shrink-0 bg-white/10" aria-hidden />
          {[{ id: "", slug: "", name: "الكل" }, ...categories].map((c) => {
            const active = c.slug === category;
            return (
              <button
                key={c.id || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setParam({ category: c.slug || null })}
                className="opt-chip shrink-0"
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="container-x grid gap-10 pt-4 sm:pt-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="عوامل التصفية">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)]">
            {filterControls}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted" role="status" aria-live="polite">
              <span key={results.length} className="bump">{piecesLabel(results.length)}</span>
            </p>
            <div className="flex items-center gap-2">{sortSelect}</div>
          </div>

          {activeFilters.length > 0 && (
            <ul
              className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
              aria-label="عوامل التصفية المفعّلة"
            >
              {activeFilters.map((f) => (
                <li key={f.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setParam({ [f.key]: null })}
                    className="pop inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold/15 px-3 text-xs font-bold text-gold-soft ring-1 ring-gold/30"
                    aria-label={`إزالة ${f.label}`}
                  >
                    {f.label} <X className="size-3.5" />
                  </button>
                </li>
              ))}
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setParam({ sale: null, stock: null, colour: null, q: null })
                  }
                  className="inline-flex min-h-9 items-center px-2 text-xs font-bold text-ink underline-offset-4 hover:underline"
                >
                  مسح الكل
                </button>
              </li>
            </ul>
          )}

          {!ready ? (
            <ProductGridSkeleton />
          ) : results.length === 0 ? (
            <EmptyState
              title="لا توجد نتائج مطابقة"
              body="جرّبي إزالة أحد عوامل التصفية أو البحث عن لون أو قماش آخر."
              action={
                <Link href="/shop" className="btn btn-primary">
                  عرض كل المنتجات
                </Link>
              }
            />
          ) : (
            <ProductGrid products={results} priorityCount={4} />
          )}
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="bottom"
        title="تصفية"
        footer={
          <button
            type="button"
            className="btn btn-neon pop min-h-13 w-full text-base"
            onClick={() => setFiltersOpen(false)}
          >
            عرض {piecesLabel(results.length)}
          </button>
        }
      >
        <div className="p-5">{filterControls}</div>
      </Sheet>
    </div>
  );
}
