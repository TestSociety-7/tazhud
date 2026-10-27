"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { newId, slugify, uniqueSlug } from "@/lib/commerce";
import type { ColorOption, Product } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageListEditor } from "../image-input";
import { ConfirmDialog, FormField, PageHeader, Panel, Toggle } from "../ui";
import { useSave } from "../use-save";
import { useProductActions } from "./products";

const SIZE_PRESETS: Record<string, string[]> = {
  "XS–XL": ["XS", "S", "M", "L", "XL"],
  "S–XXL": ["S", "M", "L", "XL", "XXL"],
  "S/M, L/XL": ["S/M", "L/XL"],
  "One size": ["One size"],
  Standard: ["Standard"],
};

type Draft = Omit<Product, "price" | "salePrice" | "stock" | "details"> & {
  price: string;
  salePrice: string;
  stock: string;
  details: string;
  bundleIds: string[];
};

function toDraft(p: Product, bundleIds: string[]): Draft {
  return {
    ...p,
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    stock: String(p.stock),
    details: p.details.join("\n"),
    bundleIds,
  };
}

function blankProduct(categoryId: string): Product {
  const now = new Date().toISOString();
  return {
    id: newId("prd"),
    slug: "",
    name: "",
    tagline: "",
    description: "",
    details: [],
    price: 0,
    salePrice: null,
    images: [],
    categoryId,
    sizes: [],
    colors: [],
    stock: 0,
    sku: "",
    featured: false,
    newArrival: true,
    bestseller: false,
    published: false,
    createdAt: now,
    updatedAt: now,
  };
}

type Errors = Partial<Record<"name" | "slug" | "price" | "salePrice" | "stock" | "categoryId", string>>;

function validate(d: Draft, others: Product[]): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Give the product a name.";
  const slug = d.slug.trim() || slugify(d.name);
  if (!slug) e.slug = "Add a URL slug.";
  else if (others.some((p) => p.slug === slug)) e.slug = "Another product already uses this URL.";
  const price = Number(d.price);
  if (!d.price.trim() || !Number.isFinite(price) || price <= 0) e.price = "Enter a price above 0.";
  if (d.salePrice.trim()) {
    const sale = Number(d.salePrice);
    if (!Number.isFinite(sale) || sale <= 0) e.salePrice = "Enter a valid sale price or leave it empty.";
    else if (Number.isFinite(price) && sale >= price) e.salePrice = "Sale price must be lower than the regular price.";
  }
  const stock = Number(d.stock);
  if (!Number.isInteger(stock) || stock < 0) e.stock = "Stock must be a whole number, 0 or more.";
  if (!d.categoryId) e.categoryId = "Choose a category.";
  return e;
}

