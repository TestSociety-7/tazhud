import type { Metadata } from "next";
import { BundlesPage } from "@/components/admin/pages/catalog";

export const metadata: Metadata = { title: "الباقات" };

export default function Page() {
  return <BundlesPage />;
}
