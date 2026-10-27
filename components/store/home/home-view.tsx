"use client";

import { useStore } from "@/components/providers/store-provider";
import { visibleProducts } from "@/lib/commerce";
import { Hero } from "./hero";
import {
  BundlesSection,
  CategoriesSection,
  FollowSection,
  ProductRail,
  PromoSection,
  StorySection,
  ValueStrip,
} from "./sections";

export function HomeView() {
  const { data } = useStore();
  const products = visibleProducts(data);
  const newArrivals = products
    .filter((p) => p.newArrival)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bestsellers = products.filter((p) => p.bestseller);

  return (
    <>
      <Hero />
      <ValueStrip />
      {data.homepage.sections
        .filter((s) => s.enabled)
        .map((section) => {
          switch (section.key) {
            case "categories":
              return <CategoriesSection key={section.key} section={section} />;
            case "newArrivals":
              return <ProductRail key={section.key} section={section} products={newArrivals} href="/shop?sort=newest" />;
            case "bestsellers":
              return <ProductRail key={section.key} section={section} products={bestsellers} href="/shop?sort=bestselling" />;
            case "bundles":
              return <BundlesSection key={section.key} section={section} />;
            case "promo":
              return <PromoSection key={section.key} />;
            case "story":
              return <StorySection key={section.key} section={section} />;
            case "follow":
              return <FollowSection key={section.key} section={section} />;
            default:
              return null;
          }
        })}
    </>
  );
}
