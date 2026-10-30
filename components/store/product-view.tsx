"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Share2, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
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
import { useBackToList } from "./return-spot";
import { Sheet } from "@/components/ui/sheet";
import { piecesLabel } from "@/lib/arabic";

function Gallery({ product, focus, children }: { product: Product; focus?: string; children?: React.ReactNode }) {
  const images = product.images.length ? product.images : [""];
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  // Choosing a colour slides to that colour's photo; onScroll then updates the segments.
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

  // Story taps: the reading-start side goes back, the other side goes forward.
  function onTap(e: React.MouseEvent<HTMLDivElement>) {
    if (images.length < 2) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const rtl = getComputedStyle(el).direction === "rtl";
    const forward = rtl ? x < 0.4 : x > 0.6;
    const back = rtl ? x > 0.6 : x < 0.4;
    if (forward) goTo((active + 1) % images.length);
    else if (back) goTo(Math.max(0, active - 1));
  }

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:grid lg:grid-cols-[4.5rem_1fr] lg:gap-4">
      <ul className="hidden flex-col gap-3 lg:flex" aria-label="صور المنتج">
        {images.map((src, i) => (
          <li key={src + i}>
            <button type="button" onClick={() => goTo(i)} aria-label={`عرض الصورة ${i + 1}`} aria-current={active === i} className={`block overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition ${active === i ? "ring-2 ring-gold" : "opacity-60 hover:opacity-100"}`}>
              <SmartImage src={src} alt="" className="aspect-[4/5] w-full" />
            </button>
          </li>
        ))}
      </ul>
      <div className="pv-story">
        <div
          ref={scroller}
          tabIndex={0}
          role="region"
          aria-label={`صور ${product.name}، اسحبي لرؤية المزيد`}
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-sand"
          onClick={onTap}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
            if (i !== active) setActive(i);
          }}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
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
                imgClassName={`transition-transform duration-[1.2s] ease-[var(--ease-soft)] ${active === i ? "scale-100" : "scale-[1.06]"}`}
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
        <span className="pv-story-top" aria-hidden />
        <span className="pv-story-bottom" aria-hidden />
        {images.length > 1 && (
          <div className="absolute inset-x-3 top-2 z-[3] flex gap-1">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} aria-label={`عرض الصورة ${i + 1}`} aria-current={active === i} className="flex h-6 flex-1 items-center">
                <span className="pv-story-seg" data-state={i < active ? "done" : i === active ? "active" : "next"}>
                  <i key={i === active ? `a${active}` : "x"} />
                </span>
              </button>
            ))}
          </div>
        )}
        {isOnSale(product) && (
          <span className="btn-neon absolute top-20 end-4 z-[3] rounded-full px-3 py-1 font-latin text-sm">−{discountPercent(product)}%</span>
        )}
        {children}
      </div>
    </div>
  );
}

