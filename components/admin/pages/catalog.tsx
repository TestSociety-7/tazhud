"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Gift, Pencil, Plus, Shapes, TicketPercent, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { bundleDetails, formatMoney, newId, slugify, uniqueSlug } from "@/lib/commerce";
import type { Bundle, Category, Coupon, CouponType } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/empty-state";
import { SingleImageInput } from "../image-input";
import { Badge, ConfirmDialog, FormField, Modal, PageHeader, Toggle } from "../ui";
import { useSave } from "../use-save";

/* ---------------------------------- Categories ---------------------------------- */

export function CategoriesPage() {
  const { data } = useStore();
  const save = useSave();
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const cats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const count = (id: string) => data.products.filter((p) => p.categoryId === id).length;

  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const order = [...cats];
    [order[i], order[j]] = [order[j], order[i]];
    save((d) => ({ ...d, categories: order.map((c, k) => ({ ...c, sortOrder: k + 1 })) }), "Category order updated");
  };

  async function submit() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setErrors({ name: "Enter a category name." });
      return;
    }
    const isNew = !data.categories.some((c) => c.id === editing.id);
    const others = data.categories.filter((c) => c.id !== editing.id).map((c) => c.slug);
    const cat = { ...editing, name: editing.name.trim(), slug: uniqueSlug(editing.slug || editing.name, others) };
    const ok = await save(
      (d) => ({ ...d, categories: isNew ? [...d.categories, cat] : d.categories.map((c) => (c.id === cat.id ? cat : c)) }),
      isNew ? `“${cat.name}” added` : `“${cat.name}” saved`,
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories organise the shop and appear in the navigation and on the homepage. The first three show in the desktop menu."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setEditing({ id: newId("cat"), slug: "", name: "", description: "", image: "", sortOrder: cats.length + 1 }); }}>
            <Plus className="size-4" /> Add category
          </button>
        }
      />
      {cats.length === 0 ? (
        <div className="card"><EmptyState icon={<Shapes className="size-6" />} title="No categories" body="Add your first category to organise products." /></div>
      ) : (
        <ul className="card divide-y divide-line">
          {cats.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:px-5">
              <div className="flex flex-col">
                <button type="button" className="icon-btn size-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${c.name} up`}><ArrowUp className="size-4" /></button>
                <button type="button" className="icon-btn size-8" disabled={i === cats.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${c.name} down`}><ArrowDown className="size-4" /></button>
              </div>
              <SmartImage src={c.image} alt="" className="h-16 w-13 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="line-clamp-1 text-xs text-muted">{c.description}</p>
              </div>
              <Badge>{count(c.id)} products</Badge>
              <button type="button" className="icon-btn" onClick={() => { setErrors({}); setEditing({ ...c }); }} aria-label={`Edit ${c.name}`}><Pencil className="size-4" /></button>
              <button type="button" className="icon-btn text-muted hover:text-danger" onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={data.categories.some((c) => c.id === editing.id) ? "Edit category" : "New category"}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={submit}>Save category</button></>}
        >
          <div className="space-y-5">
            <FormField label="Name" htmlFor="c-name" error={errors.name}>
              <input id="c-name" className="field" value={editing.name} onChange={(e) => { setEditing({ ...editing, name: e.target.value }); setErrors({}); }} aria-invalid={!!errors.name} autoFocus />
            </FormField>
            <FormField label="URL slug" htmlFor="c-slug" hint={`/shop?category=${editing.slug || slugify(editing.name) || "…"}`}>
              <input id="c-slug" className="field" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
            </FormField>
            <FormField label="Description" htmlFor="c-desc">
              <textarea id="c-desc" className="field" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </FormField>
            <div>
              <p className="label">Image</p>
              <SingleImageInput label="Category image URL" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category?"
        body={
          toDelete && count(toDelete.id) > 0 ? (
            <>“{toDelete.name}” has {count(toDelete.id)} products. They&apos;ll be moved to <strong>{cats.find((c) => c.id !== toDelete.id)?.name ?? "no category"}</strong>.</>
          ) : (
            <>“{toDelete?.name}” will be removed.</>
          )
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const target = toDelete;
          setToDelete(null);
          if (!target) return;
          const fallback = cats.find((c) => c.id !== target.id)?.id ?? "";
          save(
            (d) => ({
              ...d,
              categories: d.categories.filter((c) => c.id !== target.id),
              products: d.products.map((p) => (p.categoryId === target.id ? { ...p, categoryId: fallback } : p)),
            }),
            `“${target.name}” deleted`,
          );
        }}
      />
    </>
  );
}

/* ----------------------------------- Bundles ----------------------------------- */

export function BundlesPage() {
  const { data } = useStore();
  const save = useSave();
  const money = (n: number) => formatMoney(n, data.settings);
  const [editing, setEditing] = useState<(Omit<Bundle, "price"> & { price: string }) | null>(null);
  const [errors, setErrors] = useState<{ name?: string; price?: string; items?: string }>({});
  const [toDelete, setToDelete] = useState<Bundle | null>(null);

  async function submit() {
    if (!editing) return;
    const e: typeof errors = {};
    if (!editing.name.trim()) e.name = "Enter a bundle name.";
    const price = Number(editing.price);
    if (!Number.isFinite(price) || price <= 0) e.price = "Enter a bundle price above 0.";
    if (editing.items.length === 0) e.items = "Add at least one product.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const isNew = !data.bundles.some((b) => b.id === editing.id);
    const bundle: Bundle = {
      ...editing,
      name: editing.name.trim(),
      price: Math.round(price * 100) / 100,
      slug: uniqueSlug(editing.slug || editing.name, data.bundles.filter((b) => b.id !== editing.id).map((b) => b.slug)),
    };
    const ok = await save(
      (d) => ({ ...d, bundles: isNew ? [...d.bundles, bundle] : d.bundles.map((b) => (b.id === bundle.id ? bundle : b)) }),
      isNew ? `“${bundle.name}” created` : `“${bundle.name}” saved`,
    );
    if (ok) setEditing(null);
  }

  const preview = editing ? bundleDetails({ ...editing, price: Number(editing.price) || 0 }, data.products) : null;

  return (
    <>
      <PageHeader
        title="Bundles"
        description="Curated sets sold at one price. They appear on the homepage and under Bundles in the shop."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setEditing({ id: newId("bdl"), slug: "", name: "", description: "", image: "", items: [], price: "", active: true, note: "Choose colours on WhatsApp" }); }}>
            <Plus className="size-4" /> New bundle
          </button>
        }
      />
      {data.bundles.length === 0 ? (
        <div className="card"><EmptyState icon={<Gift className="size-6" />} title="No bundles yet" body="Pair pieces that go together and offer them at a better price." /></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.bundles.map((b) => {
            const det = bundleDetails(b, data.products);
            return (
              <li key={b.id} className="card flex gap-4 p-4">
                <SmartImage src={b.image} alt="" className="h-28 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-2xl leading-tight text-ink">{b.name}</p>
                    <Badge tone={b.active ? "green" : "neutral"}>{b.active ? "Active" : "Hidden"}</Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    <strong>{money(b.price)}</strong> <span className="text-muted">· worth {money(det.value)}</span>
                    {det.savings > 0 && <span className="text-success"> · saves {money(det.savings)}</span>}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{det.items.map((it) => `${it.quantity}× ${it.product.name}`).join(", ") || "No products"}</p>
                  {!det.available && b.active && <p className="mt-1 text-xs text-danger">Unavailable: a product is hidden or out of stock.</p>}
                  <div className="mt-3 flex flex-wrap gap-1">
                    <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => { setErrors({}); setEditing({ ...structuredClone(b), price: String(b.price) }); }}><Pencil className="size-3.5" /> Edit</button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => save((d) => ({ ...d, bundles: d.bundles.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)) }), b.active ? `“${b.name}” hidden` : `“${b.name}” is live`)}>
                      {b.active ? "Hide" : "Publish"}
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => setToDelete(b)}><Trash2 className="size-3.5" /> Delete</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <Modal
          open
          size="lg"
          onClose={() => setEditing(null)}
          title={data.bundles.some((b) => b.id === editing.id) ? "Edit bundle" : "New bundle"}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={submit}>Save bundle</button></>}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <FormField label="Name" htmlFor="b-name" error={errors.name}>
                <input id="b-name" className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-invalid={!!errors.name} />
              </FormField>
              <FormField label="Description" htmlFor="b-desc">
                <textarea id="b-desc" className="field" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </FormField>
              <FormField label="Customer note" htmlFor="b-note" hint="e.g. how colours or sizes are chosen.">
                <input id="b-note" className="field" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              </FormField>
              <FormField label={`Bundle price (${data.settings.currency})`} htmlFor="b-price" error={errors.price} hint={preview ? `Items are worth ${money(preview.value)} separately.` : undefined}>
                <input id="b-price" className="field" inputMode="decimal" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} aria-invalid={!!errors.price} />
              </FormField>
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Active" description="Show this bundle on the store" />
            </div>
            <div className="space-y-5">
              <div>
                <p className="label">Image</p>
                <SingleImageInput label="Bundle image URL" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
              </div>
              <div>
                <p className="label">Products in this bundle</p>
                <ul className="space-y-2">
                  {editing.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <select className="field" value={it.productId} onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)) })} aria-label={`Product ${i + 1}`}>
                        {data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="field !w-20" inputMode="numeric" value={it.quantity} onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, j) => (j === i ? { ...x, quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) } : x)) })} aria-label={`Quantity for product ${i + 1}`} />
                      <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => setEditing({ ...editing, items: editing.items.filter((_, j) => j !== i) })} aria-label={`Remove product ${i + 1}`}><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn btn-sm btn-outline mt-3 border-line" disabled={!data.products.length} onClick={() => { setEditing({ ...editing, items: [...editing.items, { productId: data.products[0].id, quantity: 1 }] }); setErrors((x) => ({ ...x, items: undefined })); }}>
                  <Plus className="size-4" /> Add product
                </button>
                {errors.items && <p className="error-text">{errors.items}</p>}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete bundle?"
        body={<>“{toDelete?.name}” will be removed. Products in it are not affected.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          setToDelete(null);
          if (t) save((d) => ({ ...d, bundles: d.bundles.filter((b) => b.id !== t.id) }), `“${t.name}” deleted`);
        }}
      />
    </>
  );
}

/* ----------------------------------- Coupons ----------------------------------- */

const TYPE_LABEL: Record<CouponType, string> = { percent: "Percentage off", fixed: "Fixed amount off", free_delivery: "Free delivery" };

export function CouponsPage() {
  const { data } = useStore();
  const save = useSave();
  const money = (n: number) => formatMoney(n, data.settings);
  type Draft = Omit<Coupon, "value" | "minSubtotal"> & { value: string; minSubtotal: string };
  const [editing, setEditing] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ code?: string; value?: string; minSubtotal?: string }>({});
  const [toDelete, setToDelete] = useState<Coupon | null>(null);

  const describe = (c: Coupon) =>
    c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${money(c.value)} off` : "Free delivery";

  async function submit() {
    if (!editing) return;
    const e: typeof errors = {};
    const code = editing.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = "Use 3 to 20 letters, numbers, dashes or underscores.";
    else if (data.coupons.some((c) => c.code === code && c.id !== editing.id)) e.code = "That code already exists.";
    const value = Number(editing.value);
    if (editing.type === "percent" && (!Number.isFinite(value) || value <= 0 || value > 100)) e.value = "Enter a percentage between 1 and 100.";
    if (editing.type === "fixed" && (!Number.isFinite(value) || value <= 0)) e.value = "Enter an amount above 0.";
    const min = Number(editing.minSubtotal || 0);
    if (!Number.isFinite(min) || min < 0) e.minSubtotal = "Enter 0 or more.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const coupon: Coupon = { ...editing, code, value: editing.type === "free_delivery" ? 0 : value, minSubtotal: min };
    const isNew = !data.coupons.some((c) => c.id === coupon.id);
    const ok = await save((d) => ({ ...d, coupons: isNew ? [coupon, ...d.coupons] : d.coupons.map((c) => (c.id === coupon.id ? coupon : c)) }), isNew ? `Code ${code} created` : `Code ${code} saved`);
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Promo codes customers can enter in the bag or at checkout. The discount is shown in the WhatsApp order message."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setEditing({ id: newId("cpn"), code: "", description: "", type: "percent", value: "10", minSubtotal: "0", active: true, expiresOn: "" }); }}>
            <Plus className="size-4" /> New code
          </button>
        }
      />
      {data.coupons.length === 0 ? (
        <div className="card"><EmptyState icon={<TicketPercent className="size-6" />} title="No promo codes" body="Create a code for a launch, Eid or a welcome offer." /></div>
      ) : (
        <ul className="card divide-y divide-line">
          {data.coupons.map((c) => {
            const expired = c.expiresOn && new Date(`${c.expiresOn}T23:59:59`) < new Date();
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
                <span className="rounded-lg border border-dashed border-gold px-3 py-1.5 font-mono text-sm tracking-widest text-ink">{c.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{describe(c)}{c.minSubtotal > 0 && <span className="text-muted"> · over {money(c.minSubtotal)}</span>}</p>
                  <p className="text-xs text-muted">{c.description}{c.expiresOn && ` · ${expired ? "expired" : "ends"} ${new Date(`${c.expiresOn}T00:00:00`).toLocaleDateString(data.settings.locale, { dateStyle: "medium" })}`}</p>
                </div>
                {data.homepage.promo.couponCode === c.code && <Badge tone="gold">On homepage</Badge>}
                <Badge tone={expired ? "red" : c.active ? "green" : "neutral"}>{expired ? "Expired" : c.active ? "Active" : "Paused"}</Badge>
                <div className="flex">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => save((d) => ({ ...d, coupons: d.coupons.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)) }), c.active ? `${c.code} paused` : `${c.code} activated`)}>
                    {c.active ? "Pause" : "Activate"}
                  </button>
                  <button type="button" className="icon-btn" onClick={() => { setErrors({}); setEditing({ ...c, value: String(c.value), minSubtotal: String(c.minSubtotal) }); }} aria-label={`Edit ${c.code}`}><Pencil className="size-4" /></button>
                  <button type="button" className="icon-btn text-muted hover:text-danger" onClick={() => setToDelete(c)} aria-label={`Delete ${c.code}`}><Trash2 className="size-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={data.coupons.some((c) => c.id === editing.id) ? `Edit ${editing.code}` : "New promo code"}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={submit}>Save code</button></>}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Code" htmlFor="cp-code" error={errors.code}>
              <input id="cp-code" className="field font-mono uppercase" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} aria-invalid={!!errors.code} />
            </FormField>
            <FormField label="Type" htmlFor="cp-type">
              <select id="cp-type" className="field" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as CouponType })}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormField>
            {editing.type !== "free_delivery" && (
              <FormField label={editing.type === "percent" ? "Percent off" : `Amount off (${data.settings.currency})`} htmlFor="cp-value" error={errors.value}>
                <input id="cp-value" className="field" inputMode="decimal" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} aria-invalid={!!errors.value} />
              </FormField>
            )}
            <FormField label="Minimum order" htmlFor="cp-min" error={errors.minSubtotal} hint="0 for no minimum.">
              <input id="cp-min" className="field" inputMode="decimal" value={editing.minSubtotal} onChange={(e) => setEditing({ ...editing, minSubtotal: e.target.value })} aria-invalid={!!errors.minSubtotal} />
            </FormField>
            <FormField label="Expires on (optional)" htmlFor="cp-exp">
              <input id="cp-exp" type="date" className="field" value={editing.expiresOn} onChange={(e) => setEditing({ ...editing, expiresOn: e.target.value })} />
            </FormField>
            <FormField label="Description" htmlFor="cp-desc" className="sm:col-span-2">
              <input id="cp-desc" className="field" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </FormField>
            <div className="sm:col-span-2">
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Active" description="Customers can use this code" />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete code?"
        body={<>Code <strong>{toDelete?.code}</strong> will stop working immediately.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          setToDelete(null);
          if (t) save((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== t.id) }), `${t.code} deleted`);
        }}
      />
    </>
  );
}
