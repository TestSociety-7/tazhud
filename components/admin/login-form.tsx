"use client";

import Link from "next/link";
import { markWelcomed, WelcomeMark } from "./welcome";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { LogoCoin } from "@/components/ui/fx";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) {
      setError("أدخل كلمة المرور.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "تعذّر تسجيل الدخول. حاول مجددًا.");
        setBusy(false);
        return;
      }
      const next = params.get("next");
      const target = next && next.startsWith("/admin") ? next : "/admin";
      router.prefetch(target);
      markWelcomed();
      setWelcome(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        router.replace(target);
        router.refresh();
      }, reduced ? 300 : 1500);
    } catch {
      setError("خطأ في الاتصال. تحقق من الإنترنت وحاول مجددًا.");
      setBusy(false);
    }
  }

  if (welcome) {
    return (
      <div className="on-dark relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 text-center text-ivory" role="status">
        <div className="pattern-geo absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="welcome-glow pointer-events-none absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/25 blur-3xl" aria-hidden />
        <div className="relative">
          <WelcomeMark />
          <p className="welcome-text font-display mt-7 text-5xl">أهلًا بك</p>
          <p className="welcome-text mt-2 text-sm text-gold" style={{ animationDelay: "560ms" }}>جارٍ فتح لوحة التحكم…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="on-dark relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-12 text-ivory">
      <div className="pattern-geo absolute inset-0 opacity-[0.07]" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl" aria-hidden />
      <main className="admin-enter relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoCoin className="size-24" />
          <h1 className="font-display mt-5 text-4xl">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-ivory/60">سجّل الدخول لإدارة المنتجات والطلبات وواجهة المتجر.</p>
        </div>
        <form onSubmit={submit} noValidate className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] backdrop-blur">
          <label htmlFor="passcode" className="label !text-ivory">كلمة المرور</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-ivory/40" aria-hidden />
            <input
              id="passcode"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "pass-err" : undefined}
              className="field ltr !border-white/15 !bg-black/20 !pe-9 !ps-11 !text-ivory"
              autoFocus
            />
            <button type="button" className="icon-btn absolute top-1/2 end-0.5 size-10 -translate-y-1/2 text-ivory/60" onClick={() => setShow((s) => !s)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && <p id="pass-err" className="error-text !text-[#f0a99c]" role="alert">{error}</p>}
          <button type="submit" className="btn btn-gold mt-5 w-full" disabled={busy}>
            {busy ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
        <Link href="/" className="mt-6 flex min-h-10 items-center justify-center gap-2 text-sm text-ivory/60 hover:text-ivory">
          <ArrowRight className="size-4" /> العودة إلى المتجر
        </Link>
      </main>
    </div>
  );
}
