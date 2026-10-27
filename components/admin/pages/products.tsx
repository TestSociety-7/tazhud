"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { effectivePrice, formatMoney, isOnSale, newId, stockState, uniqueSlug } from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, ConfirmDialog, PageHeader } from "../ui";
import { useSave } from "../use-save";

export function useProductActions() {
  const { data } = useStore();
  const save = useSave();

  const duplicate = (p: Product) => {
    const now = new Date().toISOString();
    const copy: Product = {
      ...structuredClone(p),
      id: newId("prd"),
      name: `${p.name} (copy)`,
      slug: uniqueSlug(`${p.slug}-copy`, data.products.map((x) => x.slug)),
      sku: `${p.sku}-C`,
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    return save((d) => ({ ...d, products: [copy, ...d.products] }), `Duplicated as “${copy.name}” (hidden until published)`).then((ok) => (ok ? copy : null));
  };

  const togglePublish = (p: Product) =>
    save(
      (d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, published: !x.published, updatedAt: new Date().toISOString() } : x)) }),
      p.published ? `“${p.name}” hidden from the store` : `“${p.name}” is now live`,
    );

  const remove = (p: Product) => {
    const snapshot = data.products;
    const bundles = data.bundles;
    return save(
      (d) => ({
        ...d,
        products: d.products.filter((x) => x.id !== p.id),
        bundles: d.bundles.map((b) => ({ ...b, items: b.items.filter((it) => it.productId !== p.id) })),
      }),
      `“${p.name}” deleted`,
      { undo: () => void save((d) => ({ ...d, products: snapshot, bundles }), "Restored") },
    );
  };

  return { duplicate, togglePublish, remove };
}

function RowMenu({ product, onDelete }: { product: Product; onDelete: () => void }) {
  const { duplicate, togglePublish } = useProductActions();
  return (
    <details className="relative">
      <summary className="icon-btn list-none [&::-webkit-details-marker]:hidden" aria-label={`Actions for ${product.name}`}>
        <MoreHorizontal className="size-5" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-[var(--shadow-lift)]">
        {[
          { label: "Edit", icon: Pencil, href: `/admin/products/${product.id}` },
          { label: product.published ? "Unpublish" : "Publish", icon: product.published ? EyeOff : Eye, onClick: () => togglePublish(product) },
          { label: "Duplicate", icon: Copy, onClick: () => duplicate(product) },
          { label: "View in store", icon: Eye, href: `/product/${product.slug}`, external: true },
        ].map((a) =>
          a.href ? (
            <Link key={a.label} href={a.href} target={a.external ? "_blank" : undefined} className="flex min-h-10 items-center gap-2.5 px-3 text-sm hover:bg-sand">
              <a.icon className="size-4 text-muted" /> {a.label}
            </Link>
          ) : (
            <button
              key={a.label}
              type="button"
              className="flex min-h-10 w-full items-center gap-2.5 px-3 text-sm hover:bg-sand"
              onClick={(e) => {
                (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                a.onClick?.();
              }}
            >
              <a.icon className="size-4 text-muted" /> {a.label}
            </button>
          ),
        )}
        <button
          type="button"
          className="flex min-h-10 w-full items-center gap-2.5 border-t border-line px-3 text-sm text-danger hover:bg-danger/5"
          onClick={(e) => {
            (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
            onDelete();
          }}
        >
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
    </details>
  );
}

export function ProductsPage() {
  const { data } = useStore();
  const params = useSearchParams();
  const { togglePublish, remove } = useProductActions();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState<"all" | "live" | "hidden" | "low">(params.get("stock") === "low" ? "low" : "all");
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const money = (n: number) => formatMoney(n, data.settings);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.products.filter((p) => {
      if (cat && p.categoryId !== cat) return false;
      if (status === "live" && !p.published) return false;
      if (status === "hidden" && p.published) return false;
      if (status === "low" && stockState(p.stock, data.settings.lowStockThreshold) === "in") return false;
      if (term && ![p.name, p.sku, p.tagline].join(" ").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data.products, data.settings.lowStockThreshold, q, cat, status]);

  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "Uncategorised";

  return (
    <>
      <PageHeader
        title="Products"
        description={`${data.products.length} products, ${data.products.filter((p) => p.published).length} live on the store.`}
        actions={<Link href="/admin/products/new" className="btn btn-primary"><Plus className="size-4" /> Add product</Link>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="field !pl-9" placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
        <select className="field sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="field sm:w-44" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="hidden">Hidden</option>
          <option value="low">Low or sold out</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Package className="size-6" />} title="No products found" body="Adjust the filters or add a new product." action={<Link href="/admin/products/new" className="btn btn-primary">Add product</Link>} />
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {list.map((p) => {
            const st = stockState(p.stock, data.settings.lowStockThreshold);
            return (
              <li key={p.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:px-5">
                <Link href={`/admin/products/${p.id}`} className="shrink-0">
                  <SmartImage src={p.images[0]} alt="" className={`h-16 w-13 rounded-lg ${p.published ? "" : "opacity-50"}`} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-medium text-ink hover:underline">{p.name}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span>{catName(p.categoryId)}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {money(effectivePrice(p))}
                      {isOnSale(p) && <s className="ml-1">{money(p.price)}</s>}
                    </span>
                    {p.featured && <Badge tone="gold">Featured</Badge>}
                    {p.newArrival && <Badge tone="blue">New</Badge>}
                    {p.bestseller && <Badge tone="green">Bestseller</Badge>}
                  </div>
                </div>
                <div className="hidden w-24 text-right sm:block">
                  <Badge tone={st === "out" ? "red" : st === "low" ? "gold" : "neutral"}>{st === "out" ? "Sold out" : `${p.stock} in stock`}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => togglePublish(p)}
                  className={`hidden min-h-9 w-24 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors md:inline-flex ${p.published ? "bg-sage-soft text-forest hover:bg-sage/40" : "bg-sand text-muted hover:bg-line"}`}
                  aria-label={p.published ? `Unpublish ${p.name}` : `Publish ${p.name}`}
                >
                  {p.published ? <><Eye className="size-3.5" /> Live</> : <><EyeOff className="size-3.5" /> Hidden</>}
                </button>
                <RowMenu product={p} onDelete={() => setToDelete(p)} />
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete product?"
        body={<><strong>{toDelete?.name}</strong> will be removed from the store and from any bundles. You can undo right after.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove(toDelete);
          setToDelete(null);
        }}
      />
    </>
  );
}
