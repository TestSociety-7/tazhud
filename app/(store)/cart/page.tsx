import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "سلة التسوق" };

export default function CartPage() {
  return <CartView />;
}
