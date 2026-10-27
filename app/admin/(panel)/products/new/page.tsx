import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/pages/product-editor";

export const metadata: Metadata = { title: "New product" };

export default function Page() {
  return <ProductEditor />;
}
