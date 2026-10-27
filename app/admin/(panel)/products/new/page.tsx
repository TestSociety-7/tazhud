import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/pages/product-editor";

export const metadata: Metadata = { title: "منتج جديد" };

export default function Page() {
  return <ProductEditor />;
}
