import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/store/shop-view";
import { ProductGridSkeleton } from "@/components/store/product-card";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop hijabs, abayas, dresses, co-ord sets and essentials.",
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
