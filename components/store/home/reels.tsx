"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronUp, Eye, Heart, Plus, Share2 } from "lucide-react";
import { WhatsappIcon } from "@/components/ui/brand-icons";
import { LogoCoin } from "@/components/ui/fx";
import { SmartImage } from "@/components/ui/smart-image";
import { useCart } from "@/components/providers/cart-provider";
import { useStore } from "@/components/providers/store-provider";
import { discountPercent, effectivePrice, formatMoney, isOnSale, stockState, visibleProducts } from "@/lib/commerce";
import { piecesLabel } from "@/lib/arabic";
import { whatsappLink } from "@/lib/whatsapp";
import type { Category, Product } from "@/lib/types";
import { SEASON_WORDS, SeasonHeroDecor, SeasonIcon, useSeason } from "../season";

/**
 * The home page as a vertical feed: every slide fills the phone screen and snaps into
 * place, and as one slide leaves, it turns away like the face of a cube.
 */
export function ReelsFeed({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reels-snap");
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => root.classList.remove("reels-snap");
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = window.innerHeight;
      for (const slide of el.querySelectorAll<HTMLElement>(":scope > .reel")) {
        const face = slide.firstElementChild as HTMLElement | null;
        if (!face) continue;
        const top = slide.getBoundingClientRect().top;
        // -1 = one screen below, 0 = in place, 1 = one screen above.
        const p = Math.max(-1, Math.min(1, -top / h));
        if (Math.abs(p) < 0.001 || Math.abs(p) >= 1) {
          face.style.transform = "";
          face.style.filter = "";
          continue;
        }
        face.style.transformOrigin = p > 0 ? "50% 100%" : "50% 0%";
        face.style.transform = `perspective(1200px) rotateX(${(p * 70).toFixed(2)}deg)`;
        face.style.filter = `brightness(${(1 - Math.abs(p) * 0.55).toFixed(3)})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("reels-snap");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="reels">
      {children}
    </div>
  );
}

/** One full-screen slide. The inner face is what turns. */
export function Reel({ children, className = "", label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <section className="reel" aria-label={label}>
      <div className={`reel-face ${className}`}>{children}</div>
    </section>
  );
}

/** The opening slide: the brand, the hero title and a fan of pieces turning in 3D. */
export function CoverReel({ picks }: { picks: Product[] }) {
  const { data } = useStore();
  const hero = data.homepage.hero;
  const season = useSeason();
  const backdrop = picks[0]?.images[0] || hero.image;

  return (
    <Reel label="الواجهة" className="cover-reel">
      <SmartImage src={backdrop} alt="" priority className="absolute inset-0 scale-125 opacity-50 blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_30%,transparent,rgb(10_10_13/0.9))]" aria-hidden />
      <SeasonHeroDecor />

      <div className="relative z-10 flex h-full flex-col items-center px-5 pt-[calc(3.75rem+1.5rem)] pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1rem)] text-center lg:pb-10">
        <div className="cover-fan" aria-hidden>
          {picks.slice(0, 3).map((p, i) => (
            <span key={p.id} className="cover-card" style={{ "--i": i - 1 } as React.CSSProperties}>
              <SmartImage src={p.images[0]} alt="" className="absolute inset-0" />
            </span>
          ))}
          <LogoCoin hat float={false} className="cover-logo size-16" />
        </div>

        {season !== "original" && (
          <p className="season-chip mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold">
            <SeasonIcon season={season} />
            {SEASON_WORDS[season].badge}
          </p>
        )}
        <h1 className="font-display mt-auto text-[2.5rem] leading-[1.15] font-black text-balance text-white sm:text-6xl">
          <span className="reel-rise block">{hero.title}</span>
          {hero.titleAccent && <span className="reel-rise neon-text block [animation-delay:120ms]">{hero.titleAccent}</span>}
        </h1>
        {hero.subtitle && <p className="reel-rise mt-3 max-w-sm text-[0.95rem] text-white/75 [animation-delay:220ms]">{hero.subtitle}</p>}
        <div className="reel-rise mt-6 grid w-full max-w-sm grid-cols-[1.4fr_1fr] gap-2.5 [animation-delay:320ms]">
          <Link href={hero.primaryHref || "/shop"} className="pop btn btn-neon min-h-13 text-base">
            {hero.primaryLabel || "تسوّقي الآن"}
          </Link>
          <Link href={hero.secondaryHref || "/shop?category=hijabs"} className="pop btn glass-dark min-h-13 text-white">
            {hero.secondaryLabel || "اكتشفي الطرح"}
          </Link>
        </div>
        <a href="#reel-1" className="swipe-hint mt-6 grid justify-items-center text-xs font-semibold text-white/70">
          <ChevronUp className="size-6" />
          اسحبي للأعلى
        </a>
      </div>
    </Reel>
  );
}

/** A product as a full-screen reel, with the actions down the side. */
export function ProductReel({ product, index, total }: { product: Product; index: number; total: number }) {
  const { data } = useStore();
  const { addProduct } = useCart();
  const router = useRouter();
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTap = useRef(0);
  const s = data.settings;
  const href = `/product/${product.slug}`;
  const simple = product.colors.length <= 1 && product.sizes.length <= 1;
  const out = stockState(product.stock, s.lowStockThreshold) === "out";
  const category = data.categories.find((c) => c.id === product.categoryId);

  function add(at?: { x: number; y: number }) {
    if (out) return;
    if (!simple) return router.push(href);
    addProduct(product, { color: product.colors[0]?.name, size: product.sizes[0], quantity: 1 });
    if (at) {
      const id = Date.now();
      setHearts((h) => [...h, { id, ...at }]);
      window.setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 950);
    }
    toast.success(`أُضيفت ${product.name} إلى السلة`, {
      action: { label: "إتمام الطلب", onClick: () => router.push("/checkout") },
    });
  }

  // Double tap on the picture adds it, like liking a reel.
  function onTap(e: React.MouseEvent<HTMLDivElement>) {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      const r = e.currentTarget.getBoundingClientRect();
      add({ x: e.clientX - r.left, y: e.clientY - r.top });
      lastTap.current = 0;
    } else lastTap.current = now;
  }

  async function share() {
    const url = `${location.origin}${href}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
      }
    } catch {
      /* the customer closed the share sheet */
    }
  }

  return (
    <Reel label={product.name} className="product-reel">
      <div id={`reel-${index}`} className="absolute -top-px" aria-hidden />
      <SmartImage src={product.images[0]} alt="" className="absolute inset-0 scale-125 opacity-60 blur-2xl lg:block" />
      <div className="reel-photo" onClick={onTap}>
        <SmartImage src={product.images[0]} alt={product.name} className="absolute inset-0" fallbackLabel={product.name} />
        {hearts.map((h) => (
          <Heart key={h.id} className="heart-burst size-24 fill-current" style={{ left: h.x, top: h.y }} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" aria-hidden />

      <p className="chip glass-dark absolute top-[4.6rem] start-4 z-10 font-latin">
        {index}/{total}
      </p>
      <div className="absolute top-[4.6rem] end-4 z-10 flex flex-col items-end gap-1.5">
        {product.newArrival && <span className="chip bg-white text-[#0a0a0d]">جديد</span>}
        {isOnSale(product) && <span className="chip bg-gold text-white">−{discountPercent(product)}%</span>}
      </div>

      {/* Actions down the side, within thumb reach. */}
      <div className="reel-rail">
        <button type="button" onClick={() => add()} disabled={out} className="reel-action" aria-label={simple ? `أضيفي ${product.name} إلى السلة` : `اختاري خيارات ${product.name}`}>
          <span className="reel-action-icon bg-[image:var(--neon)]">
            <Plus className="size-6" />
          </span>
          {out ? "نفدت" : simple ? "للسلة" : "اختاري"}
        </button>
        <a
          href={whatsappLink(s.whatsappNumber, `السلام عليكم ${s.storeName}، أسأل عن ${product.name}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="reel-action"
          aria-label={`اسألي عن ${product.name} على واتساب`}
        >
          <span className="reel-action-icon">
            <WhatsappIcon className="size-6" />
          </span>
          اسألي
        </a>
        <button type="button" onClick={share} className="reel-action" aria-label={`مشاركة ${product.name}`}>
          <span className="reel-action-icon">
            <Share2 className="size-5" />
          </span>
          شاركي
        </button>
        <Link href={href} className="reel-action" aria-label={`عرض ${product.name}`}>
          <span className="reel-action-icon">
            <Eye className="size-5" />
          </span>
          التفاصيل
        </Link>
      </div>

      <div className="reel-caption">
        {category && (
          <Link href={`/shop?category=${category.slug}`} className="chip glass-dark">
            {category.name}
          </Link>
        )}
        <h2 className="font-display mt-2 text-[1.9rem] leading-[1.15] font-extrabold text-white">
          <Link href={href}>{product.name}</Link>
        </h2>
        {product.tagline && <p className="mt-1 line-clamp-2 text-sm text-white/75">{product.tagline}</p>}
        <div className="mt-3 flex items-center gap-3">
          <p className="font-latin text-2xl font-extrabold text-white tabular-nums">{formatMoney(effectivePrice(product), s)}</p>
          {isOnSale(product) && <p className="font-latin text-sm text-white/55 line-through tabular-nums">{formatMoney(product.price, s)}</p>}
          {product.colors.length > 1 && (
            <ul className="ms-auto flex -space-x-1.5" aria-label={`${product.colors.length} ألوان`}>
              {product.colors.slice(0, 5).map((c) => (
                <li key={c.name} className="size-5 rounded-full ring-2 ring-black/60" style={{ background: c.hex }} title={c.name} />
              ))}
            </ul>
          )}
        </div>
        {!out && <p className="mt-3 text-[0.7rem] text-white/50">{simple ? "اضغطي مرتين على الصورة للإضافة السريعة" : "اضغطي مرتين على الصورة لاختيار اللون والمقاس"}</p>}
      </div>
    </Reel>
  );
}

/** Categories hang on a clothes rail; the hangers swing as the rail is swiped. */
export function RackReel({ title, cats, counts }: { title: string; cats: Category[]; counts: (id: string) => number }) {
  const railRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = rail.scrollLeft;
    let lastT = performance.now();
    let settle = 0;
    const onScroll = () => {
      const now = performance.now();
      const v = (rail.scrollLeft - last) / Math.max(1, now - lastT);
      last = rail.scrollLeft;
      lastT = now;
      rail.style.setProperty("--swing", `${Math.max(-14, Math.min(14, v * 9)).toFixed(2)}deg`);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => rail.style.setProperty("--swing", "0deg"), 90);
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      rail.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <Reel label={title} className="rack-reel">
      <div className="relative z-10 flex h-full flex-col justify-center pt-16 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="container-x flex items-end justify-between">
          <h2 className="font-display text-4xl font-black text-white">{title}</h2>
          <Link href="/shop" className="pop chip glass-dark min-h-9 px-4">
            كل المنتجات
          </Link>
        </div>
        <div className="rack-bar mt-8" aria-hidden />
        <ul ref={railRef} className="rack no-scrollbar">
          {cats.map((c, i) => (
            <li key={c.id} className="rack-item" style={{ "--d": `${(i % 3) * 0.25}s` } as React.CSSProperties}>
              <Link href={`/shop?category=${c.slug}`} className="rack-hanger group block">
                <svg viewBox="0 0 60 34" className="rack-hook" aria-hidden>
                  <path d="M30 2c4 0 6 3 6 6s-3 5-6 6v4M30 18 4 32h52Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="rack-card">
                  <SmartImage src={c.image} alt="" className="absolute inset-0" fallbackLabel={c.name} />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-10 pb-3 text-white">
                    <span className="font-display block text-lg leading-tight font-extrabold">{c.name}</span>
                    <span className="block text-[0.7rem] text-white/70">{piecesLabel(counts(c.id))}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-white/45">اسحبي القسم جانبًا</p>
      </div>
    </Reel>
  );
}

/** The products shown as reels: the admin's hero picks first, then new arrivals, then the rest. */
export function useReelProducts(limit = 8) {
  const { data } = useStore();
  const visible = visibleProducts(data).filter((p) => p.images[0]);
  const hero = data.homepage.hero;
  const picks = [hero.heroProductId, hero.cardProductId].map((id) => visible.find((p) => p.id === id)).filter(Boolean) as Product[];
  const fresh = visible.filter((p) => p.newArrival).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ordered = [...picks, ...fresh, ...visible];
  return ordered.filter((p, i) => ordered.findIndex((x) => x.id === p.id) === i).slice(0, limit);
}
