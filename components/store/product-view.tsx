"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { discountPercent, effectivePrice, isOnSale, stockState, visibleProducts } from "@/lib/commerce";
import { whatsappLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Price, PriceTag, useMoney } from "@/components/ui/price";
import { QuantityControl } from "@/components/ui/quantity";
import { StockBadge } from "@/components/ui/stock-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { ProductCard } from "./product-card";
import { BackToListButton, useBackToList } from "./return-spot";
import { Sheet } from "@/components/ui/sheet";
import { piecesLabel } from "@/lib/arabic";

function Gallery({ product, focus }: { product: Product; focus?: string }) {
  const images = product.images.length ? product.images : [""];
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  // Choosing a colour slides to that colour's photo; onScroll then updates the dots.
  useEffect(() => {
    const i = focus ? product.images.indexOf(focus) : -1;
    const el = scroller.current;
    if (i < 0 || !el) return;
    const dir = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: dir * el.clientWidth * i, behavior: "smooth" });
  }, [focus, product.images]);

  function goTo(i: number) {
    setActive(i);
    const el = scroller.current;
    // In right-to-left layouts scrollLeft runs from 0 down to negative values.
    const dir = el && getComputedStyle(el).direction === "rtl" ? -1 : 1;
    if (el) el.scrollTo({ left: dir * el.clientWidth * i, behavior: "smooth" });
  }

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:grid lg:grid-cols-[4.5rem_1fr] lg:gap-4">
      <ul className="hidden flex-col gap-3 lg:flex" aria-label="صور المنتج">
        {images.map((src, i) => (
          <li key={src + i}>
            <button type="button" onClick={() => goTo(i)} aria-label={`عرض الصورة ${i + 1}`} aria-current={active === i} className={`block overflow-hidden rounded-t-lg rounded-b-sm outline-offset-3 transition duration-300 ${active === i ? "outline-2 outline-dashed outline-gold" : "opacity-60 hover:opacity-100"}`}>
              <SmartImage src={src} alt="" className="aspect-[4/5] w-full" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative">
        <div
          ref={scroller}
          tabIndex={0}
          role="region"
          aria-label={`صور ${product.name}، اسحبي لرؤية المزيد`}
          className="no-scrollbar pinked flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto rounded-t-[1.4rem] bg-sand [--z:8px]"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
            if (i !== active) setActive(i);
          }}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="relative h-full w-full shrink-0 snap-center overflow-hidden"
              onPointerMove={(e) => {
                if (e.pointerType !== "mouse") return;
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              onPointerLeave={() => setZoom(null)}
            >
              <SmartImage
                src={src}
                alt={i === 0 ? product.name : `${product.name}، صورة ${i + 1}`}
                priority={i === 0}
                unveil={i === 0}
                className="h-full w-full"
                imgClassName="transition-transform duration-300 ease-out"
                fallbackLabel={product.name}
              />
              {zoom && active === i && (
                <div
                  className="pointer-events-none absolute inset-0 hidden bg-no-repeat motion-safe:lg:block"
                  style={{ backgroundImage: `url("${src}")`, backgroundSize: "200%", backgroundPosition: `${zoom.x}% ${zoom.y}%` }}
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
        {isOnSale(product) && (
          <span className="woven-label font-latin absolute top-5 start-0 rounded-s-none !text-sm"><bdi dir="ltr">−{discountPercent(product)}%</bdi></span>
        )}
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-0.5 lg:hidden">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} aria-label={`عرض الصورة ${i + 1}`} className="grid size-6 place-items-center">
                <span className={`block h-0.5 rounded-full transition-all duration-500 ease-[var(--ease-soft)] ${active === i ? "w-5 bg-forest" : "w-2.5 bg-forest/25"}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Disclosure({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-dashed border-forest/20" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 text-forest transition-transform duration-500 ease-[var(--ease-soft)] group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export function ProductView({ slug }: { slug: string }) {
  const { data, ready } = useStore();
  const cart = useCart();
  const { addProduct } = cart;
  const money = useMoney();
  const product = data.products.find((p) => p.slug === slug && p.published);

  const [color, setColor] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState<{ color?: string; size?: string }>({});
  const [added, setAdded] = useState(false);
  const [justAdded, setJustAdded] = useState<{ options: string; quantity: number } | null>(null);
  const backToList = useBackToList();
  const router = useRouter();
  const [lastSlug, setLastSlug] = useState(slug);
  if (slug !== lastSlug) {
    setLastSlug(slug);
    setColor(undefined);
    setSize(undefined);
    setQty(1);
    setErrors({});
  }

  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(t);
  }, [added]);

  if (!product) {
    if (!ready) {
      return (
        <div className="container-x grid gap-10 py-10 lg:grid-cols-2" aria-busy="true">
          <div className="pinked skeleton aspect-[4/5] rounded-t-[1.4rem]" />
          <div className="space-y-4 pt-6">
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </div>
      );
    }
    return (
      <div className="container-x py-16">
        <EmptyState
          as="h1"
          title="هذه القطعة غير متوفرة"
          body="ربما نفدت الكمية أو أُزيلت من المجموعة."
          action={<Link href="/shop" className="btn btn-primary">تصفّحي المجموعة</Link>}
        />
      </div>
    );
  }

  const category = data.categories.find((c) => c.id === product.categoryId);
  const state = stockState(product.stock, data.settings.lowStockThreshold);
  const soldOut = state === "out";
  const selectedColor = color ?? (product.colors.length === 1 ? product.colors[0].name : undefined);
  const selectedSize = size ?? (product.sizes.length === 1 ? product.sizes[0] : undefined);
  const related = visibleProducts(data)
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .concat(visibleProducts(data).filter((p) => p.id !== product.id && p.categoryId !== product.categoryId && p.featured))
    .slice(0, 4);

  function validate() {
    const e: typeof errors = {};
    if (product!.colors.length > 1 && !selectedColor) e.color = "يرجى اختيار اللون.";
    if (product!.sizes.length > 1 && !selectedSize) e.size = "يرجى اختيار المقاس.";
    setErrors(e);
    if (e.color || e.size) {
      buyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function add() {
    if (soldOut || !validate()) return;
    addProduct(product!, { color: selectedColor, size: selectedSize, quantity: qty });
    setAdded(true);
    setJustAdded({ options: [selectedColor, selectedSize].filter(Boolean).join(" · "), quantity: qty });
  }

  const askText = `السلام عليكم ${data.settings.storeName}، أنا مهتمة بـ ${product.name}${selectedColor ? ` باللون ${selectedColor}` : ""}${selectedSize ? `، مقاس ${selectedSize}` : ""}. هل هي متوفرة؟`;

  return (
    <div className="pb-28 lg:pb-0">
      <div className="container-x pt-4 lg:pt-6">
        <BackToListButton className="lg:hidden" />
        <nav aria-label="مسار التنقل" className="hidden text-xs text-muted lg:block">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-ink">الرئيسية</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/shop" className="hover:text-ink">المتجر</Link></li>
            {category && (<><li aria-hidden>/</li><li><Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></li></>)}
          </ol>
        </nav>
      </div>

      <div className="container-x grid gap-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Gallery product={product} focus={product.colors.find((c) => c.name === selectedColor)?.image} />

        <div className="lg:pt-4">
          {product.newArrival && <p className="woven-label mb-3">وصل حديثًا</p>}
          {category && <p className="text-sm text-muted">{category.name}</p>}
          <h1 className="font-display mt-1 text-4xl leading-[1.25] text-ink sm:text-5xl">{product.name}</h1>
          <p className="mt-2 text-muted">{product.tagline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <PriceTag price={effectivePrice(product)} compareAt={product.price} size="lg" dark className="-rotate-2" />
            <StockBadge stock={product.stock} />
          </div>
          {isOnSale(product) && <p className="mt-2 text-xs font-semibold text-success">توفّرين <span className="font-latin">{money(product.price - effectivePrice(product))}</span></p>}

          <span className="stitch my-8" aria-hidden />

          <div ref={buyRef} className="space-y-6">
            {product.colors.length > 0 && (
              <fieldset aria-describedby={errors.color ? "color-err" : undefined}>
                <legend className="mb-3 text-sm">
                  <span className="font-semibold text-ink">اللون</span>
                  {selectedColor && <span className="text-muted">: {selectedColor}</span>}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <label key={c.name} className="cursor-pointer" title={c.name}>
                      <input type="radio" name="color" value={c.name} checked={selectedColor === c.name} onChange={() => { setColor(c.name); setErrors((e) => ({ ...e, color: undefined })); }} className="peer sr-only" />
                      <span className="relative grid size-12 place-items-center rounded-md outline-1.5 outline-offset-0 outline-transparent transition-[outline-color,transform] duration-300 ease-[var(--ease-soft)] peer-checked:outline-dashed peer-checked:outline-forest peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-forest hover:-translate-y-0.5 peer-checked:[&>i]:scale-100 peer-checked:[&>i]:opacity-100">
                        <span className="fabric pinked-all size-10 [--z:3px]" style={{ backgroundColor: c.hex }} />
                        <i className="pin-head absolute -top-1 end-0 scale-50 opacity-0 transition duration-300 ease-[var(--ease-soft)]" aria-hidden />
                      </span>
                      <span className="sr-only">{c.name}</span>
                    </label>
                  ))}
                </div>
                {errors.color && <p id="color-err" className="error-text" role="alert">{errors.color}</p>}
              </fieldset>
            )}

            {product.sizes.length > 0 && (
              <fieldset aria-describedby={errors.size ? "size-err" : undefined}>
                <legend className="mb-3 text-sm font-semibold text-ink">المقاس</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input type="radio" name="size" value={s} checked={selectedSize === s} onChange={() => { setSize(s); setErrors((e) => ({ ...e, size: undefined })); }} className="peer sr-only" />
                      <span className="chip min-w-14">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.size && <p id="size-err" className="error-text" role="alert">{errors.size}</p>}
              </fieldset>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <QuantityControl value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
              <button type="button" onClick={add} disabled={soldOut} className="btn btn-primary min-h-12 flex-1 sm:min-w-56">
                {soldOut ? "نفدت الكمية" : added ? (<><Check className="size-4" /> تمت الإضافة</>) : (<><ShoppingBag className="size-4" /> أضيفي إلى السلة</>)}
              </button>
            </div>
            <a href={whatsappLink(data.settings.whatsappNumber, askText)} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full border-line">
              <WhatsappIcon className="size-4 text-[#1f7a4d]" /> {soldOut ? "اسألي عن موعد توفرها" : "اسألي عبر واتساب"}
            </a>
            <p className="stitch-box-soft flex items-start gap-2 rounded-xl bg-sand/60 p-4 text-xs leading-relaxed text-muted">
              <Truck className="mt-0.5 size-4 shrink-0 text-forest" /> {data.settings.deliveryNote}
            </p>
          </div>

          <div className="mt-10 border-t border-dashed border-forest/20">
            <Disclosure title="الوصف" defaultOpen>
              <p className="text-pretty">{product.description}</p>
            </Disclosure>
            {product.details.length > 0 && (
              <Disclosure title="التفاصيل والعناية">
                <ul className="list-disc space-y-1 ps-5">
                  {product.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <p className="mt-3 text-xs">رمز المنتج: <span className="font-latin ltr inline-block text-ink">{product.sku}</span></p>
              </Disclosure>
            )}
            <Disclosure title="الطلب والتوصيل">
              <p>أضيفي القطع إلى سلتكِ وأتمّي الطلب. سيفتح طلبكِ كرسالة في واتساب، حيث نؤكد معكِ التوفر والتوصيل وطريقة الدفع شخصيًا. لا يتم أي دفع عبر هذا الموقع.</p>
            </Disclosure>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x pt-16 sm:pt-24" aria-labelledby="related-heading">
          <span className="stitch-mulberry stitch mb-10" aria-hidden />
          <h2 id="related-heading" className="season-title font-display mb-8 text-3xl text-ink sm:text-4xl">قد يعجبكِ أيضًا</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      <div className={`fixed inset-x-0 bottom-0 z-30 bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-18px_rgb(42_15_29/0.45)] backdrop-blur-md lg:hidden ${showSticky ? "translate-y-0 transition-transform duration-500 ease-[var(--ease-soft)]" : "translate-y-full transition-transform duration-300 ease-in"}`} aria-hidden={!showSticky}>
        <span className="stitch absolute inset-x-4 top-1" aria-hidden />
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
            <Price price={effectivePrice(product)} compareAt={product.price} size="sm" />
          </div>
          <button type="button" onClick={add} disabled={soldOut} tabIndex={showSticky ? 0 : -1} className="btn btn-primary min-h-12">
            {soldOut ? "نفدت الكمية" : "أضيفي إلى السلة"}
          </button>
        </div>
      </div>

      <Sheet open={!!justAdded} onClose={() => setJustAdded(null)} side="bottom" title="أُضيفت إلى سلتكِ"
        heading={
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <span className="grid size-7 place-items-center rounded-full bg-success text-white"><Check className="size-4" /></span>
            أُضيفت إلى سلتكِ
          </h2>
        }
      >
        <div className="p-5">
          <div className="flex items-center gap-4">
            <SmartImage src={product.images[0]} alt="" className="pinked h-24 w-20 shrink-0 rounded-t-lg bg-sand [--z:4px]" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight text-ink">{product.name}</p>
              {justAdded?.options && <p className="mt-1 text-xs text-muted">{justAdded.options}</p>}
              <p className="font-latin mt-1 text-sm text-ink tabular-nums">{justAdded?.quantity} × {money(effectivePrice(product))}</p>
            </div>
          </div>
          <p className="stitch-box-soft mt-5 flex items-center justify-between rounded-xl bg-sand/60 px-4 py-3.5 text-sm">
            <span className="text-muted">في سلتكِ الآن: {piecesLabel(cart.count)}</span>
            <strong className="font-latin text-ink tabular-nums">{money(cart.subtotal)}</strong>
          </p>
          <div className="mt-5 grid gap-3">
            <button type="button" className="press btn btn-primary min-h-12" onClick={() => { setJustAdded(null); router.push("/checkout"); }}>
              إتمام الطلب <ArrowLeft className="size-4" />
            </button>
            <button type="button" className="press btn btn-outline min-h-12 border-line" onClick={() => { setJustAdded(null); backToList(); }}>
              متابعة التسوق
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
