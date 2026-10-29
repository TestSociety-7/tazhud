import type { Metadata } from "next";
import { Suspense } from "react";
import { ReturnsPage } from "@/components/admin/pages/returns";

export const metadata: Metadata = { title: "الإرجاع والاستبدال" };

export default function Page() {
  return (
    <Suspense>
      <ReturnsPage />
    </Suspense>
  );
}
