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
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setParam({ category: null })}
              className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-start text-sm ${!category ? "bg-sand font-semibold text-ink" : "hover:bg-sand/60"}`}
              aria-pressed={!category}
            >
              كل المنتجات{" "}
              <span className="text-xs text-muted">{base.length}</span>
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
                  className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-start text-sm ${active ? "bg-sand font-semibold text-ink" : "hover:bg-sand/60"}`}
                  aria-pressed={active}
                >
                  {c.name} <span className="text-xs text-muted">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-muted">تصفية</legend>
        <label className="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-forest"
            checked={onlySale}
            onChange={(e) => setParam({ sale: e.target.checked ? "1" : null })}
          />
          عليها خصم
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-forest"
            checked={inStock}
            onChange={(e) => setParam({ stock: e.target.checked ? "1" : null })}
          />
          المتوفر فقط
        </label>
      </fieldset>
      {allColours.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-muted">اللون</legend>
          <div className="flex flex-wrap gap-2 px-1">
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
                className={`grid size-9 place-items-center rounded-full border transition-shadow ${colour === name ? "border-ink ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "border-line"}`}
              >
                <span
                  className="size-6 rounded-full ring-1 ring-black/10"
                  style={{ background: hex }}
                />
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );

  return (
    <div>
      <header className="border-b border-line bg-paper">
        <div className="container-x py-8 sm:py-10">
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
          <h1 className="season-title font-display mt-3 text-4xl text-ink sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
              {description}
            </p>
          )}

          <form
            role="search"
            className="relative mt-6 max-w-md"
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
              className="field !rounded-full !ps-11"
            />
          </form>
          <div role="group" aria-label="الأقسام" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 lg:hidden">
            {[{ id: "", slug: "", name: "الكل" }, ...categories].map((c) => {
              const active = c.slug === category;
              return (
                <button
                  key={c.id || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setParam({ category: c.slug || null })}
                  className={`press min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-all duration-300 ${
                    active ? "border-ink bg-ink text-ivory" : "border-line bg-ivory text-text"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="container-x grid gap-10 py-6 sm:py-10 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="عوامل التصفية">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)]">
            {filterControls}
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" role="status" aria-live="polite">
              {piecesLabel(results.length)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm border-line lg:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-4" /> تصفية
              </button>
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
                className="field !min-h-9 !w-auto !rounded-full !py-1.5 !text-sm"
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
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => setParam({ [f.key]: null })}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-xs font-medium hover:bg-line"
                    aria-label={`إزالة ${f.label}`}
                  >
                    {f.label} <X className="size-3.5" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setParam({ sale: null, stock: null, colour: null, q: null })
                  }
                  className="inline-flex min-h-9 items-center px-2 text-xs font-semibold text-forest underline-offset-4 hover:underline"
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
        side="start"
        title="تصفية"
        footer={
          <button
            type="button"
            className="btn btn-primary w-full"
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
