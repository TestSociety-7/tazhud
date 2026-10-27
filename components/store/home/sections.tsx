"use client";

import { InstagramIcon } from "@/components/ui/brand-icons";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Copy, HeartHandshake, MessageCircle, RefreshCcw, Truck } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Mandala, OrnamentDivider, Star8 } from "@/components/ui/mandala";
import { formatMoney, visibleProducts } from "@/lib/commerce";
import { whatsappLink } from "@/lib/whatsapp";
import type { HomeSection, Product } from "@/lib/types";
import { ProductCard } from "../product-card";
import { BundleCard } from "../bundle-card";
import { NewsletterForm } from "../newsletter-form";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "View all",
  center = false,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 flex items-end gap-4 sm:mb-10 ${center ? "flex-col items-center text-center" : "justify-between"}`}>
      <div>
        {subtitle && <p className="eyebrow mb-2 flex items-center gap-2 text-gold"><Star8 className="size-2.5" />{subtitle}</p>}
        <h2 className="font-display text-4xl leading-none text-ink sm:text-5xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-forest">
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function ValueStrip() {
  const { data } = useStore();
  const s = data.settings;
  const items = [
    { icon: MessageCircle, title: "Order on WhatsApp", body: "Personal confirmation, no card needed" },
    {
      icon: Truck,
      title: s.freeDeliveryThreshold > 0 ? `Free delivery over ${formatMoney(s.freeDeliveryThreshold, s)}` : "Fast delivery",
      body: "Usually 2 to 4 working days",
    },
    { icon: RefreshCcw, title: "Easy exchanges", body: "Within 7 days on unworn pieces" },
    { icon: HeartHandshake, title: "Thoughtfully made", body: "Fabrics chosen for drape and comfort" },
  ];
  return (
    <section aria-label="Why shop with us" className="border-b border-line bg-paper">
      <ul className="container-x no-scrollbar flex snap-x gap-6 overflow-x-auto py-6 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex min-w-[15rem] snap-start items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-forest">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{title}</span>
              <span className="block text-xs text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CategoriesSection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const cats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const counts = (id: string) => visibleProducts(data).filter((p) => p.categoryId === id).length;
  return (
    <section className="container-x pt-20 sm:pt-24">
      <SectionHeading title={section.title} subtitle={section.subtitle} href="/shop" linkLabel="Shop all" />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {cats.map((c, i) => (
          <Reveal as="li" key={c.id} delay={i * 70} className="w-[42%] shrink-0 snap-start sm:w-auto">
            <Link href={`/shop?category=${c.slug}`} className="group block text-center">
              <div className="arch-full relative aspect-[3/4] overflow-hidden bg-sand ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[var(--shadow-lift)]">
                <SmartImage src={c.image} alt="" className="absolute inset-0" imgClassName="transition-transform duration-[1.4s] ease-[var(--ease-soft)] group-hover:scale-[1.06]" fallbackLabel={c.name} />
              </div>
              <p className="font-display mt-3 text-xl text-ink">{c.name}</p>
              <p className="text-xs text-muted">{counts(c.id)} pieces</p>
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
    <section className="container-x pt-20 sm:pt-24">
      <SectionHeading title={section.title} subtitle={section.subtitle} href={href} />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.slice(0, 8).map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 4) * 80} className="w-[68%] shrink-0 snap-start sm:w-auto">
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
    <section className="container-x pt-20 sm:pt-24">
      <Reveal className="on-dark relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-center text-ivory sm:px-12 sm:py-20">
        <div className="pattern-geo absolute inset-0 opacity-[0.08]" aria-hidden />
        <Mandala className="pointer-events-none absolute -bottom-32 -left-32 size-96 text-gold/20 motion-safe:animate-spin-slow" />
        <Mandala className="pointer-events-none absolute -top-32 -right-32 size-96 text-gold/20 motion-safe:animate-spin-slow" />
        <div className="relative mx-auto max-w-xl">
          <p className="eyebrow text-gold">{promo.eyebrow}</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-balance sm:text-6xl">{promo.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ivory/75 sm:text-base">{promo.body}</p>
          {promo.couponCode && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copy}
                className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-dashed border-gold/70 px-6 font-mono text-lg tracking-[0.2em] text-gold-soft transition-colors hover:bg-white/5"
                aria-label={`Copy code ${promo.couponCode}`}
              >
                {promo.couponCode}
                {copied ? <Check className="size-4 text-gold" /> : <Copy className="size-4 opacity-70 group-hover:opacity-100" />}
              </button>
              <Link href={promo.ctaHref || "/shop"} className="btn btn-gold">
                {promo.ctaLabel}
              </Link>
            </div>
          )}
          <p className="mt-4 h-4 text-xs text-ivory/50" role="status">
            {copied ? "Code copied" : coupon?.minSubtotal ? `On orders over ${formatMoney(coupon.minSubtotal, data.settings)}` : ""}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

export function BundlesSection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const bundles = data.bundles.filter((b) => b.active);
  if (!bundles.length) return null;
  return (
    <section className="container-x pt-20 sm:pt-24">
      <SectionHeading title={section.title} subtitle={section.subtitle} href="/shop?view=bundles" />
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map((b, i) => (
          <Reveal as="li" key={b.id} delay={i * 90}>
            <BundleCard bundle={b} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function StorySection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const story = data.homepage.story;
  return (
    <section className="container-x overflow-x-clip pt-20 sm:pt-28">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative mx-auto w-full max-w-md">
          <div className="arch-full aspect-[4/5] overflow-hidden ring-1 ring-line">
            <SmartImage src={story.image} alt="Fabric swatches in the Tazhud studio" className="h-full w-full" />
          </div>
          <Mandala className="absolute -right-10 -bottom-10 size-40 text-gold/50" />
        </Reveal>
        <Reveal delay={120}>
          <p className="eyebrow text-gold">{section.title}</p>
          <h2 className="font-display mt-3 text-4xl leading-tight text-ink sm:text-5xl">{story.title}</h2>
          <OrnamentDivider className="my-6 max-w-[12rem]" />
          <p className="max-w-lg leading-relaxed text-pretty text-muted">{story.body}</p>
          <Link href="/shop" className="btn btn-primary mt-8">
            Discover the collection
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function FollowSection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const s = data.settings;
  const tiles = visibleProducts(data)
    .filter((p) => p.images[0])
    .slice(0, 6);
  return (
    <section className="container-x pt-20 sm:pt-28">
      <div className="card overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_1.15fr]">
          <div className="p-6 sm:p-10 lg:p-14">
            {section.subtitle && <p className="eyebrow text-gold">{section.subtitle}</p>}
            <h2 className="font-display mt-3 text-4xl leading-tight text-ink sm:text-5xl">{section.title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Follow {s.instagramHandle} for styling ideas and first looks, or join the list to hear about restocks before anyone else.
            </p>
            <div className="mt-8 max-w-md">
              <NewsletterForm />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <InstagramIcon className="size-4" /> Follow {s.instagramHandle}
              </a>
              <a href={whatsappLink(s.whatsappNumber, `Assalamu alaikum ${s.storeName}, I have a question.`)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <MessageCircle className="size-4" /> Chat with us
              </a>
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-1 bg-line p-1">
            {tiles.map((p) => (
              <li key={p.id}>
                <a
                  href={s.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-square overflow-hidden"
                  aria-label={`${p.name} on Instagram`}
                >
                  <SmartImage src={p.images[0]} alt="" className="h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-110" />
                  <span className="absolute inset-0 grid place-items-center bg-ink/0 text-ivory opacity-0 transition-all duration-300 group-hover:bg-ink/40 group-hover:opacity-100">
                    <InstagramIcon className="size-6" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
