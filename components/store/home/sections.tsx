"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { readListState, saveListState } from "@/lib/return-spot";
import { ArrowLeft, Check, Copy, MessageCircle, PackageCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";
import { Tilt } from "@/components/ui/fx";
import { bundleDetails, formatMoney, visibleProducts } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import type { Bundle, HomeSection, Product } from "@/lib/types";
import { ProductCard } from "../product-card";
import { SEASON_WORDS, SeasonIcon, useSeason } from "../season";

export function SectionHeading({ title, href, linkLabel = "عرض الكل" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="chalk text-[2rem] leading-tight text-ink sm:text-[2.75rem]">{title}</h2>
        <span className="stitch stitch-draw season-rule mt-3 w-20" aria-hidden />
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
              <Tilt max={8} className="rounded-t-2xl">
                <div className="pinked relative aspect-[3/4] overflow-hidden rounded-t-2xl bg-sand">
                  <span className="pin-head absolute top-2.5 left-1/2 z-10 -translate-x-1/2" aria-hidden />
                  <SmartImage
                    src={c.image}
                    alt=""
                    className="absolute inset-0"
                    imgClassName="transition-transform duration-[1.2s] ease-[var(--ease-soft)] group-hover:scale-[1.07]"
                    fallbackLabel={c.name}
                  />
                </div>
              </Tilt>
              <p className="chalk mt-2.5 text-xl text-ink transition-colors group-hover:text-forest lg:text-lg">{c.name}</p>
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
  const coupon = data.coupons.find((c) => c.code === promo.couponCode && c.active && !(c.expiresOn && c.expiresOn < new Date().toISOString().slice(0, 10)));
  const [copied, setCopied] = useState(false);
  // The ticket only shows while its code still works.
  if (!data.settings.couponsEnabled || !coupon) return null;
  const title = promo.title || coupon.description;
  const money = (n: number) => formatMoney(n, data.settings);
  const big = coupon.type === "percent" ? `${coupon.value}%` : coupon.type === "fixed" ? money(coupon.value) : "";
  const small = coupon.type === "free_delivery" ? "توصيل مجاني" : "خصم";

  const code = coupon.code;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the code is visible anyway */
    }
  }

  return (
    <section className="container-x pt-16 sm:pt-24">
      <Reveal className="ticket stitch-box on-dark relative mx-auto flex max-w-4xl flex-col overflow-hidden rounded-[1.4rem] bg-forest text-ivory shadow-[var(--shadow-lift)] sm:flex-row">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:var(--weave)] invert" aria-hidden />
        <div className="relative flex-1 px-7 py-9 sm:px-10 sm:py-12">
          <p className="eyebrow text-gold-bright">{promo.eyebrow || "عرض خاص"}</p>
          <h2 className="chalk mt-2 text-3xl leading-tight text-balance sm:text-[2.6rem]">{title}</h2>
          {promo.body && <p className="mt-3 max-w-md text-sm text-ivory/70 sm:text-base">{promo.body}</p>}
          {coupon.minSubtotal ? <p className="mt-3 text-xs text-ivory/60">للطلبات فوق {money(coupon.minSubtotal)}</p> : null}
        </div>
        <div className="ticket-stub relative flex shrink-0 flex-col items-center justify-center gap-3 px-7 py-8 text-center sm:w-64 sm:py-10">
          {big ? (
            <p className="font-latin text-6xl leading-none font-bold text-gold-bright tabular-nums sm:text-7xl" dir="ltr">
              {big}
              <span className="block pt-1 text-base text-ivory/70" dir="rtl">{small}</span>
            </p>
          ) : (
            <p className="chalk text-3xl text-gold-bright">{small}</p>
          )}
          <button
            type="button"
            onClick={copy}
            className="press swing-tag ltr min-h-12 !gap-3 !px-6 !ps-8 text-base tracking-[0.18em] transition-colors hover:bg-gold-soft"
            aria-label={`نسخ الكود ${coupon.code}`}
          >
            {coupon.code}
            {copied ? <Check className="size-4" /> : <Copy className="size-4 opacity-70" />}
          </button>
          <p className="h-4 text-xs text-ivory/60" role="status">{copied ? "تم نسخ الكود ✓" : "اضغطي لنسخ الكود"}</p>
        </div>
      </Reveal>
    </section>
  );
}

