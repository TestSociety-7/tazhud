"use client";

import Link from "next/link";
import { markWelcomed, WelcomeMark, WelcomeScene } from "./welcome";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [shake, setShake] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) {
      setError("أدخل كلمة المرور.");
      setShake((n) => n + 1);
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
        setShake((n) => n + 1);
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
    return <WelcomeScene title="أهلًا بك" note="جارٍ فتح لوحة التحكم…" />;
  }

  return (
    <div className="on-dark admin-night relative grid min-h-dvh place-items-center px-4 py-10">
      <span className="night-stars" aria-hidden />
      <main className="admin-enter relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="float-3d">
            <WelcomeMark size="size-28" pad="p-8" orbit="6rem" enter={false} />
          </div>
          <p className="mt-3 text-sm font-semibold text-gold-bright">أهلًا من جديد</p>
          <h1 className="font-display mt-1 text-[2.6rem] leading-tight">
            <span className="pearl-text">لوحة التحكم</span>
          </h1>
          <p className="mt-2 text-sm text-ivory/65">اكتب كلمة المرور للدخول.</p>
        </div>
        <form
          key={shake}
          onSubmit={submit}
          noValidate
          className={`login-card glass-dark pearl-ring mt-8 p-5 sm:p-6 ${shake ? "login-shake" : ""}`}
        >
          <label htmlFor="passcode" className="label !text-ivory/85">كلمة المرور</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 start-4 size-[1.1rem] -translate-y-1/2 text-ivory/45" aria-hidden />
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
              className="field login-input ltr !pe-12 !ps-12"
              autoFocus
            />
            <button type="button" className="icon-btn absolute top-1/2 end-1 size-11 -translate-y-1/2 text-ivory/60 hover:!bg-white/10" onClick={() => setShow((s) => !s)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {show ? <EyeOff className="size-[1.1rem]" /> : <Eye className="size-[1.1rem]" />}
            </button>
          </div>
          {error && <p id="pass-err" className="error-text !mt-2.5 !text-sm !text-[#ffb3bf]" role="alert">{error}</p>}
          <button type="submit" className="btn btn-pearl mt-5 min-h-14 w-full text-base" disabled={busy}>
            {busy ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
        <Link href="/" className="mt-6 flex min-h-11 items-center justify-center gap-2 text-sm text-ivory/60 transition-colors hover:text-ivory">
          <ArrowRight className="size-4" /> العودة إلى المتجر
        </Link>
      </main>
    </div>
  );
}
