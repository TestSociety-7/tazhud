"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { SmartImage } from "@/components/ui/smart-image";
import { Cloth } from "@/components/ui/cloth";
import { effectivePrice, formatMoney, visibleProducts } from "@/lib/commerce";
import { SEASON_WORDS, SeasonHeroDecor, SeasonIcon, useSeason } from "../season";

/**
 * The opening of the home page: a length of the featured fabric hangs from a brass rod
 * and moves with the page and the customer's finger, with its price on a swing tag.
 */
export function Hero() {
  const { data } = useStore();
  const hero = data.homepage.hero;
  const season = useSeason();

  // The admin can choose the product printed on the cloth and the one on the small tag.
  const visible = visibleProducts(data);
  const chosen = (id: string) => (id ? visible.find((p) => p.id === id && p.images[0]) : undefined);
  const heroProduct = chosen(hero.heroProductId);
  const cardProduct = chosen(hero.cardProductId);
  // Otherwise the tag points to the cheapest hijab.
  const hijab = visible
    .filter((p) => p.categoryId === "cat-hijabs" && p.images[0])
    .sort((a, b) => effectivePrice(a) - effectivePrice(b))[0];
  const mainImage = heroProduct?.images[0] || hero.image;
  const tagProduct = heroProduct ?? cardProduct ?? hijab;

  return (
    <section className="relative isolate overflow-hidden">
      <SeasonHeroDecor />
      <div className="container-x grid gap-x-14 pt-6 pb-14 sm:pt-10 lg:grid-cols-2 lg:grid-rows-[1fr_auto_1fr] lg:pt-14 lg:pb-20">
        <div className="relative z-10 lg:col-start-1 lg:row-start-2">
          <div className="flex animate-fade-up flex-wrap items-center gap-2">
            {season !== "original" && (
              <span className="season-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                <SeasonIcon season={season} />
                {SEASON_WORDS[season].badge}
              </span>
            )}
            <span className="woven-label">{hero.eyebrow || "أزياء محتشمة · طرح وعبايات"}</span>
          </div>
          <h1 className="chalk mt-4 animate-fade-up text-[2.3rem] leading-[1.25] text-balance text-ink [animation-delay:100ms] sm:text-6xl lg:text-[4.4rem]">
            {hero.title}{" "}
            {hero.titleAccent && <span className="text-forest">{hero.titleAccent}</span>}
          </h1>
          <span className="stitch line-grow mt-5 w-32 [animation-delay:400ms]" aria-hidden />
          {hero.subtitle && (
            <p className="mt-5 hidden max-w-md animate-fade-up text-lg leading-relaxed text-pretty text-muted [animation-delay:200ms] lg:block">
              {hero.subtitle}
            </p>
          )}
          <div className="mt-8 hidden animate-fade-up gap-3 [animation-delay:300ms] lg:flex">
            <HeroLinks />
          </div>
        </div>

        <div className="relative mt-6 animate-fade-up [animation-delay:150ms] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mt-0">
          <Cloth
            src={mainImage}
            hint="اسحبي القماش بإصبعك"
            className="mx-auto aspect-[6/7] w-[80%] max-w-[27rem] sm:w-[62%] lg:aspect-[4/5] lg:w-full"
            still={<SmartImage src={mainImage} alt={heroProduct?.name ?? "أزياء محتشمة من تزهّد"} priority className="size-full" />}
          >
            {tagProduct && (
              <Link
                href={`/product/${tagProduct.slug}`}
                className="hero-tag -start-[6%] bottom-[16%] sm:-start-[10%]"
                aria-label={`${tagProduct.name}، ${formatMoney(effectivePrice(tagProduct), data.settings)}`}
              >
                <span className="swing-tag flex-col !items-start !gap-0 py-1.5">
                  <span className="max-w-[8.5rem] truncate font-sans text-[0.7rem] font-medium text-muted">
                    {tagProduct === hijab && !heroProduct && !cardProduct ? "طرح ابتداءً من" : tagProduct.name}
                  </span>
                  <span className="text-[0.95rem]">{formatMoney(effectivePrice(tagProduct), data.settings)}</span>
                </span>
              </Link>
            )}
          </Cloth>
        </div>

        <div className="relative z-10 mt-8 lg:hidden">
          {hero.subtitle && <p className="max-w-md text-base leading-relaxed text-pretty text-muted">{hero.subtitle}</p>}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <HeroLinks />
          </div>
        </div>
      </div>
    </section>
  );

  function HeroLinks() {
    return (
      <>
        <Link href={hero.primaryHref || "/shop"} className="press btn btn-primary group/cta">
          {hero.primaryLabel || "تسوّقي الآن"}
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover/cta:-translate-x-1" />
        </Link>
        <Link href={hero.secondaryHref || "/shop?category=hijabs"} className="press btn btn-outline text-forest">
          {hero.secondaryLabel || "اكتشفي الطرح"}
        </Link>
      </>
    );
  }
}
