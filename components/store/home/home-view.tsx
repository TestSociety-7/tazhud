"use client";

import { useStore } from "@/components/providers/store-provider";
import { visibleProducts } from "@/lib/commerce";
import { Hero } from "./hero";
import { AllProductsSection, CategoriesSection, HowToOrder, ProductRail, PromoSection, TrustBand } from "./sections";

export function HomeView() {
  const { data } = useStore();
  const newArrivals = visibleProducts(data)
    .filter((p) => p.newArrival)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Hero />
      <TrustBand />
      {data.homepage.sections
        .filter((s) => s.enabled)
        .map((section) => {
          switch (section.key) {
            case "categories":
              return <CategoriesSection key={section.key} section={section} />;
            case "newArrivals":
              return <ProductRail key={section.key} section={section} products={newArrivals} href="/shop?sort=newest" />;
            case "promo":
              return <PromoSection key={section.key} />;
            default:
              return null;
          }
        })}
      <AllProductsSection />
      <HowToOrder />
    </>
  );
}
