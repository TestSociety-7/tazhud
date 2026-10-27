import type { Metadata } from "next";
import { PoliciesView } from "@/components/store/policies-view";

export const metadata: Metadata = { title: "Delivery, returns & policies" };

export default function PoliciesPage() {
  return <PoliciesView />;
}
