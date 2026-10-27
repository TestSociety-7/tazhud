import type { Metadata } from "next";
import { CouponsPage } from "@/components/admin/pages/catalog";

export const metadata: Metadata = { title: "Coupons" };

export default function Page() {
  return <CouponsPage />;
}
