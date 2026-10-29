"use client";

import { useState } from "react";
import { Check, Gift, Minus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { bundleDetails, effectivePrice, formatMoney, newId, roundMoney, slugify, uniqueSlug, visibleProducts } from "@/lib/commerce";
import type { Bundle } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { SingleImageInput } from "../image-input";
import { Badge, ConfirmDialog, FormField, Modal, PageHeader, Toggle } from "../ui";
import { useSave } from "../use-save";

type Draft = Omit<Bundle, "price"> & { price: string };
type Errors = { name?: string; items?: string; price?: string };

const blank = (): Draft => ({ id: newId("bdl"), slug: "", name: "", description: "", image: "", items: [], price: "", active: true, note: "" });

/** Bundles: a few products sold together for one lower price. */
export function BundlesPage() {
  const { data } = useStore();
  const save = useSave();
  const money = (n: number) => formatMoney(n, data.settings);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Bundle | null>(null);
  const products = visibleProducts(data);
  const homeSection = data.homepage.sections.find((s) => s.key === "bundles");

  const value = editing ? roundMoney(editing.items.reduce((s, it) => s + effectivePrice(data.products.find((p) => p.id === it.productId) ?? { price: 0 }) * it.quantity, 0)) : 0;
  const qtyOf = (id: string) => editing?.items.find((it) => it.productId === id)?.quantity ?? 0;

  function setQty(id: string, quantity: number) {
    if (!editing) return;
    const items = quantity <= 0 ? editing.items.filter((it) => it.productId !== id) : editing.items.some((it) => it.productId === id) ? editing.items.map((it) => (it.productId === id ? { ...it, quantity } : it)) : [...editing.items, { productId: id, quantity }];
    setEditing({ ...editing, items });
    if (errors.items) setErrors((e) => ({ ...e, items: undefined }));
  }

  async function submit() {
    if (!editing) return;
    const e: Errors = {};
    const price = Number(editing.price);
    if (editing.name.trim().length < 2) e.name = "اكتب اسم المجموعة.";
    if (editing.items.reduce((n, it) => n + it.quantity, 0) < 2) e.items = "اختر قطعتين على الأقل.";
    if (!Number.isFinite(price) || price <= 0) e.price = "اكتب سعر المجموعة.";
    else if (value && price >= value) e.price = `اجعل السعر أقل من ${money(value)} ليشعر الزبون بالتوفير.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    const isNew = !data.bundles.some((b) => b.id === editing.id);
    const taken = data.bundles.filter((b) => b.id !== editing.id).map((b) => b.slug);
    const bundle: Bundle = {
      ...editing,
      name: editing.name.trim(),
      description: editing.description.trim(),
      note: editing.note.trim(),
      price: roundMoney(price),
      slug: editing.slug || uniqueSlug(slugify(editing.name) || "bundle", taken),
    };
    const ok = await save(
      (d) => ({
        ...d,
        bundles: isNew ? [bundle, ...d.bundles] : d.bundles.map((b) => (b.id === bundle.id ? bundle : b)),
        // The first bundle also switches its home page section on.
        homepage: isNew && !d.bundles.length ? { ...d.homepage, sections: d.homepage.sections.map((s) => (s.key === "bundles" ? { ...s, enabled: true } : s)) } : d.homepage,
      }),
      isNew ? `تم إنشاء ${bundle.name}` : `تم حفظ ${bundle.name}`,
    );
    if (ok) setEditing(null);
  }

  const q = query.trim();
  const list = q ? products.filter((p) => p.name.includes(q)) : products;

  return (
    <>
      <PageHeader
        title="المجموعات"
        description="اجمع قطعًا معًا بسعر أقل، مثل طرحة مع دبابيس أو عباية مع طرحة. تظهر في الصفحة الرئيسية ويضيفها الزبون للسلة بضغطة."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setQuery(""); setEditing(blank()); }}>
            <Plus className="size-4" /> مجموعة جديدة
          </button>
        }
      />

      {homeSection && !homeSection.enabled && data.bundles.length > 0 && (
        <p className="mb-5 rounded-2xl border border-gold/40 bg-gold-soft/40 p-4 text-sm text-[#5c4519]">قسم المجموعات مخفي من الصفحة الرئيسية. أظهره من «واجهة المتجر» ← ترتيب الصفحة.</p>
      )}

      {data.bundles.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Gift className="size-6" />} title="لا توجد مجموعات بعد" body="أنشئ أول مجموعة وستظهر للزبائن في الصفحة الرئيسية." />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.bundles.map((b) => {
            const d = bundleDetails(b, data.products);
            return (
              <li key={b.id} className="card flex gap-4 p-4">
                <div className="relative h-24 w-20 shrink-0">
                  {d.items.slice(0, 3).map((it, i) => (
                    <span key={it.productId} className="absolute" style={{ insetInlineStart: i * 12, top: i * 6, zIndex: 3 - i }}>
                      <SmartImage src={it.product.images[0]} alt="" className="aspect-[4/5] w-14 rounded-lg ring-2 ring-paper" fallbackLabel=" " />
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{b.name}</p>
                    {!b.active ? <Badge>موقوفة</Badge> : !d.available ? <Badge tone="red">قطعة غير متوفرة</Badge> : <Badge tone="green">ظاهرة</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{d.items.map((it) => `${it.product.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(" + ")}</p>
                  <p className="mt-1 text-sm">
                    <strong className="text-ink tabular-nums">{money(b.price)}</strong>{" "}
                    {d.savings > 0 && <span className="text-xs text-muted line-through tabular-nums">{money(d.value)}</span>}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => { setErrors({}); setQuery(""); setEditing({ ...b, price: String(b.price) }); }}>
                      <Pencil className="size-3.5" /> تعديل
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => setToDelete(b)}>
                      <Trash2 className="size-3.5" /> حذف
                    </button>
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
          onClose={() => setEditing(null)}
          title={data.bundles.some((b) => b.id === editing.id) ? "تعديل المجموعة" : "مجموعة جديدة"}
          size="lg"
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>إلغاء</button>
              <button type="button" className="btn btn-primary" onClick={submit}>حفظ المجموعة</button>
            </>
          }
        >
          <div className="space-y-6">
            <FormField label="اسم المجموعة" htmlFor="b-name" error={errors.name}>
              <input id="b-name" className="field" placeholder="مثال: طقم الصلاة الكامل" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </FormField>

            <div>
              <p className="label">القطع في المجموعة</p>
              {errors.items && <p className="error-text mb-2" role="alert">{errors.items}</p>}
              <label className="relative mb-3 block">
                <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input className="field ps-9" type="search" placeholder="ابحث باسم المنتج" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="ابحث باسم المنتج" />
              </label>
              <ul className="grid max-h-[22rem] grid-cols-2 gap-3 overflow-y-auto p-0.5 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((p) => {
                  const n = qtyOf(p.id);
                  return (
                    <li key={p.id} className={`relative overflow-hidden rounded-2xl border bg-paper ${n ? "border-forest ring-2 ring-forest/30" : "border-line"}`}>
                      <button type="button" className="block w-full text-start" onClick={() => setQty(p.id, n ? 0 : 1)} aria-pressed={n > 0}>
                        <SmartImage src={p.images[0]} alt="" className="aspect-square w-full" />
                        {n > 0 && <span className="absolute top-2 end-2 grid size-7 place-items-center rounded-full bg-forest text-ivory shadow"><Check className="size-4" /></span>}
                        <span className="block p-2">
                          <span className="line-clamp-1 text-xs font-semibold text-ink">{p.name}</span>
                          <span className="block text-[0.7rem] text-muted">{money(effectivePrice(p))}</span>
                        </span>
                      </button>
                      {n > 0 && (
                        <div className="flex items-center justify-between border-t border-line px-2 py-1">
                          <button type="button" className="icon-btn size-8" onClick={() => setQty(p.id, n - 1)} aria-label={`أقل من ${p.name}`}><Minus className="size-3.5" /></button>
                          <span className="text-sm font-semibold tabular-nums">{n}</span>
                          <button type="button" className="icon-btn size-8" onClick={() => setQty(p.id, Math.min(9, n + 1))} aria-label={`أكثر من ${p.name}`}><Plus className="size-3.5" /></button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="سعر المجموعة"
                htmlFor="b-price"
                error={errors.price}
                hint={value ? `ثمن القطع منفصلة ${money(value)}. مثلًا ${money(Math.round(value * 0.9))} يعني توفير 10%.` : "اختر القطع أولًا."}
              >
                <input id="b-price" className="field" inputMode="decimal" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </FormField>
              <FormField label="ملاحظة قصيرة (اختياري)" htmlFor="b-note" hint="مثال: اختاري الألوان على واتساب">
                <input id="b-note" className="field" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              </FormField>
              <FormField label="وصف (اختياري)" htmlFor="b-desc" className="sm:col-span-2">
                <input id="b-desc" className="field" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </FormField>
            </div>

            <div>
              <p className="label">صورة خاصة (اختياري)</p>
              <p className="hint mb-2">بدونها تظهر صور القطع نفسها.</p>
              <SingleImageInput label="رابط صورة المجموعة" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
            </div>

            <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="ظاهرة للزبائن" />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف هذه المجموعة؟"
        body={<>ستُحذف <strong>{toDelete?.name}</strong>. القطع نفسها تبقى في المتجر.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          const b = toDelete;
          setToDelete(null);
          if (b) await save((d) => ({ ...d, bundles: d.bundles.filter((x) => x.id !== b.id) }), `تم حذف ${b.name}`);
        }}
      />
    </>
  );
}
