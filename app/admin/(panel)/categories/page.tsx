import type { Metadata } from "next";
import { CategoriesPage } from "@/components/admin/pages/catalog";

export const metadata: Metadata = { title: "Categories" };

export default function Page() {
  return <CategoriesPage />;
}
