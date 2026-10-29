import type { Metadata } from "next";
import { Suspense } from "react";
import { BundlesPage } from "@/components/admin/pages/bundles";

export const metadata: Metadata = { title: "المجموعات" };

export default function Page() {
  return (
    <Suspense>
      <BundlesPage />
    </Suspense>
  );
}
