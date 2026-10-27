import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductEditor } from "@/components/admin/pages/product-editor";

export const metadata: Metadata = { title: "Edit product" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      {params.then(({ id }) => (
        <ProductEditor key={id} productId={id} />
      ))}
    </Suspense>
  );
}
