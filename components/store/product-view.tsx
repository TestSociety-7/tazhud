"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Expand, Plus, ShoppingBag, Truck, X } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { discountPercent, effectivePrice, isOnSale, stockState, visibleProducts } from "@/lib/commerce";
import { whatsappLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Price, useMoney } from "@/components/ui/price";
import { QuantityControl } from "@/components/ui/quantity";
import { StockBadge } from "@/components/ui/stock-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { ProductCard } from "./product-card";
import { BackToListButton, useBackToList } from "./return-spot";
import { Sheet } from "@/components/ui/sheet";
import { piecesLabel } from "@/lib/arabic";

function ZoomViewer({ images, start, name, onClose }: { images: string[]; start: number; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    d.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  // The photo moves under the finger (or mouse) while zoomed: no pinching needed.
  function pan(e: React.PointerEvent<HTMLDivElement>) {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--ox", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--oy", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  }

  return (
    <dialog
      ref={ref}
      aria-label={`تكبير صور ${name}`}
      className="zoom-dialog"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <p className="font-latin text-sm text-ivory/70 tabular-nums" dir="ltr">
            {index + 1} / {images.length}
          </p>
          <p className="text-xs text-ivory/60">{zoomed ? "حرّكي إصبعكِ لاستكشاف التفاصيل" : "اضغطي للتكبير"}</p>
          <button type="button" className="btn-glass press grid size-11 place-items-center rounded-full" onClick={onClose} aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </div>
        <div
          ref={stage}
          data-zoomed={zoomed}
          className="zoom-stage relative min-h-0 flex-1 overflow-hidden"
          onPointerDown={(e) => {
            down.current = { x: e.clientX, y: e.clientY };
            pan(e);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || down.current) pan(e);
          }}
          onPointerUp={(e) => {
            const d = down.current;
            down.current = null;
            if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) setZoomed((z) => !z);
          }}
          onPointerCancel={() => (down.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered image URLs on any host */}
          <img src={images[index]} alt={`${name}، صورة ${index + 1}`} className="zoom-img" draggable={false} />
        </div>
        {images.length > 1 && (
          <ul className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {images.map((src, i) => (
              <li key={src + i}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`عرض الصورة ${i + 1}`}
                  aria-current={index === i}
                  className={`press block overflow-hidden rounded-xl transition-opacity ${index === i ? "ring-2 ring-gold-bright" : "opacity-50"}`}
                >
                  <SmartImage src={src} alt="" className="h-16 w-13" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}

function Gallery({ product, focus }: { product: Product; focus?: string }) {
  const images = product.images.length ? product.images : [""];
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [viewer, setViewer] = useState<number | null>(null);

  // Choosing a colour slides to that colour's photo; onScroll then updates the dots.
  useEffect(() => {
    const i = focus ? product.images.indexOf(focus) : -1;
    const el = scroller.current;
    if (i < 0 || !el) return;
    const dir = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: dir * el.clientWidth * i, behavior: "smooth" });
  }, [focus, product.images]);

  // Slides turn in 3D as they are swiped, like pages of silk (transform/opacity only).
  function depth(el: HTMLDivElement) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pos = Math.abs(el.scrollLeft) / el.clientWidth;
    const rtl = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    Array.from(el.children).forEach((slide, i) => {
      const face = slide.firstElementChild as HTMLElement | null;
      if (!face) return;
      const p = Math.max(-1, Math.min(1, i - pos));
      const a = Math.abs(p);
      face.style.transform = a < 0.001 ? "" : `perspective(1000px) rotateY(${(p * rtl * -34).toFixed(2)}deg) scale(${(1 - a * 0.16).toFixed(3)})`;
      face.style.opacity = a < 0.001 ? "" : (1 - a * 0.55).toFixed(3);
    });
  }

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
            <button type="button" onClick={() => goTo(i)} aria-label={`عرض الصورة ${i + 1}`} aria-current={active === i} className={`press block overflow-hidden rounded-2xl ring-offset-2 ring-offset-ivory transition ${active === i ? "ring-2 ring-gold" : "opacity-60 hover:opacity-100"}`}>
              <SmartImage src={src} alt="" className="aspect-[4/5] w-full" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative">
        <span className="moon-glow -inset-4 -z-10" aria-hidden />
        <div
          ref={scroller}
          tabIndex={0}
          role="region"
          aria-label={`صور ${product.name}، اسحبي لرؤية المزيد`}
          className="gal-scroller no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
            if (i !== active) setActive(i);
            depth(el);
          }}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="relative h-full w-full shrink-0 snap-center"
              onPointerMove={(e) => {
                if (e.pointerType !== "mouse") return;
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              onPointerLeave={() => setZoom(null)}
            >
              <div className="gal-face relative bg-sand shadow-[var(--shadow-lift)]">
                <button
                  type="button"
                  className="block h-full w-full cursor-zoom-in"
                  onClick={() => src && setViewer(i)}
                  aria-label={`تكبير الصورة ${i + 1}`}
                  tabIndex={-1}
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
                </button>
                {zoom && active === i && (
                  <div
                    className="pointer-events-none absolute inset-0 hidden bg-no-repeat motion-safe:lg:block"
                    style={{ backgroundImage: `url("${src}")`, backgroundSize: "200%", backgroundPosition: `${zoom.x}% ${zoom.y}%` }}
                    aria-hidden
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between">
          <div className="flex flex-col items-start gap-1.5">
            {product.newArrival && <span className="badge-pearl rounded-full px-3 py-1 text-xs font-bold">وصل حديثًا</span>}
            {isOnSale(product) && (
              <span className="badge-ink font-latin rounded-full px-3 py-1 text-xs font-bold" dir="ltr">−{discountPercent(product)}%</span>
            )}
          </div>
          {product.images.length > 0 && (
            <button
              type="button"
              onClick={() => setViewer(active)}
              className="glass press pointer-events-auto grid size-11 place-items-center rounded-full text-ink"
              aria-label="تكبير الصورة"
            >
              <Expand className="size-4.5" />
            </button>
          )}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center lg:hidden">
            <div className="gal-dots glass-dark">
              {images.map((_, i) => (
                <button key={i} type="button" onClick={() => goTo(i)} aria-label={`عرض الصورة ${i + 1}`} className="-m-2 grid h-8 min-w-6 place-items-center p-2">
                  <span className="gal-dot" data-on={active === i} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {viewer !== null && <ZoomViewer images={product.images} start={viewer} name={product.name} onClose={() => setViewer(null)} />}
    </div>
  );
}

function Disclosure({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="disclose group glass-card overflow-hidden !rounded-3xl" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span className="grid size-8 place-items-center rounded-full bg-sand text-forest">
          <Plus className="disclose-icon size-4" />
        </span>
      </summary>
      <div className="disclose-body px-5 pb-5 text-sm leading-relaxed text-muted">{children}</div>
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
          <div className="leaf skeleton-pearl aspect-[4/5]" />
          <div className="space-y-4 pt-6">
            <div className="skeleton-pearl h-10 w-3/4 rounded-full" />
            <div className="skeleton-pearl h-5 w-1/3 rounded-full" />
            <div className="skeleton-pearl h-24 w-full rounded-3xl" />
          </div>
        </div>
      );
    }
    return (
      <div className="container-x dock-space py-10">
        <EmptyState
          as="h1"
          title="هذه القطعة غير متوفرة"
          body="ربما نفدت الكمية أو أُزيلت من المجموعة."
          action={<Link href="/shop" className="btn btn-primary press">تصفّحي المجموعة</Link>}
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
    <div className="page-wash bar-space overflow-x-clip">
      <div className="container-x flex items-center justify-between pt-4 lg:pt-6">
        <BackToListButton className="glass !border-transparent lg:hidden" />
        <nav aria-label="مسار التنقل" className="hidden text-xs text-muted lg:block">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-ink">الرئيسية</Link></li>
            <li aria-hidden className="text-gold">•</li>
            <li><Link href="/shop" className="hover:text-ink">المتجر</Link></li>
            {category && (<><li aria-hidden className="text-gold">•</li><li><Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></li></>)}
          </ol>
        </nav>
        {category && (
          <Link href={`/shop?category=${category.slug}`} className="glass press inline-flex min-h-11 items-center rounded-full px-4 text-xs font-semibold text-forest lg:hidden">
            {category.name}
          </Link>
        )}
      </div>

      <div className="container-x grid gap-6 pt-4 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-6">
        <Gallery product={product} focus={product.colors.find((c) => c.name === selectedColor)?.image} />

        <div className="rise lg:pt-4">
          <div>
            <h1 className="font-display text-[2.4rem] leading-[1.15] text-ink text-balance sm:text-5xl">{product.name}</h1>
            <p className="mt-1.5 text-muted">{product.tagline}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price price={effectivePrice(product)} compareAt={product.price} size="lg" />
            <StockBadge stock={product.stock} />
          </div>
          {isOnSale(product) && <p className="mt-2 text-xs font-semibold text-success">توفّرين <span className="font-latin">{money(product.price - effectivePrice(product))}</span></p>}

          <div ref={buyRef} className="glass-card mt-6 space-y-6 p-5 sm:p-6">
            {product.colors.length > 0 && (
              <fieldset aria-describedby={errors.color ? "color-err" : undefined}>
                <legend className="mb-3 text-sm">
                  <span className="font-semibold text-ink">اللون</span>
                  {selectedColor && <span key={selectedColor} className="qty-pop inline-block text-muted">: {selectedColor}</span>}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((c) => (
                    <label key={c.name} className="cursor-pointer" title={c.name}>
                      <input type="radio" name="color" value={c.name} checked={selectedColor === c.name} onChange={() => { setColor(c.name); setErrors((e) => ({ ...e, color: undefined })); }} className="peer sr-only" />
                      <span className="swatch">
                        <span className="swatch-bead" style={{ background: c.hex }} />
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
                      <span className="chip min-w-14">{s}</span>
                    </label>
                  ))}
                </div>
                {errors.size && <p id="size-err" className="error-text" role="alert">{errors.size}</p>}
              </fieldset>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <QuantityControl value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
              <button type="button" onClick={add} disabled={soldOut} className="btn btn-primary press min-h-12 flex-1 sm:min-w-56">
                {soldOut ? "نفدت الكمية" : added ? (<span key="added" className="qty-pop inline-flex items-center gap-2"><Check className="size-4" /> تمت الإضافة</span>) : (<><ShoppingBag className="size-4" /> أضيفي إلى السلة</>)}
              </button>
            </div>
            <a href={whatsappLink(data.settings.whatsappNumber, askText)} target="_blank" rel="noopener noreferrer" className="btn btn-outline press w-full border-line bg-paper/60">
              <WhatsappIcon className="size-4 text-[#1f7a4d]" /> {soldOut ? "اسألي عن موعد توفرها" : "اسألي عبر واتساب"}
            </a>
            <p className="flex items-start gap-2.5 rounded-2xl bg-sand/70 p-3 text-xs leading-relaxed text-muted">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper text-forest"><Truck className="size-3.5" /></span>
              <span className="pt-1">{data.settings.deliveryNote}</span>
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <Disclosure title="الوصف" defaultOpen>
              <p className="text-pretty">{product.description}</p>
            </Disclosure>
            {product.details.length > 0 && (
              <Disclosure title="التفاصيل والعناية">
                <ul className="list-disc space-y-1 ps-5 marker:text-gold">
                  {product.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <p className="mt-3 text-xs">رمز المنتج: <span className="ltr font-latin inline-block">{product.sku}</span></p>
              </Disclosure>
            )}
            <Disclosure title="الطلب والتوصيل">
              <p>أضيفي القطع إلى سلتكِ وأتمّي الطلب. سيفتح طلبكِ كرسالة في واتساب، حيث نؤكد معكِ التوفر والتوصيل وطريقة الدفع شخصيًا. لا يتم أي دفع عبر هذا الموقع.</p>
            </Disclosure>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x pt-20" aria-labelledby="related-heading">
          <hr className="pearl-rule mb-10" />
          <h2 id="related-heading" className="season-title font-display mb-7 text-[2rem] text-ink sm:text-4xl">قد يعجبكِ أيضًا</h2>
          <ul className="grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      <div className="buybar glass p-2 ps-4" data-shown={showSticky} aria-hidden={!showSticky}>
        <div className="flex items-center gap-3">
          <SmartImage src={product.images[0]} alt="" className="h-12 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
            <Price price={effectivePrice(product)} compareAt={product.price} size="sm" />
          </div>
          <button type="button" onClick={add} disabled={soldOut} tabIndex={showSticky ? 0 : -1} className="btn btn-primary press min-h-12 rounded-[1.25rem] px-5">
            {soldOut ? "نفدت الكمية" : added ? (<><Check className="size-4" /> تمت</>) : (<><ShoppingBag className="size-4" /> أضيفي</>)}
          </button>
        </div>
      </div>

      <Sheet open={!!justAdded} onClose={() => setJustAdded(null)} side="bottom" title="أُضيفت إلى سلتكِ"
        heading={
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <span className="success-pop grid size-7 place-items-center rounded-full bg-success text-white"><Check className="size-4" /></span>
            أُضيفت إلى سلتكِ
          </h2>
        }
      >
        <div className="p-5">
          <div className="flex items-center gap-4">
            <SmartImage src={product.images[0]} alt="" className="leaf h-24 w-20 shrink-0 bg-sand" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight text-ink">{product.name}</p>
              {justAdded?.options && <p className="mt-1 text-xs text-muted">{justAdded.options}</p>}
              <p className="font-latin mt-1 text-sm text-ink tabular-nums">{justAdded?.quantity} × {money(effectivePrice(product))}</p>
            </div>
          </div>
          <p className="mt-5 flex items-center justify-between rounded-2xl bg-paper/80 px-4 py-3 text-sm shadow-[inset_0_0_0_1px_var(--color-line)]">
            <span className="text-muted">في سلتكِ الآن: {piecesLabel(cart.count)}</span>
            <strong className="font-latin text-ink tabular-nums">{money(cart.subtotal)}</strong>
          </p>
          <div className="mt-5 grid gap-3">
            <button type="button" className="press btn btn-primary min-h-12" onClick={() => { setJustAdded(null); router.push("/checkout"); }}>
              إتمام الطلب <ArrowLeft className="size-4" />
            </button>
            <button type="button" className="press btn btn-outline min-h-12 border-line bg-paper/60" onClick={() => { setJustAdded(null); backToList(); }}>
              متابعة التسوق
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
