"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { newId, slugify, uniqueSlug } from "@/lib/commerce";
import type { ColorOption, Product } from "@/lib/types";
import { dateFormat } from "@/lib/arabic";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { ImageListEditor } from "../image-input";
import { ConfirmDialog, FormField, PageHeader, Panel, Toggle } from "../ui";
import { useSave } from "../use-save";
import { useProductActions } from "./products";

const SIZE_PRESETS: Record<string, string[]> = {
  "XS–XL": ["XS", "S", "M", "L", "XL"],
  "S–XXL": ["S", "M", "L", "XL", "XXL"],
  "S/M، L/XL": ["S/M", "L/XL"],
  "52–60": ["52", "54", "56", "58", "60"],
  "مقاس واحد": ["مقاس واحد"],
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

/** Accepts numbers typed with Arabic-Indic digits too (٠١٢٣…). */
const toLatinDigits = (v: string) =>
  v
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace("٫", ".")
    .trim();

type Errors = Partial<
  Record<
    "name" | "slug" | "price" | "salePrice" | "stock" | "categoryId",
    string
  >
>;

function validate(d: Draft, others: Product[]): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "أدخل اسم المنتج.";
  // An empty slug (or an Arabic one) is generated automatically on save.
  const slug = slugify(d.slug);
  if (slug && others.some((p) => p.slug === slug))
    e.slug = "هذا الرابط مستخدم لمنتج آخر.";
  const price = Number(toLatinDigits(d.price));
  if (!d.price.trim() || !Number.isFinite(price) || price <= 0)
    e.price = "أدخل سعرًا أكبر من 0.";
  if (d.salePrice.trim()) {
    const sale = Number(toLatinDigits(d.salePrice));
    if (!Number.isFinite(sale) || sale <= 0)
      e.salePrice = "أدخل سعر تخفيض صحيحًا أو اتركه فارغًا.";
    else if (Number.isFinite(price) && sale >= price)
      e.salePrice = "يجب أن يكون سعر التخفيض أقل من السعر الأصلي.";
  }
  const stock = Number(toLatinDigits(d.stock));
  if (!d.stock.trim() || !Number.isInteger(stock) || stock < 0)
    e.stock = "أدخل عددًا صحيحًا، 0 أو أكثر.";
  if (!d.categoryId) e.categoryId = "اختر القسم.";
  return e;
}