function ColorsEditor({ colors, onChange }: { colors: ColorOption[]; onChange: (c: ColorOption[]) => void }) {
  return (
    <div className="space-y-2">
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#cccccc"}
            onChange={(e) => onChange(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
            className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-paper p-1"
            aria-label={`Swatch colour for ${c.name || `colour ${i + 1}`}`}
          />
          <input
            className="field"
            value={c.name}
            placeholder="Colour name, e.g. Sage"
            onChange={(e) => onChange(colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            aria-label={`Colour ${i + 1} name`}
          />
          <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => onChange(colors.filter((_, j) => j !== i))} aria-label={`Remove colour ${c.name || i + 1}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => onChange([...colors, { name: "", hex: "#9aaa8f" }])}>
        <Plus className="size-4" /> Add colour
      </button>
    </div>
  );
}

function SizesEditor({ sizes, onChange }: { sizes: string[]; onChange: (s: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...sizes, ...parts.filter((p) => !sizes.includes(p))]);
    setValue("");
  };
  return (
    <div className="space-y-3">
      {sizes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => onChange(sizes.filter((x) => x !== s))} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-sm hover:bg-line" aria-label={`Remove size ${s}`}>
                {s} <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className="field"
          placeholder="Add sizes, comma separated"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          aria-label="Add sizes"
        />
        <button type="button" className="btn btn-outline border-line" onClick={add}>Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted">Presets:</span>
        {Object.entries(SIZE_PRESETS).map(([k, v]) => (
          <button key={k} type="button" onClick={() => onChange(v)} className="rounded-full px-2 text-xs font-semibold text-forest underline-offset-2 hover:underline">
            {k}
          </button>
        ))}
        {sizes.length > 0 && <button type="button" onClick={() => onChange([])} className="rounded-full px-2 text-xs text-muted hover:underline">Clear</button>}
      </div>
    </div>
  );
}

export function ProductEditor({ productId }: { productId?: string }) {
  const { data, ready } = useStore();
  const router = useRouter();
  const save = useSave();
  const { duplicate, remove } = useProductActions();
  const existing = productId ? data.products.find((p) => p.id === productId) : undefined;
  const isNew = !productId;

  const initial = () => {
    const base = existing ?? blankProduct(data.categories[0]?.id ?? "");
    return toDraft(base, data.bundles.filter((b) => b.items.some((it) => it.productId === base.id)).map((b) => b.id));
  };
  const [draft, setDraft] = useState<Draft>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(draft));
  const [errors, setErrors] = useState<Errors>({});
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // Saved data loads after the first render; re-sync the form once it arrives.
  const [syncedReady, setSyncedReady] = useState(ready);
  if (ready && !syncedReady) {
    setSyncedReady(true);
    const fresh = initial();
    setDraft(fresh);
    setBaseline(JSON.stringify(fresh));
  }

  const dirty = JSON.stringify(draft) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (productId && !existing) {
    return ready ? (
      <div className="card">
        <EmptyState title="Product not found" body="It may have been deleted." action={<Link href="/admin/products" className="btn btn-primary">Back to products</Link>} />
      </div>
    ) : (
      <div className="skeleton h-96 rounded-2xl" aria-busy="true" />
    );
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (k === "name" && !slugTouched) next.slug = slugify(String(v));
      return next;
    });
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const others = data.products.filter((p) => p.id !== draft.id);
    const errs = validate(draft, others);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setSaving(true);
    const { bundleIds, ...rest } = draft;
    const product: Product = {
      ...rest,
      name: rest.name.trim(),
      slug: rest.slug.trim() ? slugify(rest.slug) : uniqueSlug(rest.name, others.map((p) => p.slug)),
      price: Math.round(Number(rest.price) * 100) / 100,
      salePrice: rest.salePrice.trim() ? Math.round(Number(rest.salePrice) * 100) / 100 : null,
      stock: Number(rest.stock),
      details: rest.details.split("\n").map((s) => s.trim()).filter(Boolean),
      colors: rest.colors.filter((c) => c.name.trim()).map((c) => ({ ...c, name: c.name.trim() })),
      sku: rest.sku.trim() || `TZ-${slugify(rest.name).slice(0, 8).toUpperCase()}`,
      updatedAt: new Date().toISOString(),
    };
    const ok = await save(
      (d) => ({
        ...d,
        products: isNew ? [product, ...d.products] : d.products.map((p) => (p.id === product.id ? product : p)),
        bundles: d.bundles.map((b) => {
          const has = b.items.some((it) => it.productId === product.id);
          const want = bundleIds.includes(b.id);
          if (has === want) return b;
          return { ...b, items: want ? [...b.items, { productId: product.id, quantity: 1 }] : b.items.filter((it) => it.productId !== product.id) };
        }),
      }),
      isNew ? `“${product.name}” created${product.published ? " and published" : " as a draft"}` : "Changes saved",
    );
    setSaving(false);
    if (!ok) return;
    const saved = toDraft(product, bundleIds);
    setDraft(saved);
    setBaseline(JSON.stringify(saved));
    if (isNew) router.replace(`/admin/products/${product.id}`);
  }

  const category = data.categories.find((c) => c.id === draft.categoryId);

  return (
    <form onSubmit={submit} noValidate>
      <Link href="/admin/products" className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All products
      </Link>
      <PageHeader
        title={isNew ? "New product" : draft.name || "Untitled product"}
        description={isNew ? "Fill in the details below. New products start hidden until you publish them." : `Last updated ${new Date(draft.updatedAt).toLocaleString(data.settings.locale, { dateStyle: "medium", timeStyle: "short" })}`}
        actions={
          !isNew && (
            <>
              <a href={`/product/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline border-line">
                <ExternalLink className="size-4" /> View
              </a>
              <button
                type="button"
                className="btn btn-sm btn-outline border-line"
                onClick={async () => {
                  if (!existing) return;
                  const copy = await duplicate(existing);
                  if (copy) router.push(`/admin/products/${copy.id}`);
                }}
              >
                <Copy className="size-4" /> Duplicate
              </button>
              <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Delete
              </button>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="space-y-5">
              <FormField label="Name" htmlFor="f-name" error={errors.name}>
                <input id="f-name" className="field" value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
              </FormField>
              <FormField label="Tagline" htmlFor="f-tagline" hint="A short line shown under the name.">
                <input id="f-tagline" className="field" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </FormField>
              <FormField label="Description" htmlFor="f-description">
                <textarea id="f-description" className="field" rows={5} value={draft.description} onChange={(e) => set("description", e.target.value)} />
              </FormField>
              <FormField label="Details & care" htmlFor="f-details" hint="One point per line: fabric, measurements, fit, care.">
                <textarea id="f-details" className="field" rows={4} value={draft.details} onChange={(e) => set("details", e.target.value)} />
              </FormField>
            </div>
          </Panel>

          <Panel title="Images" description="Drag order with the arrows. The first image is the cover.">
            <ImageListEditor images={draft.images} onChange={(imgs) => set("images", imgs)} />
          </Panel>

          <Panel title="Options">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="label">Colours</p>
                <ColorsEditor colors={draft.colors} onChange={(c) => set("colors", c)} />
              </div>
              <div>
                <p className="label">Sizes</p>
                <SizesEditor sizes={draft.sizes} onChange={(s) => set("sizes", s)} />
              </div>
            </div>
          </Panel>

          <Panel title="Pricing & stock">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={`Price (${data.settings.currency})`} htmlFor="f-price" error={errors.price}>
                <input id="f-price" className="field" inputMode="decimal" value={draft.price} onChange={(e) => set("price", e.target.value)} aria-invalid={!!errors.price} />
              </FormField>
              <FormField label="Sale price (optional)" htmlFor="f-salePrice" error={errors.salePrice} hint="Leave empty for no sale.">
                <input id="f-salePrice" className="field" inputMode="decimal" value={draft.salePrice} onChange={(e) => set("salePrice", e.target.value)} aria-invalid={!!errors.salePrice} />
              </FormField>
              <FormField label="Stock" htmlFor="f-stock" error={errors.stock} hint={`Shows “low stock” at ${data.settings.lowStockThreshold} or fewer.`}>
                <input id="f-stock" className="field" inputMode="numeric" value={draft.stock} onChange={(e) => set("stock", e.target.value)} aria-invalid={!!errors.stock} />
              </FormField>
              <FormField label="SKU" htmlFor="f-sku" hint="Leave empty to generate one.">
                <input id="f-sku" className="field" value={draft.sku} onChange={(e) => set("sku", e.target.value)} />
              </FormField>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Visibility">
            <div className="space-y-5">
              <Toggle checked={draft.published} onChange={(v) => set("published", v)} label="Published" description="Visible to customers" />
              <Toggle checked={draft.featured} onChange={(v) => set("featured", v)} label="Featured" description="Shown first in the shop" />
              <Toggle checked={draft.newArrival} onChange={(v) => set("newArrival", v)} label="New arrival" description="Appears in New arrivals" />
              <Toggle checked={draft.bestseller} onChange={(v) => set("bestseller", v)} label="Bestseller" description="Appears in Bestsellers" />
            </div>
          </Panel>

          <Panel title="Organisation">
            <div className="space-y-5">
              <FormField label="Category" htmlFor="f-categoryId" error={errors.categoryId}>
                <select id="f-categoryId" className="field" value={draft.categoryId} onChange={(e) => set("categoryId", e.target.value)} aria-invalid={!!errors.categoryId}>
                  <option value="">Choose…</option>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="URL slug" htmlFor="f-slug" error={errors.slug} hint={`/product/${draft.slug || slugify(draft.name) || "…"}`}>
                <input
                  id="f-slug"
                  className="field"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                  aria-invalid={!!errors.slug}
                />
              </FormField>
              {category && <p className="text-xs text-muted">Shown under {category.name} in the shop.</p>}
            </div>
          </Panel>

          <Panel title="Bundles" description="Include this piece in curated bundles (quantity 1). Adjust quantities on the Bundles page.">
            {data.bundles.length === 0 ? (
              <p className="text-sm text-muted">No bundles yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.bundles.map((b) => (
                  <li key={b.id}>
                    <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-forest"
                        checked={draft.bundleIds.includes(b.id)}
                        onChange={(e) => set("bundleIds", e.target.checked ? [...draft.bundleIds, b.id] : draft.bundleIds.filter((x) => x !== b.id))}
                      />
                      {b.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <p className="text-sm text-muted" role="status">{dirty ? "Unsaved changes" : "All changes saved"}</p>
        <div className="flex gap-2">
          {dirty && !isNew && (
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(JSON.parse(baseline))}>
              Discard
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving || (!dirty && !isNew)}>
            {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product?"
        body={<><strong>{draft.name}</strong> will be removed from the store and any bundles.</>}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          if (existing && (await remove(existing))) router.push("/admin/products");
        }}
      />
    </form>
  );
}
