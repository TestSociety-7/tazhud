"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { discountPercent, effectivePrice, isOnSale, stockState } from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { useMoney } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";

/** Two taps closer together than this count as a double tap. */
const DOUBLE_TAP_MS = 280;

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { data } = useStore();
  const { addProduct } = useCart();
  const router = useRouter();
  const money = useMoney();
  const cardRef = useRef<HTMLDivElement>(null);
  const state = stockState(product.stock, data.settings.lowStockThreshold);
  const simple = product.colors.length <= 1 && product.sizes.length <= 1;
  const quick = simple && state !== "out";
  const href = `/product/${product.slug}`;
  const onSale = isOnSale(product);

  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [done, setDone] = useState(0);
  const [flash, setFlash] = useState(false);
  const tap = useRef<{ at: number; timer: number; touch: boolean }>({ at: 0, timer: 0, touch: false });
  useEffect(() => () => window.clearTimeout(tap.current.timer), []);
  useEffect(() => {
    if (!done) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- brief tick after each add
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1400);
    return () => window.clearTimeout(t);
  }, [done]);

  // Gentle 3D tilt for mouse users; skipped for touch and reduced motion.
  function onMove(e: React.PointerEvent) {
    const el = cardRef.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
  }
  function onLeave() {
    if (cardRef.current) cardRef.current.style.transform = "";
  }

  function quickAdd() {
    if (!simple) return;
    addProduct(product, { color: product.colors[0]?.name, size: product.sizes[0], quantity: 1 });
    setDone((n) => n + 1);
    toast.success(`أُضيفت ${product.name} إلى السلة`, {
      action: { label: "إتمام الطلب", onClick: () => router.push("/checkout") },
    });
  }

  // Double-tap the photo (touch) to add a simple piece, like a "like" on a reel.
  // A single tap still opens the product, just after the double-tap window.
  function onPhotoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!quick || !tap.current.touch || e.detail === 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const now = performance.now();
    if (now - tap.current.at < DOUBLE_TAP_MS) {
      window.clearTimeout(tap.current.timer);
      tap.current.at = 0;
      const r = e.currentTarget.getBoundingClientRect();
      const id = now;
      setHearts((h) => [...h, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
      window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 950);
      quickAdd();
      return;
    }
    tap.current.at = now;
    tap.current.timer = window.setTimeout(() => {
      tap.current.at = 0;
      router.push(href);
    }, DOUBLE_TAP_MS);
  }

  return (
    <article className="group relative">
      <div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative transition-transform duration-500 ease-[var(--ease-soft)] will-change-transform"
      >
        <Link
          href={href}
          className="press block touch-manipulation select-none [-webkit-touch-callout:none]"
          aria-label={product.name}
          onPointerDown={(e) => {
            tap.current.touch = e.pointerType !== "mouse";
          }}
          onClick={onPhotoClick}
        >
          <div className="arch relative aspect-[3/4] overflow-hidden bg-sand shadow-[var(--shadow-soft)] ring-1 ring-white/[0.06] transition-shadow duration-500 group-hover:shadow-[var(--shadow-lift)]">
            <SmartImage
              src={product.images[0]}
              alt={product.name}
              priority={priority}
              className="absolute inset-0"
              imgClassName="transition-transform duration-[1.4s] ease-[var(--ease-soft)] group-hover:scale-[1.05]"
              fallbackLabel={product.name}
            />
            {product.images[1] && (
              <SmartImage
                src={product.images[1]}
                alt=""
                className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [@media(hover:none)]:hidden"
              />
            )}
            <span className="card-shade" aria-hidden />
            <div className="absolute top-2.5 start-2.5 flex flex-col items-start gap-1.5">
              {product.newArrival && <span className="rounded-full bg-volt px-2.5 py-0.5 text-[0.68rem] font-extrabold text-ivory">جديد</span>}
              {onSale && <span className="btn-neon rounded-full px-2.5 py-0.5 font-latin text-[0.68rem]">−{discountPercent(product)}%</span>}
            </div>
            <span className="price-chip absolute bottom-2.5 start-2.5 tabular-nums">
              {onSale && <span className="sr-only">سعر التخفيض </span>}
              <span className={onSale ? "text-gold-soft" : ""}>{money(effectivePrice(product))}</span>
              {onSale && (
                <s className="text-[0.68rem] font-medium text-white/60">
                  <span className="sr-only">السعر الأصلي </span>
                  {money(product.price)}
                </s>
              )}
            </span>
            {state === "out" && (
              <div className="glass-dark absolute inset-x-2.5 top-1/2 -translate-y-1/2 rounded-full py-2 text-center text-xs font-bold text-ink">
                نفدت الكمية
              </div>
            )}
            {hearts.map((h) => (
              <Heart key={h.id} className="heart-burst size-20 fill-current" style={{ left: h.x, top: h.y }} aria-hidden />
            ))}
          </div>
        </Link>
        {state !== "out" &&
          (simple ? (
            <button
              type="button"
              onClick={quickAdd}
              className="add-fab absolute end-2.5 bottom-2.5"
              aria-label={`أضيفي ${product.name} إلى السلة`}
            >
              <span key={done} className={done ? "bump" : ""} aria-hidden>
                {flash ? <Check className="size-5" strokeWidth={2.6} /> : <Plus className="size-5" strokeWidth={2.6} />}
              </span>
            </button>
          ) : (
            <Link
              href={href}
              className="glass-dark absolute end-2.5 bottom-2.5 hidden rounded-full px-3.5 py-2 text-xs font-bold text-ink transition-all duration-300 hover:bg-white/20 lg:inline-flex lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
              tabIndex={-1}
            >
              اختاري الخيارات
            </Link>
          ))}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="font-display text-[0.95rem] leading-snug font-bold text-ink sm:text-[1.1rem]">
          <Link href={href} className="line-clamp-1 hover:text-gold-bright">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-[0.72rem] text-muted">{product.tagline}</p>
          {product.colors.length > 1 && (
            <ul className="flex shrink-0 -space-x-1.5 rtl:space-x-reverse" aria-label={`${product.colors.length} ألوان`}>
              {product.colors.slice(0, 4).map((c) => (
                <li key={c.name} className="size-3.5 rounded-full ring-2 ring-ivory" style={{ background: c.hex }} title={c.name} />
              ))}
              {product.colors.length > 4 && <li className="ps-2.5 text-[0.65rem] font-semibold text-muted">+{product.colors.length - 4}</li>}
            </ul>
          )}
        </div>
        {state === "low" && (
          <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-bold text-gold-bright">
            <span className="size-1.5 animate-pulse rounded-full bg-gold" aria-hidden />
            بقي {product.stock} فقط
          </p>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 2) * 60}>
          <ProductCard product={p} priority={i < priorityCount} />
        </Reveal>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="arch skeleton aspect-[3/4]" />
          <div className="skeleton mt-3 h-4 w-3/4 rounded-full" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
