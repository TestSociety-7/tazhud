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
      <div className="on-dark adm-cloth relative grid min-h-dvh place-items-center overflow-hidden px-4 text-center" role="status">
        <div className="welcome-glow pointer-events-none absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="relative">
          <WelcomeMark />
          <p className="welcome-text font-display mt-7 text-5xl">أهلًا بك</p>
          <span className="intro-thread mt-4" aria-hidden />
          <p className="welcome-text mt-4 text-sm text-gold-soft" style={{ animationDelay: "560ms" }}>جارٍ فتح لوحة التحكم…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="on-dark adm-cloth relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      {/* A brass rod across the top, as if the cloth hangs from it. */}
      <div className="cloth-rod !inset-x-6 !top-5 opacity-90" aria-hidden />
      <main className="admin-enter relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoCoin className="size-20" float={false} />
          <h1 className="font-display mt-5 text-[2.6rem] leading-tight">لوحة التحكم</h1>
          <span className="intro-thread mt-3" aria-hidden />
          <p className="mt-4 text-sm text-ivory/70">دفتر الطلبات والمنتجات وواجهة المتجر.</p>
        </div>
        <div className="relative mt-9 drop-shadow-[0_30px_40px_rgb(20_5_12/0.55)]">
          <span className="pin-head absolute -top-1.5 left-1/2 z-10 -translate-x-1/2" aria-hidden />
          <form onSubmit={submit} noValidate className="pinked stitch-box-soft rounded-t-[1.25rem] bg-paper px-6 pt-8 pb-9 text-text">
            <label htmlFor="passcode" className="label">كلمة المرور</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
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
                className="field ltr font-latin !pe-11 !ps-10"
                autoFocus
              />
              <button type="button" className="icon-btn absolute top-1/2 end-0 -translate-y-1/2 text-muted" onClick={() => setShow((s) => !s)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error && <p id="pass-err" className="error-text" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>
              {busy ? "جارٍ الدخول…" : "دخول"}
            </button>
          </form>
        </div>
        <Link href="/" className="mt-7 flex min-h-11 items-center justify-center gap-2 text-sm text-ivory/65 transition-colors hover:text-ivory">
          <ArrowRight className="size-4" /> العودة إلى المتجر
        </Link>
      </main>
    </div>
  );
}
