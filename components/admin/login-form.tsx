"use client";

import Link from "next/link";
import { markWelcomed, StoryBars, StudioBackdrop, WelcomeMark } from "./welcome";
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
      <div className="studio-stage relative grid min-h-dvh place-items-center px-6 text-center" role="status">
        <StudioBackdrop />
        <StoryBars ms={1500} />
        <div className="relative">
          <WelcomeMark />
          <p className="cine-mask mt-8">
            <span className="cine-line studio-title text-6xl" style={{ animationDelay: "300ms" }}>أهلًا بك</span>
          </p>
          <p className="cine-mask mt-2">
            <span className="cine-line text-sm font-bold text-gold-bright" style={{ animationDelay: "480ms" }}>جارٍ فتح لوحة التحكم…</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-stage relative flex min-h-dvh flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <StudioBackdrop />
      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="studio-list flex flex-col items-center text-center">
          <span className="story-ring is-live !size-28">
            <span className="story-face overflow-hidden !border-4">
              <LogoCoin className="size-full" float={false} />
            </span>
          </span>
          <h1 className="studio-title mt-6 text-[2.75rem] sm:text-6xl">لوحة التحكم</h1>
          <p className="mt-2 max-w-[18rem] text-sm text-muted">سجّل الدخول لإدارة المنتجات والطلبات وواجهة المتجر.</p>
        </div>
        <form onSubmit={submit} noValidate className="admin-enter glass-dark mt-9 rounded-[1.75rem] p-5 sm:p-6" style={{ animationDelay: "200ms" }}>
          <label htmlFor="passcode" className="label">كلمة المرور</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 start-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
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
              className="field studio-field ltr !pe-12 !ps-12"
              autoFocus
            />
            <button type="button" className="icon-btn absolute top-1/2 end-1 size-11 -translate-y-1/2 text-muted" onClick={() => setShow((s) => !s)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          {error && <p id="pass-err" className="error-text" role="alert">{error}</p>}
          <button type="submit" className="btn btn-neon pop mt-5 min-h-14 w-full rounded-full text-base" disabled={busy}>
            {busy ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
      </main>
      <Link href="/" className="relative mx-auto mt-6 flex min-h-11 items-center justify-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowRight className="size-4" /> العودة إلى المتجر
      </Link>
    </div>
  );
}
