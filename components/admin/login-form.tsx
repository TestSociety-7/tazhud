"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { LogoCoin } from "./fx";

export function LoginForm({ demoPasscode }: { demoPasscode: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("خطأ في الاتصال. تحقق من الإنترنت وحاول مجددًا.");
      setBusy(false);
    }
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
              aria-describedby={error ? "pass-err" : demoPasscode ? "pass-hint" : undefined}
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
          {demoPasscode && (
            <p id="pass-hint" className="mt-4 rounded-lg bg-gold/10 p-3 text-xs leading-relaxed text-gold-soft">
              الوضع التجريبي: لم يتم ضبط <code>ADMIN_PASSCODE</code>، لذلك كلمة المرور هي <strong className="font-mono">{demoPasscode}</strong>. اضبط كلمة مرور خاصة في Vercel قبل مشاركة الموقع.
            </p>
          )}
        </form>
        <Link href="/" className="mt-6 flex min-h-10 items-center justify-center gap-2 text-sm text-ivory/60 hover:text-ivory">
          <ArrowRight className="size-4" /> العودة إلى المتجر
        </Link>
      </main>
    </div>
  );
}