function Disclosure({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group panel px-4" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span className="grid size-8 place-items-center rounded-full bg-white/[0.07] transition-transform duration-500 ease-[var(--ease-spring)] group-open:rotate-180">
          <ChevronDown className="size-4" />
        </span>
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
  const addRowRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  // The bottom bar keeps "add to cart" in the thumb zone whenever the in-page button is off screen.
  useEffect(() => {
    const el = addRowRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0 });
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
        <div className="grid gap-6 lg:mx-auto lg:max-w-[84rem] lg:px-10 lg:grid-cols-2 lg:gap-10 lg:py-10" aria-busy="true">
          <div className="pv-story skeleton" />
          <div className="space-y-4 px-4 lg:px-0 lg:pt-6">
            <div className="skeleton h-10 w-3/4 rounded-full" />
            <div className="skeleton h-5 w-1/3 rounded-full" />
            <div className="skeleton h-24 w-full rounded-2xl" />
          </div>
        </div>
      );
    }
    return (
      <div className="container-x py-16 actionbar-pad">
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

  async function share() {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: product!.name, text: product!.tagline, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
      }
    } catch {
      /* closed the share sheet */
    }
  }

  const ask = whatsappLink(data.settings.whatsappNumber, askText);

  return (
    <div className="actionbar-pad">
      <div className="lg:mx-auto lg:grid lg:max-w-[84rem] lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:gap-16 lg:pt-6">
        <div>
          <nav aria-label="مسار التنقل" className="mb-4 hidden text-xs text-muted lg:block">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-ink">الرئيسية</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/shop" className="hover:text-ink">المتجر</Link></li>
              {category && (<><li aria-hidden>/</li><li><Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></li></>)}
            </ol>
          </nav>
          <Gallery product={product} focus={product.colors.find((c) => c.name === selectedColor)?.image}>
            <button type="button" onClick={backToList} className="pop glass-dark absolute top-9 start-3 z-[3] inline-flex min-h-11 items-center gap-1.5 rounded-full ps-3 pe-4 text-sm font-bold text-white lg:hidden">
              <ArrowRight className="size-4" /> رجوع
            </button>
            <div className="absolute end-3 bottom-[calc(9.5rem+1rem)] z-[3] flex flex-col gap-4 lg:bottom-5">
              <button type="button" onClick={share} className="rail-btn">
                <span><Share2 className="size-5" /></span>
                <span>مشاركة</span>
              </button>
              <a href={ask} target="_blank" rel="noopener noreferrer" className="rail-btn" aria-label={soldOut ? "اسألي عن موعد توفرها عبر واتساب" : "اسألي عبر واتساب"}>
                <span className="!bg-[#1f7a4d]/80"><WhatsappIcon className="size-5" /></span>
                <span aria-hidden>اسألي</span>
              </a>
            </div>
          </Gallery>
        </div>

        <div className="pv-sheet px-4 pt-2.5 sm:px-6 lg:px-0 lg:pt-4">
          <span className="grip lg:hidden" aria-hidden />
          <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-0">
            {category && <Link href={`/shop?category=${category.slug}`} className="chip hover:bg-white/20">{category.name}</Link>}
            {product.newArrival && <span className="chip !bg-volt !text-ivory">وصل حديثًا</span>}
          </div>
          <h1 className="reel-title mt-3 text-[2.1rem] text-balance sm:text-5xl">{product.name}</h1>
          <p className="mt-1.5 text-sm text-text/80">{product.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price price={effectivePrice(product)} compareAt={product.price} size="lg" />
            <StockBadge stock={product.stock} />
          </div>
          {isOnSale(product) && <p className="mt-2 inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">توفّرين {money(product.price - effectivePrice(product))}</p>}

          <div ref={buyRef} className="mt-7 space-y-6 scroll-mt-28">
            {product.colors.length > 0 && (
              <fieldset aria-describedby={errors.color ? "color-err" : undefined}>
                <legend className="mb-3 text-sm">
                  <span className="font-bold text-ink">اللون</span>
                  {selectedColor && <span className="text-muted">: {selectedColor}</span>}
                </legend>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c) => (
                    <label key={c.name} className="cursor-pointer" title={c.name}>
                      <input type="radio" name="color" value={c.name} checked={selectedColor === c.name} onChange={() => { setColor(c.name); setErrors((e) => ({ ...e, color: undefined })); }} className="peer sr-only" />
                      <span className="swatch">
                        <span style={{ background: c.hex }} />
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
                <legend className="mb-3 text-sm font-bold text-ink">المقاس</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input type="radio" name="size" value={s} checked={selectedSize === s} onChange={() => { setSize(s); setErrors((e) => ({ ...e, size: undefined })); }} className="peer sr-only" />
                      <span className="opt-chip min-w-14 font-latin">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.size && <p id="size-err" className="error-text" role="alert">{errors.size}</p>}
              </fieldset>
            )}

            <div ref={addRowRef} className="flex flex-wrap items-center gap-3">
              <QuantityControl value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
              <button type="button" onClick={add} disabled={soldOut} className={`btn pop min-h-12 flex-1 text-base sm:min-w-56 ${added ? "btn-primary" : "btn-neon"}`}>
                {soldOut ? "نفدت الكمية" : added ? (<><Check className="size-5" /> تمت الإضافة</>) : (<><ShoppingBag className="size-5" /> أضيفي إلى السلة</>)}
              </button>
            </div>
            <a href={ask} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full border-white/10 bg-white/[0.04]">
              <WhatsappIcon className="size-4 text-success" /> {soldOut ? "اسألي عن موعد توفرها" : "اسألي عبر واتساب"}
            </a>
            <p className="flex items-start gap-2.5 rounded-2xl bg-white/[0.05] p-3.5 text-xs leading-relaxed text-muted">
              <Truck className="mt-0.5 size-4 shrink-0 text-gold-bright" /> {data.settings.deliveryNote}
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <Disclosure title="الوصف" defaultOpen>
              <p className="text-pretty">{product.description}</p>
            </Disclosure>
            {product.details.length > 0 && (
              <Disclosure title="التفاصيل والعناية">
                <ul className="list-disc space-y-1 ps-5 marker:text-gold">
                  {product.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <p className="mt-3 text-xs">رمز المنتج: <span className="ltr inline-block">{product.sku}</span></p>
              </Disclosure>
            )}
            <Disclosure title="الطلب والتوصيل">
              <p>أضيفي القطع إلى سلتكِ وأتمّي الطلب. سيفتح طلبكِ كرسالة في واتساب، حيث نؤكد معكِ التوفر والتوصيل وطريقة الدفع شخصيًا. لا يتم أي دفع عبر هذا الموقع.</p>
            </Disclosure>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x pt-16 lg:pt-24" aria-labelledby="related-heading">
          <h2 id="related-heading" className="season-title reel-title mb-5 text-3xl sm:text-4xl">قد يعجبكِ أيضًا</h2>
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-4 lg:grid-cols-4">
            {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      <div className="action-bar lg:hidden" data-shown={showSticky} aria-hidden={!showSticky}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-muted">{product.name}</p>
            <Price price={effectivePrice(product)} compareAt={product.price} size="md" />
          </div>
          <button type="button" onClick={add} disabled={soldOut} tabIndex={showSticky ? 0 : -1} className="btn btn-neon pop min-h-12 px-6 text-base">
            {soldOut ? "نفدت الكمية" : added ? (<><Check className="size-5" /> تمت الإضافة</>) : (<><ShoppingBag className="size-5" /> أضيفي إلى السلة</>)}
          </button>
        </div>
      </div>

      <Sheet open={!!justAdded} onClose={() => setJustAdded(null)} side="bottom" title="أُضيفت إلى سلتكِ"
        heading={
          <h2 className="flex items-center gap-2.5 text-base font-bold text-ink">
            <span className="success-pop grid size-8 place-items-center rounded-full bg-success text-ivory"><Check className="size-4" strokeWidth={3} /></span>
            أُضيفت إلى سلتكِ
          </h2>
        }
      >
        <div className="p-5">
          <div className="flex items-center gap-4">
            <SmartImage src={product.images[0]} alt="" className="arch h-24 w-20 shrink-0 bg-sand" />
            <div className="min-w-0 flex-1">
              <p className="reel-title text-xl">{product.name}</p>
              {justAdded?.options && <p className="mt-1 text-xs text-muted">{justAdded.options}</p>}
              <p className="mt-1 text-sm font-semibold text-ink tabular-nums">{justAdded?.quantity} × {money(effectivePrice(product))}</p>
            </div>
          </div>
          <p className="mt-5 flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3 text-sm">
            <span className="text-muted">في سلتكِ الآن: {piecesLabel(cart.count)}</span>
            <strong className="font-display text-ink tabular-nums">{money(cart.subtotal)}</strong>
          </p>
          <div className="mt-5 grid gap-3">
            <button type="button" className="pop btn btn-neon min-h-13 text-base" onClick={() => { setJustAdded(null); router.push("/checkout"); }}>
              إتمام الطلب <ArrowLeft className="size-4" />
            </button>
            <button type="button" className="pop btn btn-outline min-h-12 border-white/10" onClick={() => { setJustAdded(null); backToList(); }}>
              متابعة التسوق
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