function ColorsEditor({
  colors,
  images,
  onChange,
}: {
  colors: ColorOption[];
  images: string[];
  onChange: (c: ColorOption[]) => void;
}) {
  const patch = (i: number, change: Partial<ColorOption>) =>
    onChange(colors.map((x, j) => (j === i ? { ...x, ...change } : x)));
  return (
    <div className="space-y-3">
      {colors.map((c, i) => (
        <div key={i} className="rounded-xl border border-line bg-paper/60 p-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#cccccc"}
              onChange={(e) => patch(i, { hex: e.target.value })}
              className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-paper p-1"
              aria-label={`درجة ${c.name || `اللون ${i + 1}`}`}
            />
            <input
              className="field"
              value={c.name}
              placeholder="اسم اللون، مثال: زيتي"
              onChange={(e) => patch(i, { name: e.target.value })}
              aria-label={`اسم اللون ${i + 1}`}
            />
            <button
              type="button"
              className="icon-btn shrink-0 text-muted hover:text-danger"
              onClick={() => onChange(colors.filter((_, j) => j !== i))}
              aria-label={`حذف اللون ${c.name || i + 1}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          {images.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted">صورة هذا اللون (اختياري): اضغط على الصورة المناسبة</p>
              <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label={`صورة ${c.name || `اللون ${i + 1}`}`}>
                {images.map((src, k) => {
                  const picked = c.image === src;
                  return (
                    <li key={src + k} className="shrink-0">
                      <button
                        type="button"
                        aria-pressed={picked}
                        aria-label={`الصورة ${k + 1}`}
                        onClick={() => patch(i, { image: picked ? undefined : src })}
                        className={`press relative block h-16 w-13 overflow-hidden rounded-lg ring-offset-2 ring-offset-paper transition ${picked ? "ring-2 ring-gold" : "opacity-60 hover:opacity-100"}`}
                      >
                        <SmartImage src={src} alt="" className="absolute inset-0" />
                        {picked && (
                          <span className="absolute inset-x-0 bottom-0 grid place-items-center bg-ink/70 py-0.5 text-white">
                            <Check className="size-3.5" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">أضف صور المنتج أولًا، ثم اختر صورة لكل لون.</p>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-outline border-line"
        onClick={() => onChange([...colors, { name: "", hex: "#9aaa8f" }])}
      >
        <Plus className="size-4" /> إضافة لون
      </button>
    </div>
  );
}

function SizesEditor({
  sizes,
  onChange,
}: {
  sizes: string[];
  onChange: (s: string[]) => void;
}) {
  const [value, setValue] = useState("");
  const add = () => {
    const parts = value
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length)
      onChange([...sizes, ...parts.filter((p) => !sizes.includes(p))]);
    setValue("");
  };
  return (
    <div className="space-y-3">
      {sizes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => onChange(sizes.filter((x) => x !== s))}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-sm hover:bg-line"
                aria-label={`حذف المقاس ${s}`}
              >
                {s} <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className="field"
          placeholder="أضف مقاسات، افصل بينها بفاصلة"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          aria-label="إضافة مقاسات"
        />
        <button
          type="button"
          className="btn btn-outline border-line"
          onClick={add}
        >
          إضافة
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted">جاهزة:</span>
        {Object.entries(SIZE_PRESETS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(v)}
            className="rounded-full px-2 text-xs font-semibold text-forest underline-offset-2 hover:underline"
          >
            {k}
          </button>
        ))}
        {sizes.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-full px-2 text-xs text-muted hover:underline"
          >
            مسح
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductEditor({ productId }: { productId?: string }) {
  const { data, ready } = useStore();
  const router = useRouter();
  const save = useSave();
  const { duplicate, remove } = useProductActions();
  const existing = productId
    ? data.products.find((p) => p.id === productId)
    : undefined;
  const isNew = !productId;

  const initial = () => {
    const base = existing ?? blankProduct(data.categories[0]?.id ?? "");
    return toDraft(
      base,
      data.bundles
        .filter((b) => b.items.some((it) => it.productId === base.id))
        .map((b) => b.id),
    );
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
        <EmptyState
          title="المنتج غير موجود"
          body="ربما تم حذفه."
          action={
            <Link href="/admin/products" className="btn btn-primary">
              العودة إلى المنتجات
            </Link>
          }
        />
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

  async function submit(e: React.FormEvent, publish?: boolean) {
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
      slug:
        slugify(rest.slug) ||
        uniqueSlug(
          rest.name,
          others.map((p) => p.slug),
        ),
      price: Math.round(Number(toLatinDigits(rest.price)) * 100) / 100,
      salePrice: rest.salePrice.trim()
        ? Math.round(Number(toLatinDigits(rest.salePrice)) * 100) / 100
        : null,
      stock: Number(toLatinDigits(rest.stock)),
      published: publish ?? rest.published,
      details: rest.details
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: rest.colors
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          hex: c.hex,
          // Keep the colour's photo only if it is still one of the product's photos.
          ...(c.image && rest.images.includes(c.image) ? { image: c.image } : {}),
        })),
      sku:
        rest.sku.trim() ||
        `TZ-${Date.now().toString(36).slice(-5).toUpperCase()}`,
      updatedAt: new Date().toISOString(),
    };
    const ok = await save(
      (d) => ({
        ...d,
        products: isNew
          ? [product, ...d.products]
          : d.products.map((p) => (p.id === product.id ? product : p)),
        bundles: d.bundles.map((b) => {
          const has = b.items.some((it) => it.productId === product.id);
          const want = bundleIds.includes(b.id);
          if (has === want) return b;
          return {
            ...b,
            items: want
              ? [...b.items, { productId: product.id, quantity: 1 }]
              : b.items.filter((it) => it.productId !== product.id),
          };
        }),
      }),
      isNew
        ? product.published
          ? `تم نشر «${product.name}» في المتجر`
          : `تم حفظ «${product.name}» كمسودة مخفية`
        : "تم حفظ التغييرات",
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
      <Link
        href="/admin/products"
        className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowRight className="size-4" /> كل المنتجات
      </Link>
      <PageHeader
        title={isNew ? "منتج جديد" : draft.name || "منتج بدون اسم"}
        description={
          isNew
            ? "ابدأ بالصور، ثم الاسم والسعر. يمكنك الحفظ كمسودة أو النشر مباشرة."
            : `آخر تحديث ${dateFormat(draft.updatedAt, { dateStyle: "medium", timeStyle: "short" })}`
        }
        actions={
          !isNew && (
            <>
              <a
                href={`/product/${draft.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline border-line"
              >
                <ExternalLink className="size-4" /> عرض
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
                <Copy className="size-4" /> نسخ
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost text-danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> حذف
              </button>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel
            title="الصور"
            description="رتّب الصور بالأسهم. الصورة الأولى هي الغلاف."
          >
            <ImageListEditor
              images={draft.images}
              onChange={(imgs) => set("images", imgs)}
            />
          </Panel>

          <Panel title="المعلومات الأساسية">
            <div className="space-y-5">
              <FormField
                label="اسم المنتج"
                htmlFor="f-name"
                error={errors.name}
              >
                <input
                  id="f-name"
                  className="field"
                  placeholder="مثال: عباية نور المفتوحة"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  aria-invalid={!!errors.name}
                />
              </FormField>
              <FormField
                label="وصف قصير"
                htmlFor="f-tagline"
                hint="سطر قصير يظهر تحت الاسم."
              >
                <input
                  id="f-tagline"
                  className="field"
                  value={draft.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </FormField>
              <FormField label="الوصف" htmlFor="f-description">
                <textarea
                  id="f-description"
                  className="field"
                  rows={5}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </FormField>
              <FormField
                label="التفاصيل والعناية"
                htmlFor="f-details"
                hint="نقطة في كل سطر: القماش، القياسات، القصّة، العناية."
              >
                <textarea
                  id="f-details"
                  className="field"
                  rows={4}
                  value={draft.details}
                  onChange={(e) => set("details", e.target.value)}
                />
              </FormField>
            </div>
          </Panel>

          <Panel title="السعر والمخزون">
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <FormField
                label={`السعر (${data.settings.currency})`}
                htmlFor="f-price"
                error={errors.price}
              >
                <input
                  id="f-price"
                  className="field"
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value)}
                  aria-invalid={!!errors.price}
                />
              </FormField>
              <FormField
                label="سعر التخفيض"
                htmlFor="f-salePrice"
                error={errors.salePrice}
                hint="اختياري."
              >
                <input
                  id="f-salePrice"
                  className="field"
                  inputMode="decimal"
                  value={draft.salePrice}
                  onChange={(e) => set("salePrice", e.target.value)}
                  aria-invalid={!!errors.salePrice}
                />
              </FormField>
              <FormField
                label="الكمية المتوفرة"
                htmlFor="f-stock"
                error={errors.stock}
                hint={`يظهر «بقي القليل» عند ${data.settings.lowStockThreshold} أو أقل.`}
              >
                <input
                  id="f-stock"
                  className="field"
                  inputMode="numeric"
                  value={draft.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  aria-invalid={!!errors.stock}
                />
              </FormField>
              <FormField
                label="رمز المنتج"
                htmlFor="f-sku"
                hint="اتركه فارغًا ليُنشأ تلقائيًا."
              >
                <input
                  id="f-sku"
                  className="field ltr"
                  value={draft.sku}
                  onChange={(e) => set("sku", e.target.value)}
                />
              </FormField>
            </div>
          </Panel>

          <Panel title="الألوان والمقاسات">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="label">الألوان</p>
                <ColorsEditor
                  colors={draft.colors}
                  images={draft.images}
                  onChange={(c) => set("colors", c)}
                />
              </div>
              <div>
                <p className="label">المقاسات</p>
                <SizesEditor
                  sizes={draft.sizes}
                  onChange={(s) => set("sizes", s)}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="النشر">
            <div className="space-y-5">
              <Toggle
                checked={draft.published}
                onChange={(v) => set("published", v)}
                label="منشور"
                description="ظاهر للزبائن"
              />
              <Toggle
                checked={draft.newArrival}
                onChange={(v) => set("newArrival", v)}
                label="وصل حديثًا"
                description="يظهر في قسم وصل حديثًا"
              />
            </div>
          </Panel>

          <Panel title="التنظيم">
            <div className="space-y-5">
              <FormField
                label="القسم"
                htmlFor="f-categoryId"
                error={errors.categoryId}
              >
                <select
                  id="f-categoryId"
                  className="field"
                  value={draft.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  aria-invalid={!!errors.categoryId}
                >
                  <option value="">اختر…</option>
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <details className="group" open={!!errors.slug}>
                <summary className="cursor-pointer text-sm font-medium text-muted">
                  خيارات متقدمة
                </summary>
                <div className="mt-3">
                  <FormField
                    label="رابط المنتج (بالإنجليزية)"
                    htmlFor="f-slug"
                    error={errors.slug}
                    hint={
                      slugify(draft.slug)
                        ? `/product/${slugify(draft.slug)}`
                        : "اختياري، يُنشأ تلقائيًا. مثال: noor-abaya"
                    }
                  >
                    <input
                      id="f-slug"
                      className="field ltr"
                      placeholder="noor-abaya"
                      value={draft.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        set("slug", e.target.value);
                      }}
                      aria-invalid={!!errors.slug}
                    />
                  </FormField>
                </div>
              </details>
              {category && (
                <p className="text-xs text-muted">
                  يظهر ضمن قسم {category.name} في المتجر.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-16 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-ivory/95 px-4 py-3 shadow-[0_-8px_24px_-18px_rgb(15_18_15/0.35)] backdrop-blur sm:-mx-8 sm:px-8 lg:bottom-0">
        <p className="hidden text-sm text-muted sm:block" role="status">
          {dirty ? "تغييرات غير محفوظة" : "كل التغييرات محفوظة"}
        </p>
        {isNew ? (
          <div className="flex flex-1 gap-2 sm:flex-none">
            <button
              type="submit"
              className="btn btn-outline flex-1 border-line"
              disabled={saving}
            >
              حفظ كمسودة
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              disabled={saving}
              onClick={(e) => submit(e, true)}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ ونشر"}
            </button>
          </div>
        ) : (
          <div className="flex flex-1 justify-end gap-2 sm:flex-none">
            {dirty && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDraft(JSON.parse(baseline))}
              >
                تراجع
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary flex-1 sm:flex-none"
              disabled={saving || !dirty}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="حذف المنتج؟"
        body={
          <>
            سيُحذف <strong>{draft.name}</strong> من المتجر ومن أي مجموعة.
          </>
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          if (existing && (await remove(existing)))
            router.push("/admin/products");
        }}
      />
    </form>
  );
}
