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
import { dateFormat, itemsLabel } from "@/lib/arabic";

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
    save((d) => ({ ...d, categories: order.map((c, k) => ({ ...c, sortOrder: k + 1 })) }), "تم تحديث ترتيب الأقسام");
  };

  async function submit() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setErrors({ name: "اكتب اسم القسم." });
      return;
    }
    const isNew = !data.categories.some((c) => c.id === editing.id);
    const others = data.categories.filter((c) => c.id !== editing.id).map((c) => c.slug);
    const cat = { ...editing, name: editing.name.trim(), slug: uniqueSlug(editing.slug || editing.name, others) };
    const ok = await save(
      (d) => ({ ...d, categories: isNew ? [...d.categories, cat] : d.categories.map((c) => (c.id === cat.id ? cat : c)) }),
      isNew ? `تمت إضافة «${cat.name}»` : `تم حفظ «${cat.name}»`,
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="الأقسام"
        description="الأقسام ترتّب المتجر وتظهر في القائمة وفي الصفحة الرئيسية. أول ثلاثة أقسام تظهر في قائمة الكمبيوتر."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setEditing({ id: newId("cat"), slug: "", name: "", description: "", image: "", sortOrder: cats.length + 1 }); }}>
            <Plus className="size-4" /> إضافة قسم
          </button>
        }
      />
      {cats.length === 0 ? (
        <div className="card"><EmptyState icon={<Shapes className="size-6" />} title="لا توجد أقسام" body="أضف أول قسم لترتيب المنتجات." /></div>
      ) : (
        <ul className="card divide-y divide-line">
          {cats.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:px-5">
              <div className="flex flex-col">
                <button type="button" className="icon-btn size-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`تقديم ${c.name}`}><ArrowUp className="size-4" /></button>
                <button type="button" className="icon-btn size-8" disabled={i === cats.length - 1} onClick={() => move(i, 1)} aria-label={`تأخير ${c.name}`}><ArrowDown className="size-4" /></button>
              </div>
              <SmartImage src={c.image} alt="" className="h-16 w-13 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="line-clamp-1 text-xs text-muted">{c.description}</p>
              </div>
              <Badge>{itemsLabel(count(c.id))}</Badge>
              <button type="button" className="icon-btn" onClick={() => { setErrors({}); setEditing({ ...c }); }} aria-label={`تعديل ${c.name}`}><Pencil className="size-4" /></button>
              <button type="button" className="icon-btn text-muted hover:text-danger" onClick={() => setToDelete(c)} aria-label={`حذف ${c.name}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={data.categories.some((c) => c.id === editing.id) ? "تعديل القسم" : "قسم جديد"}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>إلغاء</button><button type="button" className="btn btn-primary" onClick={submit}>حفظ القسم</button></>}
        >
          <div className="space-y-5">
            <FormField label="الاسم" htmlFor="c-name" error={errors.name}>
              <input id="c-name" className="field" value={editing.name} onChange={(e) => { setEditing({ ...editing, name: e.target.value }); setErrors({}); }} aria-invalid={!!errors.name} autoFocus />
            </FormField>
            <FormField label="رابط القسم (اختياري، بالإنجليزية)" htmlFor="c-slug" hint={`/shop?category=${editing.slug || slugify(editing.name) || "…"} · يُنشأ تلقائيًا إذا تركته فارغًا`}>
              <input id="c-slug" className="field ltr" dir="ltr" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
            </FormField>
            <FormField label="الوصف" htmlFor="c-desc">
              <textarea id="c-desc" className="field" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </FormField>
            <div>
              <p className="label">الصورة</p>
              <SingleImageInput label="رابط صورة القسم" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف القسم؟"
        body={
          toDelete && count(toDelete.id) > 0 ? (
            <>في «{toDelete.name}» {itemsLabel(count(toDelete.id))}. سيتم نقلها إلى <strong>{cats.find((c) => c.id !== toDelete.id)?.name ?? "بدون قسم"}</strong>.</>
          ) : (
            <>سيتم حذف «{toDelete?.name}».</>
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
            `تم حذف «${target.name}»`,
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
    if (!editing.name.trim()) e.name = "اكتب اسم الباقة.";
    const price = Number(editing.price);
    if (!Number.isFinite(price) || price <= 0) e.price = "اكتب سعرًا أكبر من 0.";
    if (editing.items.length === 0) e.items = "أضف منتجًا واحدًا على الأقل.";
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
      isNew ? `تم إنشاء «${bundle.name}»` : `تم حفظ «${bundle.name}»`,
    );
    if (ok) setEditing(null);
  }

  const preview = editing ? bundleDetails({ ...editing, price: Number(editing.price) || 0 }, data.products) : null;

  return (
    <>
      <PageHeader
        title="الباقات"
        description="مجموعات مختارة تُباع بسعر واحد. تظهر في الصفحة الرئيسية وفي قسم الباقات بالمتجر."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setEditing({ id: newId("bdl"), slug: "", name: "", description: "", image: "", items: [], price: "", active: true, note: "اختاري الألوان عبر واتساب" }); }}>
            <Plus className="size-4" /> باقة جديدة
          </button>
        }
      />
      {data.bundles.length === 0 ? (
        <div className="card"><EmptyState icon={<Gift className="size-6" />} title="لا توجد باقات بعد" body="اجمع قطعًا متناسقة واعرضها بسعر أفضل." /></div>
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
                    <Badge tone={b.active ? "green" : "neutral"}>{b.active ? "ظاهرة" : "مخفية"}</Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    <strong>{money(b.price)}</strong> <span className="text-muted">· قيمتها {money(det.value)}</span>
                    {det.savings > 0 && <span className="text-success"> · توفير {money(det.savings)}</span>}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{det.items.map((it) => `${it.quantity}× ${it.product.name}`).join("، ") || "لا توجد منتجات"}</p>
                  {!det.available && b.active && <p className="mt-1 text-xs text-danger">غير متاحة: أحد المنتجات مخفي أو نفد من المخزون.</p>}
                  <div className="mt-3 flex flex-wrap gap-1">
                    <button type="button" className="btn btn-sm btn-outline border-line" onClick={() => { setErrors({}); setEditing({ ...structuredClone(b), price: String(b.price) }); }}><Pencil className="size-3.5" /> تعديل</button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => save((d) => ({ ...d, bundles: d.bundles.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)) }), b.active ? `تم إخفاء «${b.name}»` : `«${b.name}» ظاهرة الآن`)}>
                      {b.active ? "إخفاء" : "نشر"}
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => setToDelete(b)}><Trash2 className="size-3.5" /> حذف</button>
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
          title={data.bundles.some((b) => b.id === editing.id) ? "تعديل الباقة" : "باقة جديدة"}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>إلغاء</button><button type="button" className="btn btn-primary" onClick={submit}>حفظ الباقة</button></>}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <FormField label="الاسم" htmlFor="b-name" error={errors.name}>
                <input id="b-name" className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-invalid={!!errors.name} />
              </FormField>
              <FormField label="الوصف" htmlFor="b-desc">
                <textarea id="b-desc" className="field" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </FormField>
              <FormField label="ملاحظة للعميلة" htmlFor="b-note" hint="مثلًا: طريقة اختيار الألوان أو المقاسات.">
                <input id="b-note" className="field" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              </FormField>
              <FormField label={`سعر الباقة (${data.settings.currency})`} htmlFor="b-price" error={errors.price} hint={preview ? `قيمة القطع منفردة ${money(preview.value)}.` : undefined}>
                <input id="b-price" className="field" inputMode="decimal" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} aria-invalid={!!errors.price} />
              </FormField>
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="ظاهرة" description="عرض هذه الباقة في المتجر" />
            </div>
            <div className="space-y-5">
              <div>
                <p className="label">الصورة</p>
                <SingleImageInput label="رابط صورة الباقة" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
              </div>
              <div>
                <p className="label">منتجات الباقة</p>
                <ul className="space-y-2">
                  {editing.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <select className="field" value={it.productId} onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)) })} aria-label={`المنتج ${i + 1}`}>
                        {data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="field !w-20" inputMode="numeric" value={it.quantity} onChange={(e) => setEditing({ ...editing, items: editing.items.map((x, j) => (j === i ? { ...x, quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) } : x)) })} aria-label={`كمية المنتج ${i + 1}`} />
                      <button type="button" className="icon-btn shrink-0 text-muted hover:text-danger" onClick={() => setEditing({ ...editing, items: editing.items.filter((_, j) => j !== i) })} aria-label={`إزالة المنتج ${i + 1}`}><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn btn-sm btn-outline mt-3 border-line" disabled={!data.products.length} onClick={() => { setEditing({ ...editing, items: [...editing.items, { productId: data.products[0].id, quantity: 1 }] }); setErrors((x) => ({ ...x, items: undefined })); }}>
                  <Plus className="size-4" /> إضافة منتج
                </button>
                {errors.items && <p className="error-text">{errors.items}</p>}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف الباقة؟"
        body={<>سيتم حذف «{toDelete?.name}». المنتجات نفسها لن تتأثر.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          setToDelete(null);
          if (t) save((d) => ({ ...d, bundles: d.bundles.filter((b) => b.id !== t.id) }), `تم حذف «${t.name}»`);
        }}
      />
    </>
  );
}

/* ----------------------------------- Coupons ----------------------------------- */

const TYPE_LABEL: Record<CouponType, string> = { percent: "خصم بالنسبة المئوية", fixed: "خصم بمبلغ ثابت", free_delivery: "توصيل مجاني" };

export function CouponsPage() {
  const { data } = useStore();
  const save = useSave();
  const money = (n: number) => formatMoney(n, data.settings);
  type Draft = Omit<Coupon, "value" | "minSubtotal"> & { value: string; minSubtotal: string };
  const [editing, setEditing] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ code?: string; value?: string; minSubtotal?: string }>({});
  const [toDelete, setToDelete] = useState<Coupon | null>(null);

  const describe = (c: Coupon) =>
    c.type === "percent" ? `خصم ${c.value}%` : c.type === "fixed" ? `خصم ${money(c.value)}` : "توصيل مجاني";

  async function submit() {
    if (!editing) return;
    const e: typeof errors = {};
    const code = editing.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = "استخدم من 3 إلى 20 حرفًا إنجليزيًا أو رقمًا أو شرطة.";
    else if (data.coupons.some((c) => c.code === code && c.id !== editing.id)) e.code = "هذا الكود موجود مسبقًا.";
    const value = Number(editing.value);
    if (editing.type === "percent" && (!Number.isFinite(value) || value <= 0 || value > 100)) e.value = "اكتب نسبة بين 1 و100.";
    if (editing.type === "fixed" && (!Number.isFinite(value) || value <= 0)) e.value = "اكتب مبلغًا أكبر من 0.";
    const min = Number(editing.minSubtotal || 0);
    if (!Number.isFinite(min) || min < 0) e.minSubtotal = "اكتب 0 أو أكثر.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const coupon: Coupon = { ...editing, code, value: editing.type === "free_delivery" ? 0 : value, minSubtotal: min };
    const isNew = !data.coupons.some((c) => c.id === coupon.id);
    const ok = await save((d) => ({ ...d, coupons: isNew ? [coupon, ...d.coupons] : d.coupons.map((c) => (c.id === coupon.id ? coupon : c)) }), isNew ? `تم إنشاء الكود ${code}` : `تم حفظ الكود ${code}`);
    if (ok) setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="أكواد الخصم"
        description="أكواد تكتبها العميلة في السلة أو عند إتمام الطلب. يظهر الخصم في رسالة الطلب على واتساب."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => { setErrors({}); setEditing({ id: newId("cpn"), code: "", description: "", type: "percent", value: "10", minSubtotal: "0", active: true, expiresOn: "" }); }}>
            <Plus className="size-4" /> كود جديد
          </button>
        }
      />
      {data.coupons.length === 0 ? (
        <div className="card"><EmptyState icon={<TicketPercent className="size-6" />} title="لا توجد أكواد خصم" body="أنشئ كودًا للافتتاح أو للعيد أو كعرض ترحيبي." /></div>
      ) : (
        <ul className="card divide-y divide-line">
          {data.coupons.map((c) => {
            const expired = c.expiresOn && new Date(`${c.expiresOn}T23:59:59`) < new Date();
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
                <span className="ltr rounded-lg border border-dashed border-gold px-3 py-1.5 font-mono text-sm tracking-widest text-ink">{c.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{describe(c)}{c.minSubtotal > 0 && <span className="text-muted"> · للطلبات فوق {money(c.minSubtotal)}</span>}</p>
                  <p className="text-xs text-muted">{c.description}{c.expiresOn && ` · ${expired ? "انتهى في" : "ينتهي في"} ${dateFormat(`${c.expiresOn}T00:00:00`)}`}</p>
                </div>
                {data.homepage.promo.couponCode === c.code && <Badge tone="gold">في الرئيسية</Badge>}
                <Badge tone={expired ? "red" : c.active ? "green" : "neutral"}>{expired ? "منتهي" : c.active ? "فعّال" : "موقوف"}</Badge>
                <div className="flex">
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => save((d) => ({ ...d, coupons: d.coupons.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)) }), c.active ? `تم إيقاف ${c.code}` : `تم تفعيل ${c.code}`)}>
                    {c.active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button type="button" className="icon-btn" onClick={() => { setErrors({}); setEditing({ ...c, value: String(c.value), minSubtotal: String(c.minSubtotal) }); }} aria-label={`تعديل ${c.code}`}><Pencil className="size-4" /></button>
                  <button type="button" className="icon-btn text-muted hover:text-danger" onClick={() => setToDelete(c)} aria-label={`حذف ${c.code}`}><Trash2 className="size-4" /></button>
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
          title={data.coupons.some((c) => c.id === editing.id) ? `تعديل ${editing.code}` : "كود خصم جديد"}
          footer={<><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>إلغاء</button><button type="button" className="btn btn-primary" onClick={submit}>حفظ الكود</button></>}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="الكود" htmlFor="cp-code" error={errors.code}>
              <input id="cp-code" className="field ltr font-mono uppercase" dir="ltr" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} aria-invalid={!!errors.code} />
            </FormField>
            <FormField label="النوع" htmlFor="cp-type">
              <select id="cp-type" className="field" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as CouponType })}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormField>
            {editing.type !== "free_delivery" && (
              <FormField label={editing.type === "percent" ? "نسبة الخصم %" : `مبلغ الخصم (${data.settings.currency})`} htmlFor="cp-value" error={errors.value}>
                <input id="cp-value" className="field" inputMode="decimal" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} aria-invalid={!!errors.value} />
              </FormField>
            )}
            <FormField label="الحد الأدنى للطلب" htmlFor="cp-min" error={errors.minSubtotal} hint="اكتب 0 إذا لا يوجد حد أدنى.">
              <input id="cp-min" className="field" inputMode="decimal" value={editing.minSubtotal} onChange={(e) => setEditing({ ...editing, minSubtotal: e.target.value })} aria-invalid={!!errors.minSubtotal} />
            </FormField>
            <FormField label="تاريخ الانتهاء (اختياري)" htmlFor="cp-exp">
              <input id="cp-exp" type="date" className="field" value={editing.expiresOn} onChange={(e) => setEditing({ ...editing, expiresOn: e.target.value })} />
            </FormField>
            <FormField label="الوصف" htmlFor="cp-desc" className="sm:col-span-2">
              <input id="cp-desc" className="field" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </FormField>
            <div className="sm:col-span-2">
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="فعّال" description="يمكن للعميلات استخدام هذا الكود" />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف الكود؟"
        body={<>سيتوقف الكود <strong className="ltr">{toDelete?.code}</strong> عن العمل فورًا.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          setToDelete(null);
          if (t) save((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== t.id) }), `تم حذف ${t.code}`);
        }}
      />
    </>
  );
}
