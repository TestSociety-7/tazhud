import type { Metadata } from "next";
import { ReturnsView } from "@/components/store/returns-view";

export const metadata: Metadata = { title: "إرجاع أو استبدال", robots: { index: false, follow: true } };

export default function ReturnsPage() {
  return <ReturnsView />;
}
