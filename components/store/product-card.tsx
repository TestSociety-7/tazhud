"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { discountPercent, effectivePrice, isOnSale, stockState } from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { data } = useStore();
  const { addProduct } = useCart();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [popped, setPopped] = useState(false);
  const state = stockState(product.stock, data.settings.lowStockThreshold);
  const simple = product.colors.length <= 1 && product.sizes.length <= 1;
  const href = `/product/${product.slug}`;

  useEffect(() => {
    if (!popped) return;
    const t = window.setTimeout(() => setPopped(false), 1400);
    return () => window.clearTimeout(t);
  }, [popped]);

  // Pearl light follows the finger or the mouse across the photo; mouse also leans the card in 3D.
  function onMove(e: React.PointerEvent) {
    const card = cardRef.current;
    const photo = photoRef.current;
    if (!card || !photo || reducedMotion()) return;
    const r = photo.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    photo.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    photo.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    photo.style.setProperty("--shine", "1");
    if (e.pointerType === "mouse") {
      card.dataset.hover = "true";
      card.style.setProperty("--rx", `${((0.5 - py) * 8).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${((px - 0.5) * 10).toFixed(2)}deg`);
    }
  }
  function onLeave() {
    const card = cardRef.current;
    const photo = photoRef.current;
    if (card) {
      delete card.dataset.hover;
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    }
    photo?.style.setProperty("--shine", "0");
  }

  function quickAdd() {
    if (!simple) return;
    addProduct(product, { color: product.colors[0]?.name, size: product.sizes[0], quantity: 1 });
    setPopped(true);
    toast.success(`أُضيفت ${product.name} إلى السلة`, {
      action: { label: "إتمام الطلب", onClick: () => router.push("/checkout") },
    });
  }

  return (
    <article className="group relative">
      <div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={onLeave}
        onPointerUp={(e) => e.pointerType !== "mouse" && onLeave()}
        onPointerCancel={onLeave}
        className="pcard relative"
      >
        <Link href={href} className="block" aria-label={product.name}>
          <div ref={photoRef} className="pcard-photo shine-follow">
            <SmartImage
              src={product.images[0]}
              alt={product.name}
              priority={priority}
              className="absolute inset-0"
              fallbackLabel={product.name}
            />
            {product.images[1] && (
              <SmartImage
                src={product.images[1]}
                alt=""
                className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [@media(hover:none)]:hidden"
              />
            )}
            <div className="absolute top-3 start-3 z-[4] flex flex-col items-start gap-1.5">
              {product.newArrival && <span className="badge-pearl rounded-full px-2.5 py-1 text-[0.68rem] font-bold">جديد</span>}
              {isOnSale(product) && (
                <span className="badge-ink font-latin rounded-full px-2.5 py-1 text-[0.68rem] font-bold" dir="ltr">
                  −{discountPercent(product)}%
                </span>
              )}
            </div>
            {state === "out" && (
              <div className="glass-dark absolute inset-x-3 bottom-3 z-[4] rounded-full py-2 text-center text-xs font-semibold text-ivory">
                نفدت الكمية
              </div>
            )}
          </div>
        </Link>
        {state !== "out" &&
          (simple ? (
            <button
              type="button"
              onClick={quickAdd}
              data-pop={popped}
              className="quick-add"
              aria-label={`أضيفي ${product.name} إلى السلة`}
            >
              {popped ? <Check className="size-5" /> : <Plus className="size-5" />}
            </button>
          ) : (
            <Link
              href={href}
              className="quick-pick glass hidden rounded-full px-4 py-2 text-xs font-semibold text-ink transition-all duration-500 ease-[var(--ease-spring)] lg:inline-flex lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
              tabIndex={-1}
            >
              اختاري الخيارات
            </Link>
          ))}
      </div>
      <div className="mt-3.5 px-1">
        <h3 className="font-display text-[1.1rem] leading-snug text-ink sm:text-[1.3rem]">
          <Link href={href} className="transition-colors hover:text-forest-2">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{product.tagline}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Price price={effectivePrice(product)} compareAt={product.price} size="sm" />
          {product.colors.length > 1 && (
            <ul className="flex -space-x-1.5 rtl:space-x-reverse" aria-label={`${product.colors.length} ألوان`}>
              {product.colors.slice(0, 4).map((c) => (
                <li
                  key={c.name}
                  className="size-4 rounded-full ring-2 ring-ivory shadow-[inset_-1px_-2px_3px_rgb(0_0_0/0.18),inset_1px_1px_2px_rgb(255_255_255/0.4)]"
                  style={{ background: c.hex }}
                  title={c.name}
                />
              ))}
              {product.colors.length > 4 && <li className="font-latin ps-2.5 text-[0.65rem] text-muted">+{product.colors.length - 4}</li>}
            </ul>
          )}
        </div>
        {state === "low" && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-gold-deep">
            <span className="live-dot size-1.5 rounded-full bg-gold" aria-hidden />
            بقي {product.stock} فقط
          </p>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 4) * 70}>
          <ProductCard product={p} priority={i < priorityCount} />
        </Reveal>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="leaf skeleton-pearl aspect-[4/5]" />
          <div className="skeleton-pearl mt-4 h-5 w-3/4 rounded-full" />
          <div className="skeleton-pearl mt-2 h-3 w-1/2 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
