"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { effectivePrice, isOnSale, visibleProducts } from "@/lib/commerce";
import { searchProducts } from "@/lib/search";
import type { Product } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Star8 } from "@/components/ui/mandala";
import { ProductGrid, ProductGridSkeleton } from "./product-card";
import { BundleCard } from "./bundle-card";

const SORTS = {
  featured: "Featured",
  newest: "Newest",
  bestselling: "Bestselling",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
type SortKey = keyof typeof SORTS;

function sortProducts(list: Product[], sort: SortKey) {
  const out = [...list];
  switch (sort) {
    case "newest":
      return out.sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || b.createdAt.localeCompare(a.createdAt));
    case "bestselling":
      return out.sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
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
  const sort = (params.get("sort") as SortKey) in SORTS ? (params.get("sort") as SortKey) : "featured";
  const view = params.get("view") === "bundles" ? "bundles" : "products";
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

  const categories = useMemo(() => [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder), [data.categories]);
  const activeCategory = categories.find((c) => c.slug === category);

  const base = useMemo(() => visibleProducts(data), [data]);
  const allColours = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of base) for (const c of p.colors) if (!map.has(c.name)) map.set(c.name, c.hex);
    return [...map.entries()].slice(0, 18);
  }, [base]);

  const results = useMemo(() => {
    let list = base;
    if (activeCategory) list = list.filter((p) => p.categoryId === activeCategory.id);
    if (onlySale) list = list.filter(isOnSale);
    if (inStock) list = list.filter((p) => p.stock > 0);
    if (colour) list = list.filter((p) => p.colors.some((c) => c.name === colour));
    if (q) list = searchProducts(list, data.categories, q);
    return q && sort === "featured" ? list : sortProducts(list, sort);
  }, [base, activeCategory, onlySale, inStock, colour, q, sort, data.categories]);

  const bundles = data.bundles.filter((b) => b.active);
  const activeFilters = [
    onlySale && { key: "sale", label: "On sale" },
    inStock && { key: "stock", label: "In stock" },
    colour && { key: "colour", label: colour },
    q && { key: "q", label: `“${q}”` },
  ].filter(Boolean) as { key: string; label: string }[];

  const title = view === "bundles" ? "Bundles" : activeCategory?.name ?? (q ? "Search results" : "The collection");
  const description =
    view === "bundles"
      ? "Thoughtfully paired sets at a better price."
      : activeCategory?.description ?? "Hijabs, abayas and modest pieces in soft, considered fabrics.";

  const filterControls = (
    <div className="space-y-8">
      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Category</legend>
        <ul className="space-y-1">
          <li>
            <button type="button" onClick={() => setParam({ category: null, view: null })} className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${!category && view !== "bundles" ? "bg-sand font-semibold text-ink" : "hover:bg-sand/60"}`} aria-pressed={!category && view !== "bundles"}>
              All pieces <span className="text-xs text-muted">{base.length}</span>
            </button>
          </li>
          {categories.map((c) => {
            const n = base.filter((p) => p.categoryId === c.id).length;
            const active = c.slug === category && view !== "bundles";
            return (
              <li key={c.id}>
                <button type="button" onClick={() => setParam({ category: c.slug, view: null })} className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${active ? "bg-sand font-semibold text-ink" : "hover:bg-sand/60"}`} aria-pressed={active}>
                  {c.name} <span className="text-xs text-muted">{n}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setParam({ view: "bundles", category: null })} className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${view === "bundles" ? "bg-sand font-semibold text-ink" : "hover:bg-sand/60"}`} aria-pressed={view === "bundles"}>
              Bundles <span className="text-xs text-muted">{bundles.length}</span>
            </button>
          </li>
        </ul>
      </fieldset>

      {view !== "bundles" && (
        <>
          <fieldset>
            <legend className="eyebrow mb-3 text-muted">Refine</legend>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm">
              <input type="checkbox" className="size-4 accent-forest" checked={onlySale} onChange={(e) => setParam({ sale: e.target.checked ? "1" : null })} />
              On sale
            </label>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm">
              <input type="checkbox" className="size-4 accent-forest" checked={inStock} onChange={(e) => setParam({ stock: e.target.checked ? "1" : null })} />
              In stock only
            </label>
          </fieldset>
          {allColours.length > 0 && (
            <fieldset>
              <legend className="eyebrow mb-3 text-muted">Colour</legend>
              <div className="flex flex-wrap gap-2 px-1">
                {allColours.map(([name, hex]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setParam({ colour: colour === name ? null : name })}
                    aria-pressed={colour === name}
                    aria-label={name}
                    title={name}
                    className={`grid size-9 place-items-center rounded-full border transition-shadow ${colour === name ? "border-ink ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "border-line"}`}
                  >
                    <span className="size-6 rounded-full ring-1 ring-black/10" style={{ background: hex }} />
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <header className="border-b border-line bg-paper">
        <div className="container-x py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:text-ink">Home</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
              {activeCategory && (<><li aria-hidden>/</li><li aria-current="page" className="text-ink">{activeCategory.name}</li></>)}
            </ol>
          </nav>
          <h1 className="font-display mt-4 flex items-center gap-3 text-5xl text-ink sm:text-6xl">
            {title} <Star8 className="size-4 text-gold" />
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">{description}</p>

          {view !== "bundles" && (
            <form
              role="search"
              className="relative mt-6 max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                setParam({ q: query.trim() || null });
              }}
            >
              <label htmlFor="shop-search" className="sr-only">Search the collection</label>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input id="shop-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, fabric or colour" className="field !rounded-full !pl-11" />
            </form>
          )}
        </div>
      </header>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)]">{filterControls}</div>
        </aside>

        <div>
          {view === "bundles" ? (
            bundles.length === 0 ? (
              <EmptyState title="No bundles right now" body="New curated sets are on the way." action={<Link href="/shop" className="btn btn-primary">Shop all pieces</Link>} />
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {bundles.map((b) => (
                  <li key={b.id}><BundleCard bundle={b} /></li>
                ))}
              </ul>
            )
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted" role="status" aria-live="polite">
                  {results.length} {results.length === 1 ? "piece" : "pieces"}
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-outline btn-sm border-line lg:hidden" onClick={() => setFiltersOpen(true)}>
                    <SlidersHorizontal className="size-4" /> Filter
                  </button>
                  <label htmlFor="sort" className="sr-only">Sort by</label>
                  <select id="sort" value={sort} onChange={(e) => setParam({ sort: e.target.value === "featured" ? null : e.target.value })} className="field !min-h-9 !w-auto !rounded-full !py-1.5 !text-sm">
                    {Object.entries(SORTS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFilters.length > 0 && (
                <ul className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">
                  {activeFilters.map((f) => (
                    <li key={f.key}>
                      <button type="button" onClick={() => setParam({ [f.key]: null })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-xs font-medium hover:bg-line" aria-label={`Remove filter ${f.label}`}>
                        {f.label} <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={() => setParam({ sale: null, stock: null, colour: null, q: null })} className="inline-flex min-h-9 items-center px-2 text-xs font-semibold text-forest underline-offset-4 hover:underline">
                      Clear all
                    </button>
                  </li>
                </ul>
              )}

              {!ready ? (
                <ProductGridSkeleton />
              ) : results.length === 0 ? (
                <EmptyState
                  title="Nothing matches yet"
                  body="Try removing a filter or searching for a different colour or fabric."
                  action={<Link href="/shop" className="btn btn-primary">See all pieces</Link>}
                />
              ) : (
                <ProductGrid products={results} priorityCount={4} />
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" title="Filter" footer={
        <button type="button" className="btn btn-primary w-full" onClick={() => setFiltersOpen(false)}>
          Show {results.length} {results.length === 1 ? "piece" : "pieces"}
        </button>
      }>
        <div className="p-5">{filterControls}</div>
      </Sheet>
    </div>
  );
}
