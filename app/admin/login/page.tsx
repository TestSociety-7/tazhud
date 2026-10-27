import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { DEMO_PASSCODE, isDemoPasscode } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm demoPasscode={isDemoPasscode() ? DEMO_PASSCODE : null} />
    </Suspense>
  );
}
