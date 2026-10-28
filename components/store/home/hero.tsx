"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";

export function Hero() {
  const { data } = useStore();
  const hero = data.homepage.hero;

  return (
    <section className="on-dark bg-ink text-ivory">
      <div className="container-x grid items-center gap-8 pt-8 pb-12 sm:pt-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
        <div className="max-w-xl">
          {hero.eyebrow && <p className="mb-3 text-sm text-gold">{hero.eyebrow}</p>}
          <h1 className="font-display text-[2.4rem] leading-[1.25] text-balance sm:text-5xl lg:text-6xl">
            {hero.title} {hero.titleAccent && <span className="text-gold">{hero.titleAccent}</span>}
          </h1>
          {hero.subtitle && <p className="mt-4 max-w-md text-base leading-relaxed text-ivory/70">{hero.subtitle}</p>}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={hero.primaryHref || "/shop"} className="btn btn-gold">
              {hero.primaryLabel || "تسوّقي الآن"}
              <ArrowLeft className="size-4" />
            </Link>
            {hero.secondaryLabel && (
              <Link href={hero.secondaryHref || "/shop"} className="btn btn-outline text-ivory">
                {hero.secondaryLabel}
              </Link>
            )}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <SmartImage src={hero.image} alt="أزياء محتشمة من تزهّد" priority className="absolute inset-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
