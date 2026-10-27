import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { isDemoPasscode } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Tazhud Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ink" aria-busy="true" />}>
      <AdminShell demoPasscode={isDemoPasscode()}>{children}</AdminShell>
    </Suspense>
  );
}
