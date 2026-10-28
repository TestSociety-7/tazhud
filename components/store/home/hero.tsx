"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { Mandala, Star8 } from "@/components/ui/mandala";
import { LogoCoin, Tilt } from "@/components/ui/fx";
import { effectivePrice, formatMoney, visibleProducts } from "@/lib/commerce";

export function Hero() {
  const { data } = useStore();
  const hero = data.homepage.hero;
  const artRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  // Cheapest hijab, shown on the floating card next to the main image.
  const hijab = visibleProducts(data)
    .filter((p) => p.categoryId === "cat-hijabs" && p.images[0])
    .sort((a, b) => effectivePrice(a) - effectivePrice(b))[0];
  const detailImage =
    hero.secondaryImage || hijab?.images[1] || hijab?.images[0];

  // The artwork drifts slower than the page and the small card faster, for depth.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        if (artRef.current)
          artRef.current.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
        if (floatRef.current)
          floatRef.current.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink text-ivory">
      <div
        className="pattern-geo absolute inset-0 -z-10 opacity-[0.08]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-forest/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 -start-40 -z-10 size-[34rem] rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />

      <div className="container-x grid items-center gap-12 pt-10 pb-20 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24">
        <div className="relative z-10 max-w-xl">
          <p className="flex animate-fade-up items-center gap-2 text-sm font-semibold text-gold">
            <Star8 className="size-3 motion-safe:animate-spin-slow" />{" "}
            {hero.eyebrow || "أزياء محتشمة · طرح وعبايات"}
          </p>
          <h1 className="font-display mt-5 animate-fade-up text-[2.7rem] leading-[1.2] text-balance [animation-delay:120ms] sm:text-6xl lg:text-[4.6rem]">
            {hero.title}{" "}
            {hero.titleAccent && (
              <span className="text-gold-gradient">{hero.titleAccent}</span>
            )}
          </h1>
          <span
            className="line-grow mt-6 block h-px w-28 bg-gradient-to-l from-gold to-transparent [animation-delay:350ms]"
            aria-hidden
          />
          {hero.subtitle && (
            <p className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-pretty text-ivory/75 [animation-delay:240ms] sm:text-lg">
              {hero.subtitle}
            </p>
          )}
          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            <Link
              href={hero.primaryHref || "/shop"}
              className="press sheen btn btn-gold group/cta"
            >
              {hero.primaryLabel || "تسوّقي الآن"}
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover/cta:-translate-x-1" />
            </Link>
            <Link
              href={hero.secondaryHref || "/shop?category=hijabs"}
              className="press btn btn-outline text-ivory"
            >
              {hero.secondaryLabel || "اكتشفي الطرح"}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[25rem] animate-fade-up [animation-delay:150ms] lg:max-w-[30rem]">
          <Mandala className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[135%] -translate-x-1/2 -translate-y-1/2 text-gold/25 motion-safe:animate-spin-slow" />
          <div ref={artRef} className="will-change-transform">
            <Tilt max={6} className="rounded-t-full">
              <div className="arch-full relative aspect-[4/5] overflow-hidden shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)] ring-1 ring-gold/40 ring-offset-8 ring-offset-ink">
                <SmartImage
                  src={hero.image}
                  alt="أزياء محتشمة من تزهّد"
                  priority
                  unveil
                  className="absolute inset-0"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
            </Tilt>
          </div>

          <LogoCoin className="absolute -top-3 -end-1 size-16 sm:-end-4 sm:size-20" />

          {detailImage && (
            <div
              ref={floatRef}
              className="absolute -bottom-8 -start-3 w-[42%] will-change-transform sm:-start-10"
            >
              <div className="animate-fade-up [animation-delay:600ms]">
                <Link
                  href={
                    hijab ? `/product/${hijab.slug}` : "/shop?category=hijabs"
                  }
                  className="float-soft block rounded-[1.25rem] bg-ivory p-2 text-ink shadow-[var(--shadow-lift)]"
                >
                  <SmartImage
                    src={detailImage}
                    alt=""
                    className="aspect-square rounded-xl"
                  />
                  {hijab && (
                    <p className="px-1.5 pt-2 pb-1 text-[0.72rem] leading-tight text-muted">
                      طرح ابتداءً من{" "}
                      <strong className="text-ink">
                        {formatMoney(effectivePrice(hijab), data.settings)}
                      </strong>
                    </p>
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
