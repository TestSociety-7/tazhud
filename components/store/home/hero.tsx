"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { LogoCoin } from "@/components/ui/fx";
import { Silk } from "@/components/ui/silk";
import { effectivePrice, formatMoney, visibleProducts } from "@/lib/commerce";
import { SEASON_WORDS, SeasonHeroDecor, SeasonIcon, useSeason } from "../season";

export function Hero() {
  const { data } = useStore();
  const hero = data.homepage.hero;
  const season = useSeason();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // The admin can choose a product for the big capsule and for the small card.
  const visible = visibleProducts(data);
  const chosen = (id: string) => (id ? visible.find((p) => p.id === id && p.images[0]) : undefined);
  const heroProduct = chosen(hero.heroProductId);
  const cardProduct = chosen(hero.cardProductId);
  // Otherwise the small card shows the cheapest hijab.
  const hijab = visible
    .filter((p) => p.categoryId === "cat-hijabs" && p.images[0])
    .sort((a, b) => effectivePrice(a) - effectivePrice(b))[0];
  const mainImage = heroProduct?.images[0] || hero.image;
  const detailImage = cardProduct
    ? cardProduct.images[0]
    : hero.secondaryImage || hijab?.images[1] || hijab?.images[0];
  const cardHref = cardProduct
    ? `/product/${cardProduct.slug}`
    : hijab
      ? `/product/${hijab.slug}`
      : "/shop?category=hijabs";

  // The capsule turns in 3D towards the finger or pointer, and tips back as the page scrolls.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: 0, y: 0, s: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    let raf = 0;
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      cur.s += (target.s - cur.s) * 0.12;
      stage.style.setProperty("--ry", `${(cur.x * 14).toFixed(2)}deg`);
      stage.style.setProperty("--rx", `${(-cur.y * 10 + cur.s * 18).toFixed(2)}deg`);
      stage.style.setProperty("--lift", `${(cur.s * -40).toFixed(1)}px`);
      if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) + Math.abs(target.s - cur.s) > 0.002)
        raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };
    const onScroll = () => {
      target.s = Math.min(1, window.scrollY / Math.max(1, section.offsetHeight));
      kick();
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero-silk on-dark relative isolate overflow-hidden text-ivory">
      <Silk />
      <div className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-ink/50 via-transparent to-ink/70" aria-hidden />
      <SeasonHeroDecor />

      <div className="container-x relative grid min-h-[calc(100svh-7rem)] content-center items-center gap-9 pt-10 pb-16 lg:min-h-[44rem] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16 lg:pb-24">
        <div className="relative z-10 order-2 max-w-xl text-center lg:order-1 lg:text-start">
          {season !== "original" && (
            <p className="season-chip mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold">
              <SeasonIcon season={season} />
              {SEASON_WORDS[season].badge}
            </p>
          )}
          <p className="glass-dark mx-auto inline-flex animate-fade-up items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium text-gold-soft lg:mx-0">
            <span className="size-1.5 rounded-full bg-gold-bright shadow-[0_0_10px_2px] shadow-gold-bright/70 motion-safe:animate-pulse" aria-hidden />
            {hero.eyebrow || "أزياء محتشمة · طرح وعبايات"}
          </p>
          <h1 className="hero-title font-display mt-4 text-[2.3rem] leading-[1.25] text-balance sm:text-6xl lg:text-[4.4rem]">
            <span className="hero-word block">{hero.title}</span>
            {hero.titleAccent && (
              <span className="hero-word pearl-text mt-1 block pb-2 text-[1.3em] leading-[1.15] [font-family:var(--font-callig)] [animation-delay:160ms]">
                {hero.titleAccent}
              </span>
            )}
          </h1>
          {hero.subtitle && (
            <p className="mx-auto mt-3 max-w-md animate-fade-up text-[0.9rem] leading-relaxed text-pretty text-ivory/75 [animation-delay:320ms] sm:text-lg lg:mx-0">
              {hero.subtitle}
            </p>
          )}
          <div className="mt-6 grid animate-fade-up grid-cols-[1.4fr_1fr] gap-2.5 [animation-delay:440ms] sm:flex sm:justify-center lg:justify-start">
            <Link href={hero.primaryHref || "/shop"} className="press btn btn-pearl group/cta min-h-13 px-4 text-[0.95rem]">
              {hero.primaryLabel || "تسوّقي الآن"}
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover/cta:-translate-x-1" />
            </Link>
            <Link href={hero.secondaryHref || "/shop?category=hijabs"} className="press btn btn-glass min-h-13 px-4 text-ivory">
              {hero.secondaryLabel || "اكتشفي الطرح"}
            </Link>
          </div>
        </div>

        <div className="hero-stage-wrap relative order-1 mx-auto w-[min(50vw,15rem)] animate-fade-up [animation-delay:200ms] sm:w-[19rem] lg:order-2 lg:w-[21rem]">
          <div ref={stageRef} className="hero-stage relative">
            <span className="moon-glow -inset-[18%]" aria-hidden />
            <Orbit half="back" />
            <div className="float-3d relative">
              <div className="capsule pearl-ring relative aspect-[3/4.2] overflow-hidden shadow-[0_50px_90px_-40px_rgb(0_0_0/0.95)]">
                <SmartImage
                  src={mainImage}
                  alt={heroProduct?.name ?? "أزياء محتشمة من تزهّد"}
                  priority
                  unveil
                  className="absolute inset-0"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-white/10" aria-hidden />
                <div className="hero-glare pointer-events-none absolute inset-0" aria-hidden />
                {heroProduct && (
                  <Link href={`/product/${heroProduct.slug}`} className="absolute inset-0 z-10 flex items-end justify-center pb-6">
                    <span className="glass-dark rounded-full px-3.5 py-1.5 text-xs text-ivory sm:text-sm">
                      {heroProduct.name} ·{" "}
                      <strong className="text-gold-soft">{formatMoney(effectivePrice(heroProduct), data.settings)}</strong>
                    </span>
                  </Link>
                )}
              </div>
            </div>
            <Orbit half="front" />

            <LogoCoin hat className="absolute top-2 -end-[30%] z-20 size-14 sm:-end-3 sm:-top-2 sm:size-20" />

            {detailImage && (
              <Link
                href={cardHref}
                className="hero-card glass press absolute -bottom-4 -start-[38%] z-20 block w-[52%] rounded-[1.2rem] p-1.5 text-ink sm:-start-[22%] sm:w-[46%]"
              >
                <SmartImage src={detailImage} alt="" className="leaf aspect-square" />
                {cardProduct ? (
                  <p className="px-1.5 pt-1.5 pb-0.5 text-[0.7rem] leading-tight text-muted">
                    <span className="line-clamp-1">{cardProduct.name}</span>
                    <strong className="text-ink">{formatMoney(effectivePrice(cardProduct), data.settings)}</strong>
                  </p>
                ) : (
                  hijab && (
                    <p className="px-1.5 pt-1.5 pb-0.5 text-[0.7rem] leading-tight text-muted">
                      طرح ابتداءً من <strong className="text-ink">{formatMoney(effectivePrice(hijab), data.settings)}</strong>
                    </p>
                  )
                )}
              </Link>
            )}
          </div>
        </div>
      </div>

      <a href="#after-hero" className="absolute bottom-4 left-1/2 z-10 grid -translate-x-1/2 place-items-center gap-1 text-[0.7rem] text-ivory/60" aria-label="انزلي للأسفل">
        <ChevronDown className="size-5 motion-safe:animate-bounce" />
      </a>
    </section>
  );
}

