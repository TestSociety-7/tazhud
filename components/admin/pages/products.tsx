"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  ListChecks,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import {
  effectivePrice,
  formatMoney,
  isOnSale,
  newId,
  stockState,
  uniqueSlug,
} from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { itemsLabel } from "@/lib/arabic";
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
      name: `${p.name} (نسخة)`,
      slug: uniqueSlug(
        `${p.slug}-copy`,
        data.products.map((x) => x.slug),
      ),
      sku: `${p.sku}-C`,
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    return save(
      (d) => ({ ...d, products: [copy, ...d.products] }),
      `تم إنشاء «${copy.name}» (مخفي حتى النشر)`,
    ).then((ok) => (ok ? copy : null));
  };

  const togglePublish = (p: Product) =>
    save(
      (d) => ({
        ...d,
        products: d.products.map((x) =>
          x.id === p.id
            ? {
                ...x,
                published: !x.published,
                updatedAt: new Date().toISOString(),
              }
            : x,
        ),
      }),
      p.published ? `تم إخفاء «${p.name}» من المتجر` : `«${p.name}» منشور الآن`,
    );

  const remove = (p: Product) => {
    const snapshot = data.products;
    const bundles = data.bundles;
    return save(
      (d) => ({
        ...d,
        products: d.products.filter((x) => x.id !== p.id),
        bundles: d.bundles.map((b) => ({
          ...b,
          items: b.items.filter((it) => it.productId !== p.id),
        })),
      }),
      `تم حذف «${p.name}»`,
      {
        undo: () =>
          void save(
            (d) => ({ ...d, products: snapshot, bundles }),
            "تمت الاستعادة",
          ),
      },
    );
  };

  return { duplicate, togglePublish, remove };
}

type Filter = "all" | "live" | "hidden" | "low" | "out";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "live", label: "ظاهر" },
  { id: "hidden", label: "مخفي" },
  { id: "low", label: "قارب على النفاد" },
  { id: "out", label: "نفد" },
];

function RowMenu({
  product,
  onDelete,
  onSoldOut,
}: {
  product: Product;
  onDelete: () => void;
  onSoldOut: () => void;
}) {
  const { duplicate } = useProductActions();
  const close = (e: React.MouseEvent) =>
    ((e.currentTarget.closest("details") as HTMLDetailsElement).open = false);
  const item =
    "flex min-h-11 w-full items-center gap-2.5 px-3 text-sm hover:bg-sand";
  return (
    <details className="relative">
      <summary
        className="icon-btn list-none [&::-webkit-details-marker]:hidden"
        aria-label={`خيارات ${product.name}`}
      >
        <MoreHorizontal className="size-5" />
      </summary>
      <div className="admin-enter absolute end-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-[var(--shadow-lift)]">
        <Link href={`/admin/products/${product.id}`} className={item}>
          <Pencil className="size-4 text-muted" /> تعديل
        </Link>
        <button
          type="button"
          className={item}
          onClick={(e) => {
            close(e);
            duplicate(product);
          }}
        >
          <Copy className="size-4 text-muted" /> نسخ
        </button>
        {product.stock > 0 && (
          <button
            type="button"
            className={item}
            onClick={(e) => {
              close(e);
              onSoldOut();
            }}
          >
            <PackageX className="size-4 text-muted" /> نفدت الكمية
          </button>
        )}
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className={item}
        >
          <ExternalLink className="size-4 text-muted" /> عرض في المتجر
        </Link>
        <button
          type="button"
          className={`${item} border-t border-line text-danger hover:bg-danger/5`}
          onClick={(e) => {
            close(e);
            onDelete();
          }}
        >
          <Trash2 className="size-4" /> حذف
        </button>
      </div>
    </details>
  );
}

