import type { Metadata } from "next";
import { HomepageEditor } from "@/components/admin/pages/homepage";

export const metadata: Metadata = { title: "الصفحة الرئيسية" };

export default function Page() {
  return <HomepageEditor />;
}