/** A pearl ring around the capsule: the far half is drawn behind it and the near half in front, with a bead running along. */
function Orbit({ half }: { half: "back" | "front" }) {
  const d = half === "back" ? "M4 30A96 22 0 0 1 196 30" : "M4 30A96 22 0 0 0 196 30";
  return (
    <svg
      viewBox="0 0 200 60"
      className={`hero-orbit pointer-events-none absolute top-[56%] left-1/2 w-[145%] -translate-x-1/2 -translate-y-1/2 overflow-visible ${half === "front" ? "z-[15]" : ""}`}
      style={{ transform: `translateZ(${half === "front" ? 50 : -50}px)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`orbit-${half}`} x1="0" x2="1">
          <stop offset="0" stopColor="#ecb9a5" stopOpacity={half === "back" ? 0.25 : 0.9} />
          <stop offset="0.5" stopColor="#b9adf6" stopOpacity={half === "back" ? 0.35 : 1} />
          <stop offset="1" stopColor="#9fdcd6" stopOpacity={half === "back" ? 0.25 : 0.9} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#orbit-${half})`} strokeWidth={half === "back" ? 0.6 : 0.9} />
      {half === "front" && (
        <circle r="2.6" className="hero-bead" fill="#fff">
          <animateMotion dur="9s" repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>
      )}
    </svg>
  );
}
