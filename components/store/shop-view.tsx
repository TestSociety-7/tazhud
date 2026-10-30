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
    <div className="space-y-8">
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">القسم</legend>
        <ul className="space-y-1.5">
          <li>
            <button
              type="button"
              onClick={() => setParam({ category: null })}
              className={`press flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-start text-sm transition-colors ${!category ? "bg-ink font-semibold text-ivory" : "hover:bg-sand/70"}`}
              aria-pressed={!category}
            >
              كل المنتجات{" "}
              <span className={`font-latin text-xs ${!category ? "text-gold-soft" : "text-muted"}`}>{base.length}</span>
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
                  className={`press flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-start text-sm transition-colors ${active ? "bg-ink font-semibold text-ivory" : "hover:bg-sand/70"}`}
                  aria-pressed={active}
                >
                  {c.name} <span className={`font-latin text-xs ${active ? "text-gold-soft" : "text-muted"}`}>{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-muted">تصفية</legend>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={onlySale}
              onChange={(e) => setParam({ sale: e.target.checked ? "1" : null })}
            />
            <span className="chip">عليها خصم</span>
          </label>
          <label className="cursor-pointer">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={inStock}
              onChange={(e) => setParam({ stock: e.target.checked ? "1" : null })}
            />
            <span className="chip">المتوفر فقط</span>
          </label>
        </div>
      </fieldset>
      {allColours.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-muted">اللون</legend>
          <div className="flex flex-wrap gap-1.5">
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
                <span className="swatch-bead" style={{ background: hex }} />
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );

  return (
    <div className="dock-space">
      <header className="page-wash">
        <div className="container-x rise pt-6 pb-5 sm:pt-10">
          <nav aria-label="مسار التنقل" className="text-xs text-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-ink">
                  الرئيسية
                </Link>
              </li>
              <li aria-hidden className="text-gold">•</li>
              <li>
                <Link href="/shop" className="hover:text-ink">
                  المتجر
                </Link>
              </li>
              {activeCategory && (
                <>
                  <li aria-hidden className="text-gold">•</li>
                  <li aria-current="page" className="text-ink">
                    {activeCategory.name}
                  </li>
                </>
              )}
            </ol>
          </nav>
          <div className="mt-3 flex items-end justify-between gap-4 lg:justify-start">
            <h1 className="season-title font-display text-[2.6rem] leading-[1.1] text-ink sm:text-6xl">
              {title}
            </h1>
            <p className="count-chip glass mb-1 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-forest" role="status" aria-live="polite">
              {piecesLabel(results.length)}
            </p>
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
              className="pointer-events-none absolute top-1/2 start-4 z-[1] size-4 -translate-y-1/2 text-forest"
              aria-hidden
            />
            <input
              id="shop-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحثي بالاسم أو القماش أو اللون"
              className="field glass !min-h-12 !rounded-full !border-transparent !ps-11"
            />
          </form>
        </div>
      </header>

      <div className="shop-bar glass !shadow-[0_12px_24px_-20px_rgb(35_42_92/0.5)] lg:hidden">
        <div className="container-x flex items-center gap-2 py-2.5">
          <div role="group" aria-label="الأقسام" className="no-scrollbar -ms-4 flex min-w-0 flex-1 gap-2 overflow-x-auto ps-4 pe-1 [mask-image:linear-gradient(to_left,transparent,#000_1.5rem)] rtl:[mask-image:linear-gradient(to_right,transparent,#000_1.5rem)]">
            {[{ id: "", slug: "", name: "الكل" }, ...categories].map((c) => {
              const active = c.slug === category;
              return (
                <button
                  key={c.id || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setParam({ category: c.slug || null })}
                  className="chip shrink-0 !min-h-10"
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="press relative grid size-11 shrink-0 place-items-center rounded-full bg-ink text-ivory shadow-[var(--shadow-soft)]"
            onClick={() => setFiltersOpen(true)}
            aria-label="تصفية"
          >
            <SlidersHorizontal className="size-4" />
            {activeFilters.length > 0 && (
              <span className="badge-pearl font-latin absolute -top-1 -end-1 grid size-5 place-items-center rounded-full text-[0.65rem] font-bold" aria-hidden>
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="container-x grid gap-10 pt-5 sm:pt-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="عوامل التصفية">
          <div className="glass-card sticky top-[calc(var(--header-h)+1.5rem)] p-5">
            {filterControls}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="hidden text-sm text-muted lg:block">
              {piecesLabel(results.length)}
            </p>
            <div className="flex items-center gap-2 max-lg:w-full max-lg:justify-end">
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
                className="field glass !min-h-10 !w-auto !rounded-full !border-transparent !py-1.5 !text-sm"
              >
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <ul
              className="mb-6 flex flex-wrap gap-2"
              aria-label="عوامل التصفية المفعّلة"
            >
              {activeFilters.map((f) => (
                <li key={f.key} className="line-in">
                  <button
                    type="button"
                    onClick={() => setParam({ [f.key]: null })}
                    className="press inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-ivory"
                    aria-label={`إزالة ${f.label}`}
                  >
                    {f.label} <X className="size-3.5 text-gold-soft" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setParam({ sale: null, stock: null, colour: null, q: null })
                  }
                  className="inline-flex min-h-10 items-center px-2 text-xs font-semibold text-forest underline-offset-4 hover:underline"
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
                <Link href="/shop" className="btn btn-primary press">
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
        side="start"
        title="تصفية"
        footer={
          <button
            type="button"
            className="btn btn-primary press min-h-12 w-full"
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