export function ProductsPage() {
  const { data } = useStore();
  const params = useSearchParams();
  const save = useSave();
  const { togglePublish, remove } = useProductActions();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [filter, setFilter] = useState<Filter>(
    params.get("stock") === "low" ? "low" : "all",
  );
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Product[] | null>(null);
  const money = (n: number) => formatMoney(n, data.settings);
  const threshold = data.settings.lowStockThreshold;

  const matches = (p: Product, f: Filter) => {
    const st = stockState(p.stock, threshold);
    if (f === "live") return p.published;
    if (f === "hidden") return !p.published;
    if (f === "low") return st === "low";
    if (f === "out") return st === "out";
    return true;
  };

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.products.filter((p) => {
      if (cat && p.categoryId !== cat) return false;
      if (!matches(p, filter)) return false;
      if (
        term &&
        ![p.name, p.sku, p.tagline].join(" ").toLowerCase().includes(term)
      )
        return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- matches only reads threshold
  }, [data.products, threshold, q, cat, filter]);

  const catName = (id: string) =>
    data.categories.find((c) => c.id === id)?.name ?? "بدون قسم";
  const picked = data.products.filter((p) => selected.has(p.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const bulk = async (change: (p: Product) => Product, message: string) => {
    const ids = new Set(picked.map((p) => p.id));
    const now = new Date().toISOString();
    if (
      await save(
        (d) => ({
          ...d,
          products: d.products.map((p) =>
            ids.has(p.id) ? { ...change(p), updatedAt: now } : p,
          ),
        }),
        message,
      )
    )
      stopSelecting();
  };

  const soldOut = (items: Product[]) => {
    const ids = new Set(items.map((p) => p.id));
    const now = new Date().toISOString();
    return save(
      (d) => ({
        ...d,
        products: d.products.map((p) =>
          ids.has(p.id) ? { ...p, stock: 0, updatedAt: now } : p,
        ),
      }),
      items.length === 1
        ? `«${items[0].name}» نفدت كميته`
        : `${itemsLabel(items.length)} نفدت كميتها`,
    );
  };

  const deleteMany = async (items: Product[]) => {
    if (items.length === 1) return remove(items[0]);
    const ids = new Set(items.map((p) => p.id));
    const snapshot = data.products;
    return save(
      (d) => ({ ...d, products: d.products.filter((p) => !ids.has(p.id)) }),
      `تم حذف ${itemsLabel(items.length)}`,
      {
        undo: () =>
          void save((d) => ({ ...d, products: snapshot }), "تمت الاستعادة"),
      },
    );
  };

  const outCount = data.products.filter((p) => matches(p, "out")).length;

  return (
    <>
      <PageHeader
        title="المنتجات"
        description={`${itemsLabel(data.products.length)}، الظاهر منها في المتجر: ${data.products.filter((p) => p.published).length}.`}
        actions={
          <Link
            href="/admin/products/new"
            className="btn btn-primary max-lg:!hidden"
          >
            <Plus className="size-4" /> إضافة منتج
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            className="field !ps-9"
            placeholder="ابحث عن منتج"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="البحث في المنتجات"
          />
        </div>
        <select
          className="field w-32 sm:w-48"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="تصفية حسب القسم"
        >
          <option value="">كل الأقسام</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <div
          role="group"
          aria-label="تصفية حسب الحالة"
          className="no-scrollbar -ms-4 flex flex-1 gap-2 overflow-x-auto ps-4 lg:ms-0 lg:ps-0"
        >
          {FILTERS.map((f) => {
            const n = data.products.filter((p) => matches(p, f.id)).length;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={`press inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm transition-colors ${active ? "bg-ink text-ivory" : "bg-paper text-muted ring-1 ring-line hover:text-ink"}`}
              >
                {f.label}
                <span className={`text-xs ${active ? "text-gold" : ""}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={selecting}
          onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
          className={`press inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 transition-colors ${selecting ? "bg-gold-soft text-ink ring-gold" : "bg-paper text-forest ring-line"}`}
        >
          <ListChecks className="size-4" /> {selecting ? "إلغاء" : "تحديد"}
        </button>
      </div>

      {!selecting && list.length > 0 && (
        <p className="-mt-2 mb-3 text-xs text-muted lg:hidden">
          اسحب أي منتج إلى اليمين لحذفه أو جعله نافدًا بسرعة.
        </p>
      )}

      {filter === "out" && outCount > 0 && !selecting && (
        <div className="admin-enter mb-4 flex flex-col gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            {itemsLabel(outCount)} نفدت كميتها. يمكنك حذفها كلها مرة واحدة.
          </p>
          <button
            type="button"
            className="press btn btn-sm btn-danger"
            onClick={() =>
              setToDelete(data.products.filter((p) => matches(p, "out")))
            }
          >
            <Trash2 className="size-4" /> حذف كل النافدة ({outCount})
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Package className="size-6" />}
            title="لا توجد منتجات هنا"
            body="غيّر التصفية أو أضف منتجًا جديدًا."
            action={
              <Link href="/admin/products/new" className="btn btn-primary">
                إضافة منتج
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {selecting && (
            <li className="flex items-center justify-between gap-3 bg-sand/40 px-4 py-2.5 text-sm sm:px-5">
              <span className="text-muted">اضغط على المنتجات لتحديدها</span>
              <button
                type="button"
                className="font-semibold text-forest"
                onClick={() =>
                  setSelected(
                    list.every((p) => selected.has(p.id))
                      ? new Set()
                      : new Set(list.map((p) => p.id)),
                  )
                }
              >
                {list.every((p) => selected.has(p.id))
                  ? "إلغاء الكل"
                  : "تحديد الكل"}
              </button>
            </li>
          )}
          {list.map((p) => {
            const st = stockState(p.stock, threshold);
            const isPicked = selected.has(p.id);
            const body = (
              <>
                <SmartImage
                  src={p.images[0]}
                  alt=""
                  className={`h-16 w-13 shrink-0 rounded-lg ${p.published ? "" : "opacity-50"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {p.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span>{catName(p.categoryId)}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {money(effectivePrice(p))}
                      {isOnSale(p) && <s className="ms-1">{money(p.price)}</s>}
                    </span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge
                      tone={
                        st === "out" ? "red" : st === "low" ? "gold" : "neutral"
                      }
                    >
                      {st === "out" ? "نفد" : `المخزون ${p.stock}`}
                    </Badge>
                    {!p.published && <Badge>مخفي</Badge>}
                  </span>
                </span>
              </>
            );
            return (
              <li
                key={p.id}
                className={`transition-colors ${isPicked ? "bg-gold-soft/30" : ""}`}
              >
                {selecting ? (
                  <label className="flex cursor-pointer items-center gap-3 p-3 sm:gap-4 sm:px-5">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-[var(--color-forest)]"
                      checked={isPicked}
                      onChange={() => toggle(p.id)}
                      aria-label={`تحديد ${p.name}`}
                    />
                    {body}
                  </label>
                ) : (
                  <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain lg:overflow-visible">
                    <div className="flex w-full shrink-0 snap-start items-center gap-3 p-3 sm:gap-4 sm:px-5">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
                      >
                        {body}
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePublish(p)}
                        className={`icon-btn shrink-0 ${p.published ? "text-forest" : "text-muted"}`}
                        aria-label={
                          p.published
                            ? `إخفاء ${p.name} من المتجر`
                            : `إظهار ${p.name} في المتجر`
                        }
                        title={p.published ? "ظاهر في المتجر" : "مخفي"}
                      >
                        {p.published ? (
                          <Eye className="size-5" />
                        ) : (
                          <EyeOff className="size-5" />
                        )}
                      </button>
                      <div className="max-lg:hidden">
                        <RowMenu
                          product={p}
                          onDelete={() => setToDelete([p])}
                          onSoldOut={() => soldOut([p])}
                        />
                      </div>
                    </div>
                    {/* Swipe the row to reveal quick actions on phones. */}
                    <div className="flex shrink-0 snap-end lg:hidden">
                      {p.stock > 0 && (
                        <button
                          type="button"
                          onClick={() => soldOut([p])}
                          className="flex w-20 flex-col items-center justify-center gap-1 bg-gold-soft text-xs font-semibold text-ink"
                        >
                          <PackageX className="size-5" /> نفدت
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="flex w-20 flex-col items-center justify-center gap-1 bg-danger text-xs font-semibold text-white"
                      >
                        <Trash2 className="size-5" /> حذف
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {selecting && (
        <div className="admin-enter on-dark fixed inset-x-3 bottom-[calc(5.7rem+env(safe-area-inset-bottom))] z-30 rounded-[1.6rem] bg-ink/90 p-3 text-ivory shadow-[var(--shadow-lift),inset_0_0_0_1px_rgb(255_255_255/0.1)] backdrop-blur-xl lg:inset-x-auto lg:bottom-6 lg:start-[calc(17rem+2rem)] lg:end-8">
          <p className="mb-2 px-1 text-xs text-ivory/70">
            {picked.length
              ? `${itemsLabel(picked.length)} محدد`
              : "لم تحدد شيئًا بعد"}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "إخفاء",
                icon: EyeOff,
                run: () =>
                  bulk(
                    (p) => ({ ...p, published: false }),
                    `تم إخفاء ${itemsLabel(picked.length)}`,
                  ),
              },
              {
                label: "إظهار",
                icon: Eye,
                run: () =>
                  bulk(
                    (p) => ({ ...p, published: true }),
                    `${itemsLabel(picked.length)} ظاهرة الآن`,
                  ),
              },
              {
                label: "نفدت",
                icon: PackageX,
                run: () =>
                  bulk(
                    (p) => ({ ...p, stock: 0 }),
                    `${itemsLabel(picked.length)} نفدت كميتها`,
                  ),
              },
              {
                label: "حذف",
                icon: Trash2,
                run: () => setToDelete(picked),
                danger: true,
              },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                disabled={!picked.length}
                onClick={a.run}
                className={`press flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold disabled:opacity-40 ${a.danger ? "bg-danger text-white" : "bg-white/10 hover:bg-white/15"}`}
              >
                <a.icon className="size-4" /> {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={
          toDelete && toDelete.length > 1
            ? `حذف ${itemsLabel(toDelete.length)}؟`
            : "حذف المنتج؟"
        }
        body={
          toDelete && toDelete.length > 1 ? (
            <>ستُحذف هذه المنتجات من المتجر. يمكنك التراجع مباشرة بعد الحذف.</>
          ) : (
            <>
              سيُحذف <strong>{toDelete?.[0]?.name}</strong> من المتجر. يمكنك
              التراجع مباشرة بعد الحذف.
            </>
          )
        }
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          const items = toDelete ?? [];
          setToDelete(null);
          await deleteMany(items);
          stopSelecting();
        }}
      />
    </>
  );
}
