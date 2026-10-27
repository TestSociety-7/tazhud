import type { Metadata } from "next";
import { SettingsPage } from "@/components/admin/pages/settings";

export const metadata: Metadata = { title: "إعدادات المتجر" };

export default function Page() {
  return <SettingsPage />;
}
