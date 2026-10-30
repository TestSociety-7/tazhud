"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { discountPercent, effectivePrice, isOnSale, stockState } from "@/lib/commerce";
import type { Product } from "@/lib/types";
import { SmartImage } from "@/components/ui/smart-image";
import { PriceTag } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { data } = useStore();
  const { addProduct } = useCart();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const state = stockState(product.stock, data.settings.lowStockThreshold);
  const simple = product.colors.length <= 1 && product.sizes.length <= 1;
  const href = `/product/${product.slug}`;

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
    toast.success(`أُضيفت ${product.name} إلى السلة`, {
      action: { label: "إتمام الطلب", onClick: () => router.push("/checkout") },
    });
  }

  return (
    <article className="group relative">
      <div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative transition-transform duration-500 ease-[var(--ease-soft)] will-change-transform"
      >
        <Link href={href} className="press block" aria-label={product.name}>
          <div className="pinked relative aspect-[4/5] overflow-hidden rounded-t-[1.1rem] bg-sand">
            <SmartImage
              src={product.images[0]}
              alt={product.name}
              priority={priority}
              className="absolute inset-0"
              imgClassName="transition-transform duration-[1.4s] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
              fallbackLabel={product.name}
            />
            {product.images[1] && (
              <SmartImage
                src={product.images[1]}
                alt=""
                className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [@media(hover:none)]:hidden"
              />
            )}
            {(product.newArrival || isOnSale(product)) && (
              <div className="absolute top-3 start-0 flex flex-col items-start gap-1.5">
                {product.newArrival && <span className="woven-label rounded-s-none">جديد</span>}
                {isOnSale(product) && (
                  <span className="font-latin rounded-e-sm bg-gold-bright px-2 py-0.5 text-[0.72rem] font-bold text-ink"><bdi dir="ltr">−{discountPercent(product)}%</bdi></span>
                )}
              </div>
            )}
            {state === "out" && (
              <div className="absolute inset-0 grid place-items-center bg-ivory/45">
                <span className="rounded-sm bg-ink/85 px-3 py-1 text-xs font-semibold text-ivory">نفدت الكمية</span>
              </div>
            )}
          </div>
        </Link>
        <PriceTag price={effectivePrice(product)} compareAt={product.price} className="card-tag pointer-events-none" />
        {state !== "out" &&
          (simple ? (
            <button
              type="button"
              onClick={quickAdd}
              className="absolute end-2.5 bottom-3.5 grid size-11 place-items-center rounded-full bg-paper/95 text-forest shadow-[var(--shadow-soft)] outline outline-1 -outline-offset-4 outline-dashed outline-forest/25 transition-all duration-300 hover:bg-forest hover:text-gold-soft lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
              aria-label={`أضيفي ${product.name} إلى السلة`}
            >
              <Plus className="size-5" />
            </button>
          ) : (
            <Link
              href={href}
              className="absolute end-2.5 bottom-3.5 hidden rounded-[0.7rem] bg-paper/95 px-4 py-2 text-xs font-semibold text-ink shadow-[var(--shadow-soft)] transition-all duration-300 hover:bg-forest hover:text-gold-soft lg:inline-flex lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
              tabIndex={-1}
            >
              اختاري الخيارات
            </Link>
          ))}
      </div>
      <div className="mt-3.5 px-1">
        <h3 className="font-display text-[1.1rem] leading-snug text-ink sm:text-[1.3rem]">
          <Link href={href} className="hover:underline hover:decoration-gold hover:decoration-dashed hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{product.tagline}</p>
        {(product.colors.length > 1 || state === "low") && (
          <div className="mt-2 flex min-h-4 items-center justify-between gap-2">
            {product.colors.length > 1 ? (
              <ul className="flex gap-1" aria-label={`${product.colors.length} ألوان`}>
                {product.colors.slice(0, 4).map((c) => (
                  <li key={c.name} className="fabric size-3.5 rounded-[3px]" style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
                {product.colors.length > 4 && <li className="font-latin ps-1 text-[0.68rem] leading-[0.875rem] text-muted"><bdi dir="ltr">+{product.colors.length - 4}</bdi></li>}
              </ul>
            ) : <span />}
            {state === "low" && <p className="text-[0.7rem] font-semibold text-gold-deep">بقي {product.stock} فقط</p>}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
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
    <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="pinked skeleton aspect-[4/5] rounded-t-[1.1rem]" />
          <div className="skeleton mt-4 h-5 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </li>
      ))}
    </ul>
  );
}
