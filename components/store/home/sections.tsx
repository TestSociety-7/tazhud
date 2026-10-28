"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Mandala } from "@/components/ui/mandala";
import { Tilt } from "@/components/ui/fx";
import { formatMoney, visibleProducts } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import type { HomeSection, Product } from "@/lib/types";
import { ProductCard } from "../product-card";

export function SectionHeading({ title, href, linkLabel = "عرض الكل" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl leading-tight text-ink sm:text-[2.75rem]">{title}</h2>
        <span className="reveal-line mt-3 block h-0.5 w-14 rounded-full bg-gold" aria-hidden />
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-forest">
          {linkLabel}
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}

export function CategoriesSection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const cats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const counts = (id: string) => visibleProducts(data).filter((p) => p.categoryId === id).length;
  return (
    <section className="container-x pt-16 sm:pt-24">
      <SectionHeading title={section.title} href="/shop" linkLabel="كل المنتجات" />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {cats.map((c, i) => (
          <Reveal as="li" key={c.id} delay={i * 80} className="w-[42%] shrink-0 snap-start sm:w-auto">
            <Link href={`/shop?category=${c.slug}`} className="press group block text-center">
              <Tilt max={8} className="rounded-t-full">
                <div className="arch-full relative aspect-[3/4] overflow-hidden bg-sand ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[var(--shadow-lift)] group-hover:ring-gold/60">
                  <SmartImage
                    src={c.image}
                    alt=""
                    className="absolute inset-0"
                    imgClassName="transition-transform duration-[1.2s] ease-[var(--ease-soft)] group-hover:scale-[1.07]"
                    fallbackLabel={c.name}
                  />
                </div>
              </Tilt>
              <p className="font-display mt-3 text-xl text-ink transition-colors group-hover:text-gold-deep">{c.name}</p>
              <p className="text-xs text-muted">{piecesLabel(counts(c.id))}</p>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function ProductRail({ section, products, href }: { section: HomeSection; products: Product[]; href: string }) {
  if (products.length === 0) return null;
  return (
    <section className="container-x pt-16 sm:pt-24">
      <SectionHeading title={section.title} href={href} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {products.slice(0, 8).map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 4) * 90}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function PromoSection() {
  const { data } = useStore();
  const promo = data.homepage.promo;
  const coupon = data.coupons.find((c) => c.code === promo.couponCode && c.active);
  const [copied, setCopied] = useState(false);
  if (!promo.title) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(promo.couponCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the code is visible anyway */
    }
  }

  return (
    <section className="container-x pt-16 sm:pt-24">
      <Reveal className="on-dark relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-center text-ivory sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -bottom-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <Mandala className="pointer-events-none absolute -top-28 -end-28 size-80 text-gold/15 motion-safe:animate-spin-slow" />
        <div className="relative mx-auto max-w-lg">
          <h2 className="font-display text-3xl leading-tight text-balance sm:text-5xl">{promo.title}</h2>
          {promo.body && <p className="mt-3 text-sm text-ivory/70 sm:text-base">{promo.body}</p>}
          {promo.couponCode && coupon && (
            <button
              type="button"
              onClick={copy}
              className="press sheen ltr mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border border-dashed border-gold/70 px-7 font-mono text-lg tracking-[0.2em] text-gold-soft transition-colors hover:bg-white/5"
              aria-label={`نسخ الكود ${promo.couponCode}`}
            >
              {promo.couponCode}
              {copied ? <Check className="size-4 text-gold" /> : <Copy className="size-4 opacity-70" />}
            </button>
          )}
          <p className="mt-3 h-4 text-xs text-ivory/60" role="status">
            {copied ? "تم نسخ الكود" : coupon?.minSubtotal ? `للطلبات فوق ${formatMoney(coupon.minSubtotal, data.settings)}` : ""}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
