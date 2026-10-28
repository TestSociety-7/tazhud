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
import { Price } from "@/components/ui/price";
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
          <div className="arch relative aspect-[4/5] overflow-hidden bg-sand shadow-[var(--shadow-soft)] transition-shadow duration-500 group-hover:shadow-[var(--shadow-lift)]">
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
            <div className="absolute top-[18%] start-3 flex flex-col items-start gap-1.5">
              {product.newArrival && <span className="rounded-full bg-ivory/95 px-2.5 py-1 text-[0.7rem] font-bold text-forest">جديد</span>}
              {isOnSale(product) && <span className="rounded-full bg-ink px-2.5 py-1 text-[0.65rem] font-bold tracking-widest text-gold-soft uppercase">−{discountPercent(product)}%</span>}
            </div>
            {state === "out" && (
              <div className="absolute inset-x-0 bottom-0 bg-ink/75 py-2 text-center text-xs font-semibold tracking-widest text-ivory uppercase backdrop-blur-sm">
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
              className="absolute end-3 bottom-3 grid size-11 place-items-center rounded-full bg-ivory/95 text-ink shadow-[var(--shadow-soft)] transition-all duration-300 hover:bg-forest hover:text-ivory lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
              aria-label={`أضيفي ${product.name} إلى السلة`}
            >
              <Plus className="size-5" />
            </button>
          ) : (
            <Link
              href={href}
              className="absolute end-3 bottom-3 hidden rounded-full bg-ivory/95 px-4 py-2 text-xs font-semibold text-ink shadow-[var(--shadow-soft)] transition-all duration-300 hover:bg-forest hover:text-ivory lg:inline-flex lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
              tabIndex={-1}
            >
              اختاري الخيارات
            </Link>
          ))}
      </div>
      <div className="mt-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[1.15rem] leading-tight text-ink sm:text-[1.35rem]">
            <Link href={href} className="hover:underline hover:decoration-gold hover:underline-offset-4">
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-muted">{product.tagline}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Price price={effectivePrice(product)} compareAt={product.price} size="sm" />
          {product.colors.length > 1 && (
            <ul className="flex -space-x-1" aria-label={`${product.colors.length} ألوان`}>
              {product.colors.slice(0, 4).map((c) => (
                <li key={c.name} className="size-4 rounded-full border-2 border-ivory" style={{ background: c.hex }} title={c.name} />
              ))}
              {product.colors.length > 4 && <li className="ps-2 text-[0.65rem] text-muted">+{product.colors.length - 4}</li>}
            </ul>
          )}
        </div>
        {state === "low" && <p className="mt-1 text-[0.7rem] font-semibold text-[#855a14]">بقي {product.stock} فقط</p>}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
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
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="arch skeleton aspect-[4/5]" />
          <div className="skeleton mt-4 h-5 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </li>
      ))}
    </ul>
  );
}
