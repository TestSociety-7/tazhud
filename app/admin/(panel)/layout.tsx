import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StoreProvider } from "@/components/providers/store-provider";
import { isDemoPasscode } from "@/lib/admin-auth";
import { hasSharedStorage } from "@/lib/server/storage";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة تحكم تزهّد" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // The provider sits inside the boundary so its data loads only after the shell has hydrated.
    <Suspense fallback={<div className="min-h-dvh bg-ink" aria-busy="true" />}>
      <StoreProvider shared={hasSharedStorage()} scope="admin">
        <AdminShell demoPasscode={isDemoPasscode()}>{children}</AdminShell>
      </StoreProvider>
    </Suspense>
  );
}
