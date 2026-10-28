"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { formatMoney, visibleProducts } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import type { HomeSection, Product } from "@/lib/types";
import { ProductCard } from "../product-card";

export function SectionHeading({ title, href, linkLabel = "عرض الكل" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-forest">
          {linkLabel}
          <ArrowLeft className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function CategoriesSection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const cats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const counts = (id: string) => visibleProducts(data).filter((p) => p.categoryId === id).length;
  return (
    <section className="container-x pt-14 sm:pt-20">
      <SectionHeading title={section.title} href="/shop" linkLabel="كل المنتجات" />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {cats.map((c) => (
          <li key={c.id} className="w-[40%] shrink-0 snap-start sm:w-auto">
            <Link href={`/shop?category=${c.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                <SmartImage src={c.image} alt="" className="absolute inset-0" imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" fallbackLabel={c.name} />
              </div>
              <p className="mt-2 font-semibold text-ink">{c.name}</p>
              <p className="text-xs text-muted">{piecesLabel(counts(c.id))}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductRail({ section, products, href }: { section: HomeSection; products: Product[]; href: string }) {
  if (products.length === 0) return null;
  return (
    <section className="container-x pt-14 sm:pt-20">
      <SectionHeading title={section.title} href={href} />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
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
    <section className="container-x pt-14 sm:pt-20">
      <div className="on-dark flex flex-col items-start gap-5 rounded-3xl bg-ink px-6 py-8 text-ivory sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">{promo.title}</h2>
          {promo.body && <p className="mt-1 text-sm text-ivory/70">{promo.body}</p>}
          {coupon?.minSubtotal ? <p className="mt-1 text-xs text-ivory/50">للطلبات فوق {formatMoney(coupon.minSubtotal, data.settings)}</p> : null}
        </div>
        {promo.couponCode && coupon && (
          <button
            type="button"
            onClick={copy}
            className="ltr inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full border border-dashed border-gold/70 px-6 font-mono text-lg tracking-[0.15em] text-gold-soft hover:bg-white/5"
            aria-label={`نسخ الكود ${promo.couponCode}`}
          >
            {promo.couponCode}
            {copied ? <Check className="size-4 text-gold" /> : <Copy className="size-4 opacity-70" />}
          </button>
        )}
        <span className="sr-only" role="status">{copied ? "تم نسخ الكود" : ""}</span>
      </div>
    </section>
  );
}
