import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPage } from "@/components/admin/pages/products";

export const metadata: Metadata = { title: "المنتجات" };

export default function Page() {
  return (
    <Suspense>
      <ProductsPage />
    </Suspense>
  );
}
