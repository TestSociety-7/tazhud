"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readListState, saveListState } from "@/lib/return-spot";
import { ArrowLeft, Check, Copy, MessageCircle, PackageCheck, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Mandala, Star8 } from "@/components/ui/mandala";
import { Tilt } from "@/components/ui/fx";
import { formatMoney, visibleProducts } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import type { HomeSection, Product } from "@/lib/types";
import { ProductCard } from "../product-card";
import { SEASON_WORDS, SeasonIcon, useSeason } from "../season";

export function SectionHeading({ title, href, linkLabel = "عرض الكل" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl leading-tight text-ink sm:text-[2.75rem]">{title}</h2>
        <span className="reveal-line season-rule mt-3 block h-0.5 w-14 rounded-full bg-gold" aria-hidden />
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
      <ul className="coverflow no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-7 lg:gap-5" style={{ "--cf-pad": "29vw" } as React.CSSProperties}>
        {cats.map((c, i) => (
          <Reveal as="li" key={c.id} delay={i * 80} className="w-[42vw] shrink-0 snap-center sm:w-auto">
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
              <p className="font-display mt-3 text-xl text-ink transition-colors group-hover:text-gold-deep lg:text-lg">{c.name}</p>
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
      <ul className="coverflow no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.slice(0, 8).map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 4) * 90} className={`w-[62vw] shrink-0 snap-center sm:w-auto ${i >= 4 ? "lg:hidden" : ""}`}>
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
  if (!promo.title || !data.settings.couponsEnabled) return null;

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

/** Every product on the home page, with quick category tabs. */
export function AllProductsSection() {
  const { data } = useStore();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(8);

  // Coming back from a product keeps the same tab and the same number of products shown.
  useEffect(() => {
    const saved = readListState<{ category: string; limit: number }>("home-products");
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring per-tab state after hydration
    setCategory(saved.category);
    setLimit(saved.limit);
  }, []);
  useEffect(() => saveListState("home-products", { category, limit }), [category, limit]);
  const cats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const all = visibleProducts(data);
  const list = category ? all.filter((p) => p.categoryId === category) : all;
  if (all.length === 0) return null;

  const tabs = [{ id: "", name: "الكل" }, ...cats.filter((c) => all.some((p) => p.categoryId === c.id))];

  return (
    <section id="products" className="container-x scroll-mt-24 pt-16 sm:pt-24">
      <SectionHeading title="منتجاتنا" href="/shop" linkLabel="المتجر" />
      <div role="group" aria-label="الأقسام" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((t) => {
          const active = t.id === category;
          return (
            <button
              key={t.id || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCategory(t.id);
                setLimit(8);
              }}
              className={`press min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-all duration-300 ${
                active ? "border-ink bg-ink text-ivory shadow-[0_8px_18px_-10px_rgb(15_18_15/0.6)]" : "border-line bg-paper text-text hover:border-gold"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      <ul key={category} className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {list.slice(0, limit).map((p, i) => (
          <li key={p.id} className="admin-enter" style={{ animationDelay: `${(i % 8) * 50}ms` }}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      {list.length > limit && (
        <div className="mt-10 text-center">
          <button type="button" className="press btn btn-outline border-line" onClick={() => setLimit((n) => n + 8)}>
            عرض المزيد ({list.length - limit})
          </button>
        </div>
      )}
    </section>
  );
}

/** A slow ribbon of the store's promises under the hero. */
export function TrustBand() {
  const { data } = useStore();
  const s = data.settings;
  const season = useSeason();
  const items = [
    ...(season === "original" ? [] : [SEASON_WORDS[season].ribbon]),
    "اطلبي عبر واتساب بخطوة واحدة",
    s.freeDeliveryThreshold > 0 ? `توصيل مجاني للطلبات فوق ${formatMoney(s.freeDeliveryThreshold, s)}` : "توصيل إلى باب البيت",
    "نؤكد طلبكِ معكِ قبل التوصيل",
    "استبدال سهل للقطع غير المستخدمة",
    "أقمشة مختارة بعناية",
  ];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="flex items-center gap-6 px-6 whitespace-nowrap">
          {season === "original" ? <Star8 className="size-3 text-gold" /> : <SeasonIcon season={season} className="size-3.5 text-gold" />}
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="لماذا تزهّد" className="season-band on-dark relative overflow-hidden border-y border-gold/25 bg-ink-2 py-3.5 text-sm text-gold-soft">
      <div className="marquee flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: ShoppingBag, title: "اختاري قطعتكِ", body: "اختاري اللون والمقاس وأضيفيها إلى السلة." },
  { icon: MessageCircle, title: "أرسلي الطلب عبر واتساب", body: "نجهّز لكِ رسالة الطلب كاملة، فقط اضغطي إرسال." },
  { icon: PackageCheck, title: "نؤكد ونوصل", body: "نؤكد التوفر وموعد التوصيل معكِ، ثم تصلكِ القطعة." },
];

/** Three simple steps, because ordering over WhatsApp is new to some customers. */
export function HowToOrder() {
  return (
    <section className="container-x pt-16 sm:pt-24">
      <Reveal className="on-dark relative overflow-hidden rounded-[2rem] bg-ink px-5 py-10 text-ivory sm:px-12 sm:py-14">
        <div className="pattern-geo absolute inset-0 opacity-[0.06]" aria-hidden />
        <Mandala className="pointer-events-none absolute -top-32 -start-32 size-80 text-gold/15 motion-safe:animate-spin-slow" />
        <div className="relative">
          <p className="text-sm font-semibold text-gold">بدون تعقيد</p>
          <h2 className="font-display mt-1 text-3xl leading-tight sm:text-[2.6rem]">كيف تطلبين؟</h2>
          <ol className="relative mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <span className="reveal-line absolute inset-x-[16%] top-8 hidden h-px bg-gradient-to-l from-gold/0 via-gold/70 to-gold/0 sm:block" aria-hidden />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex gap-4 sm:flex-col sm:items-center sm:text-center">
                <span className="relative grid size-16 shrink-0 place-items-center rounded-t-full rounded-b-2xl bg-gradient-to-b from-gold-bright to-gold-deep text-ink shadow-[0_18px_30px_-16px_rgb(212_178_106/0.8)]">
                  <Icon className="size-6" />
                  <span className="absolute -top-2 -end-2 grid size-6 place-items-center rounded-full bg-ivory text-xs font-bold text-ink">{i + 1}</span>
                </span>
                <div>
                  <h3 className="font-display text-xl text-ivory">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ivory/65">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
