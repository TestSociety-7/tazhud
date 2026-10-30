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
import { bundleDetails, formatMoney, visibleProducts } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import type { Bundle, HomeSection } from "@/lib/types";
import { ProductCard } from "../product-card";

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
      <Reveal className="ticket neon-ring relative mx-auto flex max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-paper text-ink shadow-[0_30px_80px_-30px_rgb(255_92_122/0.45)] sm:flex-row">
        <div className="pointer-events-none absolute -bottom-24 start-10 size-72 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-[#b07cff]/20 blur-3xl" aria-hidden />
        <div className="relative flex-1 px-7 py-9 sm:px-10 sm:py-12">
          <p className="eyebrow text-gold-bright">{promo.eyebrow || "عرض خاص"}</p>
          <h2 className="font-display mt-2 text-3xl leading-tight text-balance sm:text-[2.6rem]">{title}</h2>
          {promo.body && <p className="mt-3 max-w-md text-sm text-muted sm:text-base">{promo.body}</p>}
          {coupon.minSubtotal ? <p className="mt-3 text-xs text-muted">للطلبات فوق {money(coupon.minSubtotal)}</p> : null}
        </div>
        <div className="ticket-stub relative flex shrink-0 flex-col items-center justify-center gap-3 px-7 py-8 text-center sm:w-64 sm:py-10">
          {big ? (
            <p className="font-display text-6xl leading-none text-gold-bright tabular-nums sm:text-7xl" dir="ltr">
              {big}
              <span className="block pt-1 text-base text-muted" dir="rtl">{small}</span>
            </p>
          ) : (
            <p className="font-display text-3xl text-gold-bright">{small}</p>
          )}
          <button
            type="button"
            onClick={copy}
            className="press sheen ltr inline-flex min-h-12 items-center gap-3 rounded-full bg-gold-bright px-6 font-mono text-base font-bold tracking-[0.18em] text-ink transition-colors hover:bg-gold-soft"
            aria-label={`نسخ الكود ${coupon.code}`}
          >
            {coupon.code}
            {copied ? <Check className="size-4" /> : <Copy className="size-4 opacity-70" />}
          </button>
          <p className="h-4 text-xs text-muted" role="status">{copied ? "تم نسخ الكود ✓" : "اضغطي لنسخ الكود"}</p>
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
              <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-[var(--shadow-soft)] transition-transform duration-300 active:scale-[0.98]">
                <div className="relative flex h-56 items-end justify-center overflow-hidden bg-[radial-gradient(80%_80%_at_50%_100%,rgb(255_92_122/0.25),var(--color-sand))] pt-6">
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
                    <span className="absolute top-4 start-4 z-10 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-white">وفّري {money(d.savings)}</span>
                  )}
                  <span className="absolute top-4 end-4 z-10 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{piecesLabel(pieces)}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-2xl leading-tight text-ink">{b.name}</h3>
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
                      <span className="font-display block text-3xl text-ink tabular-nums">{money(b.price)}</span>
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
                active ? "border-transparent bg-white font-bold text-[#0a0a0d]" : "border-line bg-paper text-text hover:border-gold"
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

const STEPS = [
  { icon: ShoppingBag, title: "اختاري قطعتكِ", body: "اختاري اللون والمقاس وأضيفيها إلى السلة." },
  { icon: MessageCircle, title: "أرسلي الطلب عبر واتساب", body: "نجهّز لكِ رسالة الطلب كاملة، فقط اضغطي إرسال." },
  { icon: PackageCheck, title: "نؤكد ونوصل", body: "نؤكد التوفر وموعد التوصيل معكِ، ثم تصلكِ القطعة." },
];

/** Three simple steps, because ordering over WhatsApp is new to some customers. */
export function HowToOrder() {
  return (
    <section className="container-x pt-16 sm:pt-24">
      <Reveal className="relative overflow-hidden rounded-[2rem] border border-line bg-paper px-5 py-10 text-ink sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute -top-32 -start-32 size-80 rounded-full bg-gold/15 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-sm font-semibold text-gold">بدون تعقيد</p>
          <h2 className="font-display mt-1 text-3xl leading-tight sm:text-[2.6rem]">كيف تطلبين؟</h2>
          <ol className="relative mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <span className="reveal-line absolute inset-x-[16%] top-8 hidden h-px bg-gradient-to-l from-gold/0 via-gold/70 to-gold/0 sm:block" aria-hidden />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex gap-4 sm:flex-col sm:items-center sm:text-center">
                <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-[image:var(--neon)] text-white shadow-[0_18px_30px_-16px_rgb(255_92_122/0.8)]">
                  <Icon className="size-6" />
                  <span className="absolute -top-2 -end-2 grid size-6 place-items-center rounded-full bg-ivory text-xs font-bold text-ink">{i + 1}</span>
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
