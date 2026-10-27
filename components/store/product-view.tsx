"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ShoppingBag, Truck } from "lucide-react";
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
import { OrnamentDivider } from "@/components/ui/mandala";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { ProductCard } from "./product-card";

function Gallery({ product }: { product: Product }) {
  const images = product.images.length ? product.images : [""];
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  function goTo(i: number) {
    setActive(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  }

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:grid lg:grid-cols-[4.5rem_1fr] lg:gap-4">
      <ul className="hidden flex-col gap-3 lg:flex" aria-label="Product images">
        {images.map((src, i) => (
          <li key={src + i}>
            <button type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} aria-current={active === i} className={`block overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition ${active === i ? "ring-2 ring-gold" : "opacity-70 hover:opacity-100"}`}>
              <SmartImage src={src} alt="" className="aspect-[4/5] w-full" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative">
        <div
          ref={scroller}
          className="no-scrollbar arch flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto bg-sand"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
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
                alt={i === 0 ? product.name : `${product.name}, view ${i + 1}`}
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
          <span className="absolute top-[14%] left-4 rounded-full bg-ink px-3 py-1 text-xs font-bold tracking-widest text-gold-soft">−{discountPercent(product)}%</span>
        )}
        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 lg:hidden">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} className="grid size-6 place-items-center">
                <span className={`block h-1.5 rounded-full transition-all ${active === i ? "w-6 bg-forest" : "w-1.5 bg-line"}`} />
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
    <details className="group border-b border-line" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export function ProductView({ slug }: { slug: string }) {
  const { data, ready } = useStore();
  const { addProduct, setDrawerOpen } = useCart();
  const money = useMoney();
  const product = data.products.find((p) => p.slug === slug && p.published);

  const [color, setColor] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState<{ color?: string; size?: string }>({});
  const [added, setAdded] = useState(false);
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
          <div className="arch skeleton aspect-[4/5]" />
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
          title="This piece isn't available"
          body="It may have sold out or been removed from the collection."
          action={<Link href="/shop" className="btn btn-primary">Browse the collection</Link>}
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
    if (product!.colors.length > 1 && !selectedColor) e.color = "Please choose a colour.";
    if (product!.sizes.length > 1 && !selectedSize) e.size = "Please choose a size.";
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
    toast.success(`${product!.name} added to your bag`, {
      description: [selectedColor, selectedSize].filter(Boolean).join(" · ") || undefined,
      action: { label: "View bag", onClick: () => setDrawerOpen(true) },
    });
  }

  const askText = `Assalamu alaikum ${data.settings.storeName}, I'm interested in the ${product.name}${selectedColor ? ` in ${selectedColor}` : ""}${selectedSize ? `, size ${selectedSize}` : ""}. Is it available?`;

  return (
    <div className="pb-28 lg:pb-0">
      <div className="container-x pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
            {category && (<><li aria-hidden>/</li><li><Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></li></>)}
          </ol>
        </nav>
      </div>

      <div className="container-x grid gap-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Gallery product={product} />

        <div className="lg:pt-4">
          {product.newArrival && <p className="eyebrow text-gold">New arrival</p>}
          <h1 className="font-display mt-2 text-4xl leading-[1.05] text-ink sm:text-5xl">{product.name}</h1>
          <p className="mt-2 text-muted">{product.tagline}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Price price={effectivePrice(product)} compareAt={product.price} size="lg" />
            <StockBadge stock={product.stock} />
          </div>
          {isOnSale(product) && <p className="mt-1 text-xs text-success">You save {money(product.price - effectivePrice(product))}</p>}

          <OrnamentDivider className="my-7" />

          <div ref={buyRef} className="space-y-6">
            {product.colors.length > 0 && (
              <fieldset aria-describedby={errors.color ? "color-err" : undefined}>
                <legend className="mb-3 text-sm">
                  <span className="font-semibold text-ink">Colour</span>
                  {selectedColor && <span className="text-muted">: {selectedColor}</span>}
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => (
                    <label key={c.name} className="cursor-pointer" title={c.name}>
                      <input type="radio" name="color" value={c.name} checked={selectedColor === c.name} onChange={() => { setColor(c.name); setErrors((e) => ({ ...e, color: undefined })); }} className="peer sr-only" />
                      <span className="grid size-11 place-items-center rounded-full border border-line transition-all peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-gold peer-checked:ring-offset-2 peer-checked:ring-offset-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-gold">
                        <span className="size-8 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
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
                <legend className="mb-3 text-sm font-semibold text-ink">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input type="radio" name="size" value={s} checked={selectedSize === s} onChange={() => { setSize(s); setErrors((e) => ({ ...e, size: undefined })); }} className="peer sr-only" />
                      <span className="inline-flex min-h-11 min-w-14 items-center justify-center rounded-full border border-line px-4 text-sm transition-colors peer-checked:border-forest peer-checked:bg-forest peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold hover:border-ink">
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
                {soldOut ? "Sold out" : added ? (<><Check className="size-4" /> Added</>) : (<><ShoppingBag className="size-4" /> Add to bag</>)}
              </button>
            </div>
            <a href={whatsappLink(data.settings.whatsappNumber, askText)} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full border-line">
              <WhatsappIcon className="size-4 text-[#1f7a4d]" /> {soldOut ? "Ask about a restock" : "Ask a question on WhatsApp"}
            </a>
            <p className="flex items-start gap-2 rounded-xl bg-sand/70 p-3 text-xs leading-relaxed text-muted">
              <Truck className="mt-0.5 size-4 shrink-0 text-forest" /> {data.settings.deliveryNote}
            </p>
          </div>

          <div className="mt-8 border-t border-line">
            <Disclosure title="Description" defaultOpen>
              <p className="text-pretty">{product.description}</p>
            </Disclosure>
            {product.details.length > 0 && (
              <Disclosure title="Details & care">
                <ul className="list-disc space-y-1 pl-5">
                  {product.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <p className="mt-3 text-xs">SKU: {product.sku}</p>
              </Disclosure>
            )}
            <Disclosure title="Ordering & delivery">
              <p>Add pieces to your bag and check out. Your order opens as a message in WhatsApp, where we confirm availability, delivery and payment with you personally. No payment is taken on this website.</p>
            </Disclosure>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x pt-24" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display mb-8 text-4xl text-ink">You may also like</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 p-3 backdrop-blur-md transition-transform duration-500 lg:hidden ${showSticky ? "translate-y-0" : "translate-y-full"}`} aria-hidden={!showSticky}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
            <Price price={effectivePrice(product)} compareAt={product.price} size="sm" />
          </div>
          <button type="button" onClick={add} disabled={soldOut} tabIndex={showSticky ? 0 : -1} className="btn btn-primary">
            {soldOut ? "Sold out" : "Add to bag"}
          </button>
        </div>
      </div>
    </div>
  );
}
