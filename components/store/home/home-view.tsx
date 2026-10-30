"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { bundleDetails, visibleProducts } from "@/lib/commerce";
import { AllProductsSection, BundlesSection, HowToOrder, PromoSection } from "./sections";
import { CoverReel, ProductReel, RackReel, Reel, ReelsFeed, useReelProducts } from "./reels";

export function HomeView() {
  const { data } = useStore();
  const reels = useReelProducts();
  const cats = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const counts = (id: string) => visibleProducts(data).filter((p) => p.categoryId === id).length;

  // Only give a slide to sections that have something to show.
  // The date is read after loading, so an expired code drops its slide without blocking the page.
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the date is only known in the browser
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const promoOn =
    data.settings.couponsEnabled &&
    data.coupons.some((c) => c.code === data.homepage.promo.couponCode && c.active && !(today && c.expiresOn && c.expiresOn < today));
  const bundlesOn = data.bundles.some((b) => bundleDetails(b, data.products).available);

  return (
    <>
      <ReelsFeed>
        <CoverReel picks={reels} />
        {reels.map((p, i) => (
          <ProductReel key={p.id} product={p} index={i + 1} total={reels.length} />
        ))}
        {data.homepage.sections
          .filter((s) => s.enabled)
          .map((section) => {
            switch (section.key) {
              case "categories":
                return cats.length ? <RackReel key={section.key} title={section.title} cats={cats} counts={counts} /> : null;
              case "bundles":
                return bundlesOn ? (
                  <Reel key={section.key} label={section.title} className="panel-reel">
                    <BundlesSection section={section} />
                  </Reel>
                ) : null;
              case "promo":
                return promoOn ? (
                  <Reel key={section.key} label="عرض خاص" className="panel-reel">
                    <PromoSection />
                  </Reel>
                ) : null;
              default:
                return null;
            }
          })}
      </ReelsFeed>
      <div className="reels-after">
        <AllProductsSection />
        <HowToOrder />
      </div>
    </>
  );
}