/** Bundles: a few pieces together for one lower price, added to the cart in one tap. */
export function BundlesSection({ section }: { section: HomeSection }) {
  const { data } = useStore();
  const { addBundle } = useCart();
  const router = useRouter();
  const money = (n: number) => formatMoney(n, data.settings);
  const list = data.bundles.map((b) => ({ b, d: bundleDetails(b, data.products) })).filter(({ d }) => d.available);
  if (!list.length) return null;

  function add(b: Bundle) {
    addBundle(b);
    toast.success(`أُضيفت ${b.name} إلى السلة`, { action: { label: "إتمام الطلب", onClick: () => router.push("/checkout") } });
  }

  return (
    <section id="bundles" className="container-x scroll-mt-24 pt-16 sm:pt-24">
      <SectionHeading title={section.title || "مجموعات بسعر أقل"} />
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-6 sm:overflow-visible sm:px-0">
        {list.map(({ b, d }, i) => {
          const pics = b.image ? [b.image] : d.items.slice(0, 3).map((it) => it.product.images[0]);
          const pieces = d.items.reduce((n, it) => n + it.quantity, 0);
          return (
            <Reveal as="li" key={b.id} delay={i * 80} id={`bundle-${b.slug}`} className={`${list.length === 1 ? "w-full" : "w-[82vw]"} max-w-sm shrink-0 snap-center scroll-mt-24 sm:w-[calc(50%-0.75rem)] sm:max-w-md lg:w-[calc(33.333%-1rem)]`}>
              <article className="stitch-box-soft flex h-full flex-col overflow-hidden rounded-[1.3rem] bg-paper shadow-[var(--shadow-soft)]">
                <div className="relative flex h-56 items-end justify-center overflow-hidden bg-sand pt-6">
                  {pics.length === 1 ? (
                    <SmartImage src={pics[0]} alt="" className="arch h-full w-40" fallbackLabel=" " />
                  ) : (
                    <div className="relative h-full w-full">
                      {pics.map((src, k) => {
                        const n = pics.length;
                        const offset = (k - (n - 1) / 2) * 30;
                        return (
                          <span
                            key={k}
                            className="absolute bottom-0 h-[88%] w-32 origin-bottom"
                            style={{ insetInlineStart: `calc(50% - 4rem + ${offset * 1.6}px)`, rotate: `${offset / 5}deg`, zIndex: 3 - Math.abs(Math.round(k - (n - 1) / 2)) }}
                          >
                            <SmartImage src={src} alt="" fallbackLabel=" " className="arch h-full w-full shadow-[var(--shadow-soft)] ring-4 ring-sand" />
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {d.savings > 0 && (
                    <span className="woven-label absolute top-4 start-4 z-10">وفّري {money(d.savings)}</span>
                  )}
                  <span className="absolute top-4 end-4 z-10 rounded-full bg-paper/90 px-3 py-1.5 text-xs font-semibold text-forest backdrop-blur">{piecesLabel(pieces)}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="chalk text-2xl leading-tight text-ink">{b.name}</h3>
                  {b.description && <p className="mt-1 text-sm text-muted">{b.description}</p>}
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {d.items.map((it) => (
                      <li key={it.productId} className="rounded-full border border-line bg-ivory px-2.5 py-1 text-xs text-text">
                        {it.product.name}
                        {it.quantity > 1 && <span className="ms-1 font-semibold text-gold-deep">×{it.quantity}</span>}
                      </li>
                    ))}
                  </ul>
                  {b.note && <p className="mt-3 text-xs text-gold-deep">{b.note}</p>}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                    <p className="leading-none">
                      <span className="font-latin block text-2xl font-bold text-ink tabular-nums">{money(b.price)}</span>
                      {d.savings > 0 && <span className="mt-1 block text-sm text-muted line-through tabular-nums">{money(d.value)}</span>}
                    </p>
                    <button type="button" onClick={() => add(b)} className="btn btn-primary press shrink-0">
                      <ShoppingBag className="size-4" /> أضيفي للسلة
                    </button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </ul>
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
                active ? "border-forest bg-forest text-paper shadow-[0_8px_18px_-10px_rgb(109_35_71/0.7)]" : "border-line bg-paper text-text hover:border-forest/40"
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
          {season === "original" ? <span className="pin-head size-2.5" /> : <SeasonIcon season={season} className="size-3.5 text-forest" />}
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="لماذا تزهّد" className="season-band relative overflow-hidden bg-gold-soft py-3.5 text-sm font-medium text-ink shadow-[0_6px_14px_-10px_rgb(42_15_29/0.5)] before:absolute before:inset-x-0 before:top-0 before:h-2 before:bg-[repeating-linear-gradient(270deg,rgb(42_15_29/0.5)_0_1px,transparent_1px_10px)] before:content-['']">
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
      <Reveal className="stitch-box on-dark relative overflow-hidden rounded-[1.6rem] bg-ink px-5 py-10 text-ivory sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:var(--weave)] invert" aria-hidden />
        <div className="relative">
          <p className="text-sm font-semibold text-gold">بدون تعقيد</p>
          <h2 className="chalk mt-1 text-3xl leading-tight sm:text-[2.6rem]">كيف تطلبين؟</h2>
          <ol className="relative mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <span className="stitch stitch-draw absolute inset-x-[16%] top-8 hidden opacity-80 sm:block" aria-hidden />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex gap-4 sm:flex-col sm:items-center sm:text-center">
                <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-gold-bright to-gold-deep text-ink shadow-[0_18px_30px_-16px_rgb(212_178_106/0.8)]">
                  <Icon className="size-6" />
                  <span className="absolute -top-2 -end-2 grid size-6 place-items-center rounded-full bg-ivory font-latin text-xs font-bold text-ink">{i + 1}</span>
                </span>
                <div>
                  <h3 className="chalk text-xl text-ivory">{title}</h3>
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
