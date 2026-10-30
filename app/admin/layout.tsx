import type { Metadata } from "next";
import "../styles/atelier-admin.css";

export const metadata: Metadata = {
  manifest: "/admin-app.webmanifest",
  appleWebApp: { capable: true, title: "إدارة تزهّد", statusBarStyle: "black" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
