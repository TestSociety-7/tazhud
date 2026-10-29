import type { Metadata } from "next";
import { MyOrdersView } from "@/components/store/my-orders-view";

export const metadata: Metadata = { title: "طلباتي", robots: { index: false, follow: true } };

export default function MyOrdersPage() {
  return <MyOrdersView />;
}
