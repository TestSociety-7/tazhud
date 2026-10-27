"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { Mandala, Star8 } from "@/components/ui/mandala";
import { effectivePrice, formatMoney, visibleProducts } from "@/lib/commerce";

export function Hero() {
  const { data } = useStore();
  const hero = data.homepage.hero;
  const artRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const cheapestHijab = visibleProducts(data)
    .filter((p) => p.categoryId === "cat-hijabs")
    .map(effectivePrice)
    .sort((a, b) => a - b)[0];

  // Subtle parallax: the artwork drifts slower than the page.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        if (artRef.current) artRef.current.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
        if (floatRef.current) floatRef.current.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
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
      <div className="pattern-geo absolute inset-0 -z-10 opacity-[0.08]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-forest/40 to-transparent" aria-hidden />
      <div className="container-x grid items-center gap-10 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow flex animate-fade-up items-center gap-2 text-gold">
            <Star8 className="size-3" /> {hero.eyebrow}
          </p>
          <h1 className="font-display mt-5 animate-fade-up text-[2.6rem] leading-[1.25] text-balance text-ivory [animation-delay:120ms] sm:text-6xl lg:text-[4.6rem]">
            {hero.title}{" "}
            <em className="font-display bg-gradient-to-l from-gold-bright via-gold-soft to-gold bg-clip-text font-medium text-transparent italic">
              {hero.titleAccent}
            </em>
          </h1>
          <p className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-pretty text-ivory/75 [animation-delay:240ms] sm:text-lg">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            <Link href={hero.primaryHref || "/shop"} className="btn btn-gold group/cta">
              {hero.primaryLabel}
              <ArrowLeft className="size-4 transition-transform group-hover/cta:-translate-x-1" />
            </Link>
            {hero.secondaryLabel && (
              <Link href={hero.secondaryHref || "/shop"} className="btn btn-outline text-ivory">
                {hero.secondaryLabel}
              </Link>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-[30rem]">
          <Mandala className="absolute top-1/2 left-1/2 -z-10 size-[135%] -translate-x-1/2 -translate-y-1/2 text-gold/25 motion-safe:animate-spin-slow" />
          <div ref={artRef} className="will-change-transform">
            <div className="arch-full relative aspect-[4/5] overflow-hidden ring-1 ring-gold/40 ring-offset-8 ring-offset-ink">
              <SmartImage src={hero.image} alt="أزياء محتشمة من المجموعة الجديدة" priority unveil className="absolute inset-0" />
            </div>
          </div>
          {hero.secondaryImage && (
            <div ref={floatRef} className="absolute -bottom-6 -start-3 w-[40%] will-change-transform sm:-start-10">
              <div className="animate-fade-up rounded-[1.25rem] bg-ivory p-2 shadow-[var(--shadow-lift)] [animation-delay:600ms]">
                <SmartImage src={hero.secondaryImage} alt="" className="aspect-square rounded-xl" />
                {cheapestHijab != null && (
                  <p className="px-1.5 pt-2 pb-1 text-[0.7rem] leading-tight text-muted">
                    طرح ابتداءً من <strong className="text-ink">{formatMoney(cheapestHijab, data.settings)}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
