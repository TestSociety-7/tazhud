import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/store/shop-view";
import { ProductGridSkeleton } from "@/components/store/product-card";

export const metadata: Metadata = {
  title: "المتجر",
  description: "تسوّقي الطرح والعبايات والفساتين والأطقم والأساسيات.",
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="container-x py-24">
          <ProductGridSkeleton />
        </div>
      }
    >
      <ShopView />
    </Suspense>
  );
}
